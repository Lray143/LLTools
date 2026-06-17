import { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react'
import { Hash, User, Users, MessageSquare, Wifi } from 'lucide-react'
import ChatSidebar from './components/ChatSidebar'
import ChatMessages from './components/ChatMessages'
import ChatInput from './components/ChatInput'
import NotificationBell from '../../components/ui/NotificationBell'

const DEPARTMENTS = [
  'Sales', 'HR', 'Accounting', 'Admin', 'Warehouse'
]
const GLOBAL_ROLES = ['admin', 'hr']

const getRoomId = (user1Id, user2Id) =>
  `DM_${[String(user1Id), String(user2Id)].sort().join('_')}`

export default function Chat({ currentUser, refreshKey, typingUsers = {}, onNavigate }) {
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
  const [replyTo, setReplyTo]             = useState(null)
  const messagesEndRef = useRef(null)
  const autoScrollNextRenderRef = useRef(false)
  const scrollContainerRef = useRef(null)
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
    Promise.all([
      window.electronAPI.getEmployees(),
      window.electronAPI.getUsers()
    ])
      .then(([emps, users]) => {
        const systemUsers = users
          .filter(u => !u.employeeId)
          .map(u => ({
            id: String(u.id),
            employee_no: u.username,
            name: u.role === 'admin' ? 'Administrator' : (u.role === 'hr' ? 'HR Dept' : u.username),
            department: 'System',
            position: u.role.toUpperCase()
          }))

        const allPeople = [...emps, ...systemUsers].filter(e => 
          e.id !== currentUser?.employeeId && 
          String(e.id) !== String(currentUser?.id) &&
          currentUser?.username !== e.employee_no
        )
        setEmployees(allPeople)
      })
      .catch(console.error)
    loadSidebarData()
  }, [currentUser?.id, currentUser?.employeeId, currentUser?.username, loadSidebarData])

  // Sidebar reloads are handled inside the refreshKey effect below (lines 133-140)

  // ── Mark current room as read when user switches rooms ───────────────────
  useEffect(() => {
    const roomId = activeTab === 'channels'
      ? selectedDept
      : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
    if (!roomId) return
    window.electronAPI.markChatAsRead(myParticipantId, roomId)
      .then(loadSidebarData)
      .catch(console.error)
  }, [selectedDept, selectedUser, activeTab])

  // Check if user is scrolled near the bottom of the messages container
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  // ── Load messages when room changes ──────────────────────────────────────
  const loadMessages = useCallback(async (forceScroll = false) => {
    const reqRoomId = activeTab === 'channels' ? selectedDept : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
    if (!reqRoomId) return
    const wasNearBottom = isNearBottom()
    try {
      let msgs = []
      if (activeTab === 'channels') {
        msgs = await window.electronAPI.getChatMessages(selectedDept)
      } else {
        msgs = await window.electronAPI.getDirectMessages(reqRoomId)
      }
      
      const receipts = await window.electronAPI.getRoomReceipts(reqRoomId)
      setReadReceipts(receipts)
      
      // Mark that we need to scroll after the next render completes
      if (forceScroll || wasNearBottom) {
        autoScrollNextRenderRef.current = true
      }

      startTransition(() => {
        setMessageCache(prev => {
          const oldStr = JSON.stringify(prev[reqRoomId] || [])
          const newStr = JSON.stringify(msgs || [])
          if (oldStr === newStr) return prev
          return { ...prev, [reqRoomId]: msgs || [] }
        })
      })
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }, [activeTab, selectedDept, selectedUser, myParticipantId, isNearBottom])

  // Handle the actual scrolling AFTER React commits the new messages to the DOM
  const activeRoomId = activeTab === 'channels' ? selectedDept : getRoomId(myParticipantId, selectedUser?.id)
  useEffect(() => {
    if (autoScrollNextRenderRef.current) {
      autoScrollNextRenderRef.current = false
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [messageCache[activeRoomId]])

  // Room switch → always scroll to bottom
  useEffect(() => {
    setReplyTo(null)
    loadMessages(true)
  }, [selectedDept, selectedUser, activeTab])

  // Background sync → only scroll if already near bottom
  useEffect(() => {
    if (isTypingRef.current) {
      pendingRefresh.current = true
    } else {
      loadMessages(false)
      loadSidebarData()
    }
  }, [refreshKey])

  // Receipts are already fetched inside loadMessages() — no separate effect needed

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (e, forcedFileUrl = null, forcedId = null) => {
    if (e) e.preventDefault()
    if (!inputMsg.trim() && !forcedFileUrl) return
    setIsSending(true)
    const roomId = activeTab === 'channels' ? selectedDept : getRoomId(myParticipantId, selectedUser.id)
    
    let finalMsgText = inputMsg.trim() || (forcedFileUrl ? 'Sent an attachment' : '')
    if (replyTo && finalMsgText) {
      // Strip any existing [reply] tags from the message we are replying to
      const cleanReplyMsg = (replyTo.message || 'Attachment').replace(/^\[reply\][\s\S]*?\[\/reply\]\n?/, '')
      const replySnippet = cleanReplyMsg.replace(/\n/g, ' ').substring(0, 80)
      finalMsgText = `[reply]${replyTo.senderName}|${replySnippet}[/reply]\n${finalMsgText}`
    }

    try {
      if (activeTab === 'channels') {
        const msgData = {
          id: forcedId || crypto.randomUUID(), department: selectedDept,
          senderId: myParticipantId,
          senderName: currentUser.employeeName || currentUser.username,
          message: finalMsgText, fileUrl: forcedFileUrl
        }
        setMessageCache(prev => ({
          ...prev, [roomId]: [...(prev[roomId] || []), { ...msgData, createdAt: new Date().toISOString() }]
        }))
        setInputMsg('')
        setReplyTo(null)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)
        await window.electronAPI.sendChatMessage(msgData)
      } else if (activeTab === 'dms' && selectedUser) {
        const msgData = {
          id: forcedId || crypto.randomUUID(), roomId,
          senderId: myParticipantId,
          senderName: currentUser.employeeName || currentUser.username,
          message: finalMsgText, fileUrl: forcedFileUrl
        }
        setMessageCache(prev => ({
          ...prev, [roomId]: [...(prev[roomId] || []), { ...msgData, createdAt: new Date().toISOString() }]
        }))
        setInputMsg('')
        setReplyTo(null)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)
        await window.electronAPI.sendDirectMessage(msgData)
      }

      window.electronAPI.markChatAsRead(myParticipantId, roomId).catch(console.error)
      loadSidebarData()
      // Notify other clients instantly via Pusher
      window.electronAPI?.sendPusherEvent?.({
        channel: 'lltools-updates',
        event: 'new-message',
        data: { roomId }
      }).catch(() => {})
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setIsSending(false)
    }
  }

  // ── Typing detection ─ pauses background refresh mid-keystroke ───────────
  const lastTypingPusherSent = useRef(0)
  const handleTyping = useCallback(() => {
    isTypingRef.current = true
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false
      if (pendingRefresh.current) {
        pendingRefresh.current = false
        loadMessages()
        loadSidebarData()
      }
    }, 1500)
    // Broadcast typing event via Pusher at most once every 2 seconds
    const now = Date.now()
    if (now - lastTypingPusherSent.current < 2000) return
    lastTypingPusherSent.current = now
    const roomId = activeTab === 'channels' ? selectedDept : (selectedUser ? getRoomId(myParticipantId, selectedUser?.id) : null)
    if (!roomId) return
    window.electronAPI?.sendPusherEvent?.({
      channel: 'lltools-updates',
      event: 'typing',
      data: {
        roomId,
        userId: myParticipantId,
        userName: (currentUser.employeeName || currentUser.username || '').split(' ')[0]
      }
    }).catch(() => {})
  }, [loadMessages, loadSidebarData, activeTab, selectedDept, selectedUser, myParticipantId, currentUser])

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsUploadingFile(true)
    try {
      const msgId = crypto.randomUUID()
      const msgType = activeTab === 'dms' ? 'dm' : 'channel'
      
      // OPTIMIZATION: Pass the file path natively instead of serializing huge arrays over IPC
      const fileData = file.path || await file.arrayBuffer()
      const fileUrl = await window.electronAPI.uploadAttachment(fileData, file.name, file.type, msgId, msgType)
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

  const channelMembers = useMemo(() => {
    if (activeTab !== 'channels') return []
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

  // Count total unreads for the header badge
  const totalUnreads = useMemo(() => {
    const deptUnreads = sidebarData.departments.filter(d => d.unread).length
    const dmUnreads = sidebarData.dms.filter(d => d.unread).length
    return deptUnreads + dmUnreads
  }, [sidebarData])

  // Context info for header strip
  const contextInfo = useMemo(() => {
    if (activeTab === 'channels') {
      const memberCount = employees.filter(e => e.department === selectedDept).length
      return { type: 'channel', name: selectedDept, memberCount }
    }
    if (selectedUser) {
      return { type: 'dm', name: selectedUser.name, position: selectedUser.position, department: selectedUser.department }
    }
    return { type: 'none' }
  }, [activeTab, selectedDept, selectedUser, employees])

  // ── Optimistic Action Handlers ────────────────────────────────────────────
  const handleToggleReaction = useCallback((msgId, senderId, userName, emoji, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept
    setMessageCache(prev => {
      const msgs = prev[roomId] || []
      return {
        ...prev,
        [roomId]: msgs.map(m => {
          if (m.id !== msgId) return m
          const reactions = { ...m.reactions }
          const users = reactions[emoji] || []
          const idx = users.findIndex(u => String(u.userId) === String(senderId))
          if (idx !== -1) {
            users.splice(idx, 1)
            if (users.length === 0) delete reactions[emoji]
          } else {
            reactions[emoji] = [...users, { userId: senderId, userName }]
          }
          return { ...m, reactions }
        })
      }
    })
    window.electronAPI?.toggleReaction?.(msgId, senderId, userName, emoji, isDm)
  }, [selectedDept, selectedUser, myParticipantId])

  const handleEditMessage = useCallback((msgId, senderId, newMsg, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept
    setMessageCache(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(m => m.id === msgId ? { ...m, message: newMsg, isEdited: true } : m)
    }))
    window.electronAPI?.editMessage?.(msgId, senderId, newMsg, isDm)
  }, [selectedDept, selectedUser, myParticipantId])

  const handleUnsendMessage = useCallback((msgId, senderId, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept
    setMessageCache(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(m => m.id === msgId ? { ...m, isUnsent: true } : m)
    }))
    window.electronAPI?.unsendMessage?.(msgId, senderId, isDm)
  }, [selectedDept, selectedUser, myParticipantId])

  const handleDeleteForMe = useCallback((msgId, senderId, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept
    setMessageCache(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(m => {
        if (m.id === msgId) {
          const deletedFor = [...(m.deletedFor || []), String(senderId)]
          return { ...m, deletedFor }
        }
        return m
      })
    }))
    window.electronAPI?.deleteForMe?.(msgId, senderId, isDm)
  }, [selectedDept, selectedUser, myParticipantId])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>

      {/* ── TOP HEADER BAR (matches app-wide pattern) ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b shrink-0"
        style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Chats</h1>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time messaging & team communication
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}>
            <Wifi size={12} style={{ color: '#16a34a' }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Synced</span>
          </div>

          {/* Unread badge */}
          {totalUnreads > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}>
              <MessageSquare size={12} style={{ color: 'var(--theme-500)' }} />
              <span style={{ color: 'var(--theme-500)', fontWeight: 600 }}>{totalUnreads} unread</span>
            </div>
          )}

          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 min-h-0 flex p-6 gap-4">

        <ChatSidebar
          activeTab={activeTab} setActiveTab={setActiveTab}
          sortedDepts={sortedDepts} selectedDept={selectedDept} setSelectedDept={setSelectedDept}
          sortedEmployees={sortedEmployees} selectedUser={selectedUser} setSelectedUser={setSelectedUser}
          isUnread={isUnread} currentUser={currentUser} getRoomId={getRoomId} sidebarData={sidebarData}
        />

        {/* ── MAIN CHAT AREA ── */}
        <div className="flex-1 flex flex-col rounded-xl shadow-sm overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>

          {/* Context strip */}
          <div className="px-5 py-3 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {activeTab === 'channels' ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--page-bg-alt)' }}>
                  <Hash size={16} style={{ color: 'var(--theme-500)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {selectedDept}
                  </h2>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {contextInfo.memberCount} member{contextInfo.memberCount !== 1 ? 's' : ''} • Real-time sync active
                  </p>
                </div>
              </div>
            ) : selectedUser ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--theme-500)', color: 'var(--accent-text)' }}>
                  {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedUser.name}
                  </h2>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {selectedUser.position || 'Employee'} • {selectedUser.department}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--page-bg-alt)' }}>
                  <Users size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Direct Messages</h2>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Select a conversation to start</p>
                </div>
              </div>
            )}

            {/* Message count badge */}
            <div className="text-[11px] px-2.5 py-1 rounded-md"
              style={{ background: 'var(--page-bg-alt)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {currentMessages.length} message{currentMessages.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 chat-scroll" style={{ background: 'var(--page-bg-alt)' }}>
            <ChatMessages
              messages={currentMessages}
              currentUser={currentUser}
              activeTab={activeTab}
              selectedUser={selectedUser}
              readReceipts={readReceipts}
              setReplyTo={setReplyTo}
              onToggleReaction={handleToggleReaction}
              onEditMessage={handleEditMessage}
              onUnsendMessage={handleUnsendMessage}
              onDeleteForMe={handleDeleteForMe}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {(() => {
            const typers = currentRoomId ? (typingUsers[currentRoomId] || []) : []
            if (typers.length === 0) return null
            let label
            if (typers.length === 1) label = `${typers[0]} is typing...`
            else if (typers.length === 2) label = `${typers[0]} and ${typers[1]} are typing...`
            else label = 'Several people are typing...'
            return (
              <div className="flex items-center gap-2 px-5 py-1.5 shrink-0"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', minHeight: 28 }}>
                <div className="flex gap-0.5">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{label}</span>
              </div>
            )
          })()}

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
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />
        </div>
      </div>
    </div>
  )
}
