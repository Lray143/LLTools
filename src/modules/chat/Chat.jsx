import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Hash, User } from 'lucide-react'
import ChatSidebar from './components/ChatSidebar'
import ChatMessages from './components/ChatMessages'
import ChatInput from './components/ChatInput'

const DEPARTMENTS = [
  'HR', 'Admin', 'Accounting', 'Finance', 'Sales',
  'Marketing', 'Warehouse', 'Production', 'IT', 'Intern'
]
const GLOBAL_ROLES = ['admin', 'hr']

const getRoomId = (user1Id, user2Id) =>
  `DM_${[String(user1Id), String(user2Id)].sort().join('_')}`

export default function Chat({ currentUser, refreshKey }) {
  const [activeTab, setActiveTab]         = useState('channels')
  const [messageCache, setMessageCache]   = useState({})
  const [inputMsg, setInputMsg]           = useState('')
  const [isSending, setIsSending]         = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [employees, setEmployees]         = useState([])
  const [sidebarData, setSidebarData]     = useState({ departments: [], dms: [] })
  const [readReceipts, setReadReceipts]   = useState([])
  const [selectedDept, setSelectedDept]   = useState(currentUser?.department || 'Admin')
  const [selectedUser, setSelectedUser]   = useState(null)
  const messagesEndRef = useRef(null)
  // Track typing so background refreshes don't interrupt mid-keystroke
  const isTypingRef    = useRef(false)
  const typingTimer    = useRef(null)
  const pendingRefresh = useRef(false)

  const canSeeAll = GLOBAL_ROLES.includes(currentUser?.role)
  const myParticipantId = currentUser.employeeId || String(currentUser.id)

  // ── Sidebar data (unread counts + ordering) ───────────────────────────────
  const loadSidebarData = useCallback(async () => {
    try {
      const data = await window.electronAPI.getChatSidebarData(myParticipantId)
      setSidebarData(data)
    } catch (err) {
      console.error('Failed to load sidebar data', err)
    }
  }, [myParticipantId])

  // ── Load employees once ───────────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getEmployees()
      .then(data => setEmployees(data.filter(e =>
        e.id !== currentUser?.employeeId && currentUser?.username !== e.employee_no
      )))
      .catch(console.error)
    loadSidebarData()
  }, [currentUser?.id, currentUser?.employeeId, currentUser?.username, loadSidebarData])

  // Refresh sidebar on cloud sync
  useEffect(() => { loadSidebarData() }, [refreshKey])

  // ── Mark current room as read when user switches rooms ───────────────────
  // NOTE: Do NOT include messages.length here — that would fire on every new
  // incoming message and cause a DB write + sync that makes typing lag.
  useEffect(() => {
    const roomId = activeTab === 'channels'
      ? selectedDept
      : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
    if (!roomId) return
    window.electronAPI.markChatAsRead(myParticipantId, roomId)
      .then(loadSidebarData)
      .catch(console.error)
  }, [selectedDept, selectedUser, activeTab])

  // ── Load messages when room changes ──────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const reqRoomId = activeTab === 'channels' ? selectedDept : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
    if (!reqRoomId) return
    try {
      let msgs = []
      if (activeTab === 'channels') {
        msgs = await window.electronAPI.getChatMessages(selectedDept)
      } else {
        msgs = await window.electronAPI.getDirectMessages(reqRoomId)
      }
      
      const receipts = await window.electronAPI.getRoomReceipts(reqRoomId)
      setReadReceipts(receipts)
      
      setMessageCache(prev => ({ ...prev, [reqRoomId]: msgs || [] }))
      
      // Auto-scroll down but only if we haven't switched rooms while fetching
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 50)
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }, [activeTab, selectedDept, selectedUser, myParticipantId])

  // Load messages immediately when room changes
  useEffect(() => {
    loadMessages()
  }, [selectedDept, selectedUser, activeTab])

  // On cloud sync (refreshKey), only reload messages if the user is NOT typing.
  // If they ARE typing, set a flag and reload as soon as they stop.
  useEffect(() => {
    if (isTypingRef.current) {
      // User is mid-keystroke — just mark that a refresh is pending
      pendingRefresh.current = true
    } else {
      loadMessages()
      loadSidebarData()
    }
  }, [refreshKey])

  // Also refresh receipts periodically or when refreshKey changes
  const refreshReceipts = useCallback(async () => {
    const reqRoomId = activeTab === 'channels' ? selectedDept : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
    if (!reqRoomId) return
    try {
      const receipts = await window.electronAPI.getRoomReceipts(reqRoomId)
      setReadReceipts(receipts)
    } catch (e) { }
  }, [activeTab, selectedDept, selectedUser, myParticipantId])

  useEffect(() => {
    refreshReceipts()
  }, [refreshKey, refreshReceipts])

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (e, forcedFileUrl = null, forcedId = null) => {
    if (e) e.preventDefault()
    if (!inputMsg.trim() && !forcedFileUrl) return
    setIsSending(true)
    const roomId = activeTab === 'channels' ? selectedDept : getRoomId(myParticipantId, selectedUser.id)
    
    try {
      if (activeTab === 'channels') {
        const msgData = {
          id: forcedId || crypto.randomUUID(), department: selectedDept,
          senderId: myParticipantId,
          senderName: currentUser.employeeName || currentUser.username,
          message: inputMsg.trim() || 'Sent an attachment', fileUrl: forcedFileUrl
        }
        setMessageCache(prev => ({
          ...prev, [roomId]: [...(prev[roomId] || []), { ...msgData, createdAt: new Date().toISOString() }]
        }))
        setInputMsg('')
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)
        await window.electronAPI.sendChatMessage(msgData)
      } else if (activeTab === 'dms' && selectedUser) {
        const msgData = {
          id: forcedId || crypto.randomUUID(), roomId,
          senderId: myParticipantId,
          senderName: currentUser.employeeName || currentUser.username,
          message: inputMsg.trim() || 'Sent an attachment', fileUrl: forcedFileUrl
        }
        setMessageCache(prev => ({
          ...prev, [roomId]: [...(prev[roomId] || []), { ...msgData, createdAt: new Date().toISOString() }]
        }))
        setInputMsg('')
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)
        await window.electronAPI.sendDirectMessage(msgData)
      }

      window.electronAPI.markChatAsRead(myParticipantId, roomId).catch(console.error)
      loadSidebarData()
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setIsSending(false)
    }
  }

  // ── Typing detection ─ pauses background refresh mid-keystroke ───────────
  const handleTyping = useCallback(() => {
    isTypingRef.current = true
    clearTimeout(typingTimer.current)
    // After 1.5 seconds of no typing, flush any pending refresh
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false
      if (pendingRefresh.current) {
        pendingRefresh.current = false
        loadMessages()
        loadSidebarData()
      }
    }, 1500)
  }, [loadMessages, loadSidebarData])

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsUploadingFile(true)
    try {
      // Generate the message ID here so we can pass it to the uploader
      // The main process uses it to patch the DB record once R2 upload completes
      const msgId = crypto.randomUUID()
      const msgType = activeTab === 'dms' ? 'dm' : 'channel'
      const arrayBuffer = await file.arrayBuffer()
      const fileUrl = await window.electronAPI.uploadAttachment(arrayBuffer, file.name, file.type, msgId, msgType)
      await handleSend(null, fileUrl, msgId)
    } catch (err) {
      console.error('File upload error', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploadingFile(false)
    }
  }

  // ── Sidebar derived state ─────────────────────────────────────────────────
  const visibleDepts = useMemo(() => {
    if (canSeeAll) return DEPARTMENTS
    if (currentUser.department) return [currentUser.department]
    return []
  }, [canSeeAll, currentUser.department])

  const sortedDepts = useMemo(() =>
    [...visibleDepts].sort((a, b) => {
      const aT = sidebarData.departments.find(d => d.roomId === a)?.lastMsgAt
      const bT = sidebarData.departments.find(d => d.roomId === b)?.lastMsgAt
      return (bT ? new Date(bT).getTime() : 0) - (aT ? new Date(aT).getTime() : 0)
    }), [visibleDepts, sidebarData.departments])

  const sortedEmployees = useMemo(() =>
    [...employees].sort((a, b) => {
      const aT = sidebarData.dms.find(d => d.roomId === getRoomId(myParticipantId, a.id))?.lastMsgAt
      const bT = sidebarData.dms.find(d => d.roomId === getRoomId(myParticipantId, b.id))?.lastMsgAt
      return (bT ? new Date(bT).getTime() : 0) - (aT ? new Date(aT).getTime() : 0)
    }), [employees, sidebarData.dms, myParticipantId])

  // Members visible in the current channel (used for @mentions)
  const channelMembers = useMemo(() => {
    if (activeTab !== 'channels') return []
    // Include ALL employees in that dept (not filtered by current user)
    return employees.filter(e => e.department === selectedDept)
  }, [activeTab, employees, selectedDept])

  const isUnread = useCallback((roomId, isDept = false) => {
    const list = isDept ? sidebarData.departments : sidebarData.dms
    const entry = list.find(d => d.roomId === roomId)
    if (isDept && activeTab === 'channels' && selectedDept === roomId) return false
    if (!isDept && activeTab === 'dms' && selectedUser &&
      getRoomId(myParticipantId, selectedUser.id) === roomId) return false
    return entry?.unread || false
  }, [sidebarData, activeTab, selectedDept, selectedUser, myParticipantId])

  const inputDisabled = activeTab === 'dms' && !selectedUser
  const currentRoomId = activeTab === 'channels' ? selectedDept : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
  const currentMessages = currentRoomId ? (messageCache[currentRoomId] || []) : []

  return (
    <div className="flex h-full p-4 gap-4" style={{ background: 'var(--page-bg)' }}>

      <ChatSidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        sortedDepts={sortedDepts} selectedDept={selectedDept} setSelectedDept={setSelectedDept}
        sortedEmployees={sortedEmployees} selectedUser={selectedUser} setSelectedUser={setSelectedUser}
        isUnread={isUnread} currentUser={currentUser} getRoomId={getRoomId} sidebarData={sidebarData}
      />

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center shadow-sm z-10" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {activeTab === 'channels' ? (
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Hash size={20} style={{ color: 'var(--accent-bg)' }} />
                {selectedDept}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Real-time synchronization active.</p>
            </div>
          ) : selectedUser ? (
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <User size={20} style={{ color: 'var(--accent-bg)' }} />
                {selectedUser.name}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{selectedUser.position || 'Employee'} • {selectedUser.department}</p>
            </div>
          ) : (
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Direct Messages</h1>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--page-bg-alt)' }}>
          <ChatMessages
            messages={currentMessages}
            currentUser={currentUser}
            activeTab={activeTab}
            selectedUser={selectedUser}
            readReceipts={readReceipts}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          inputMsg={inputMsg}
          setInputMsg={setInputMsg}
          onSend={handleSend}
          onFileChange={handleFileChange}
          isSending={isSending}
          isUploadingFile={isUploadingFile}
          disabled={inputDisabled}
          onTyping={handleTyping}
          members={channelMembers}
          activeTab={activeTab}
        />
      </div>
    </div>
  )
}
