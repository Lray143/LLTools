import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, startTransition } from 'react'
import Pusher from 'pusher-js'
import { Hash, User, Users, MessageSquare, Wifi, Sidebar } from 'lucide-react'
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

function chatMessagesFingerprint(msgs) {
  return (msgs || []).map(m =>
    `${m.id}|${m.message}|${m.isUnsent ? 1 : 0}|${m.isEdited ? 1 : 0}|${JSON.stringify(m.reactions || {})}`
  ).join('\n')
}

export default function Chat({ currentUser, refreshKey, typingUsers = {}, onNavigate }) {
  const [activeTab, setActiveTab]         = useState('channels')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
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
  const [onlineUsers, setOnlineUsers]     = useState(new Set())
  const messagesEndRef = useRef(null)
  const pendingScrollRef = useRef(null) // 'instant' | 'smooth' | null
  const lastScrolledRoomRef = useRef(null)
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

  const pusherMessageUpdated = useCallback((data) => {
    window.electronAPI?.sendPusherEvent?.({
      channel: 'lltools-updates',
      event: 'message-updated',
      data,
    }).catch(() => {})
  }, [])

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

  // ── Pusher: instant updates on other clients (reactions, messages, edits) ─
  const myParticipantIdRef = useRef(myParticipantId)
  const loadSidebarDataRef = useRef(loadSidebarData)
  useEffect(() => { myParticipantIdRef.current = myParticipantId }, [myParticipantId])
  useEffect(() => { loadSidebarDataRef.current = loadSidebarData }, [loadSidebarData])

  useEffect(() => {
    if (!import.meta.env.VITE_PUSHER_KEY) return

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    })
    const channel = pusher.subscribe('lltools-updates')

    channel.bind('user-online', (data) => {
      if (data?.userId) {
        setOnlineUsers(prev => new Set([...prev, String(data.userId)]))
      }
    })

    channel.bind('user-offline', (data) => {
      if (data?.userId) {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          next.delete(String(data.userId))
          return next
        })
      }
    })

    channel.bind('reaction-updated', (data) => {
      const myId = String(myParticipantIdRef.current)
      if (String(data?.actorId) === myId) return
      if (!data?.roomId || !data?.msgId) return

      setMessageCache(prev => {
        const msgs = prev[data.roomId]
        if (!msgs) return prev
        return {
          ...prev,
          [data.roomId]: msgs.map(m =>
            m.id === data.msgId ? { ...m, reactions: data.reactions ?? {} } : m
          ),
        }
      })
    })

    channel.bind('new-message', (data) => {
      const myId = String(myParticipantIdRef.current)
      if (data?.senderId && String(data.senderId) === myId) return
      if (!data?.roomId || !data?.message?.id) return

      setMessageCache(prev => {
        const existing = prev[data.roomId] || []
        if (existing.some(m => m.id === data.message.id)) return prev
        return { ...prev, [data.roomId]: [...existing, data.message] }
      })
      loadSidebarDataRef.current()
    })

    channel.bind('message-updated', (data) => {
      const myId = String(myParticipantIdRef.current)
      if (String(data?.actorId) === myId) return
      if (!data?.roomId || !data?.msgId) return

      setMessageCache(prev => {
        const msgs = prev[data.roomId]
        if (!msgs) return prev
        return {
          ...prev,
          [data.roomId]: msgs.map(m => {
            if (m.id !== data.msgId) return m
            if (data.type === 'edit') return { ...m, message: data.message, isEdited: true }
            if (data.type === 'unsend') return { ...m, isUnsent: true, message: null, fileUrl: null }
            return m
          }),
        }
      })
      loadSidebarDataRef.current()
    })

    return () => {
      channel.unbind('user-online')
      channel.unbind('user-offline')
      channel.unbind('reaction-updated')
      channel.unbind('new-message')
      channel.unbind('message-updated')
      pusher.unsubscribe('lltools-updates')
      pusher.disconnect()
    }
  }, [])

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

  // ── Broadcast online/offline on app startup and close (NOT on focus/blur) ─
  useEffect(() => {
    const broadcastOnline = () => {
      window.electronAPI?.sendPusherEvent?.({
        channel: 'lltools-updates',
        event: 'user-online',
        data: { userId: myParticipantId },
      }).catch(() => {})
    }

    const broadcastOffline = () => {
      window.electronAPI?.sendPusherEvent?.({
        channel: 'lltools-updates',
        event: 'user-offline',
        data: { userId: myParticipantId },
      }).catch(() => {})
    }

    // Broadcast online once when app loads (only once on mount)
    broadcastOnline()

    // Broadcast offline when window closes or app unloads
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on app close
      const data = new FormData()
      data.append('event', 'user-offline')
      data.append('userId', myParticipantId)
      navigator.sendBeacon('broadcast-offline', data)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Optional: Send heartbeat every 5 minutes to confirm still online
    // This helps if Pusher connection drops without triggering offline
    const heartbeatInterval = setInterval(() => {
      broadcastOnline()
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(heartbeatInterval)
      broadcastOffline()
    }
  }, [myParticipantId])

  // Check if user is scrolled near the bottom of the messages container
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  const scrollToBottomInstant = useCallback(() => {
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Programmatic smooth scroll localized to the container
  const scrollToBottomSmooth = useCallback(() => {
    const el = scrollContainerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  // ── Load messages when room changes ──────────────────────────────────────
  const loadMessages = useCallback(async (forceScroll = false) => {
    const reqRoomId = activeTab === 'channels' ? selectedDept : (selectedUser ? getRoomId(myParticipantId, selectedUser.id) : null)
    if (!reqRoomId) return
    const wasNearBottom = isNearBottom()
    try {
      // Fetch messages AND receipts in parallel — cuts load time in half
      const [msgs, receipts] = await Promise.all([
        activeTab === 'channels'
          ? window.electronAPI.getChatMessages(selectedDept)
          : window.electronAPI.getDirectMessages(reqRoomId),
        window.electronAPI.getRoomReceipts(reqRoomId)
      ])

      setReadReceipts(receipts)

      if (forceScroll) {
        pendingScrollRef.current = 'instant'
      } else if (wasNearBottom) {
        pendingScrollRef.current = 'smooth'
      }

      startTransition(() => {
        setMessageCache(prev => {
          const oldMsgs = prev[reqRoomId] || []
          const newMsgs = msgs || []
          if (chatMessagesFingerprint(oldMsgs) === chatMessagesFingerprint(newMsgs)) return prev
          return { ...prev, [reqRoomId]: newMsgs }
        })
      })
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }, [activeTab, selectedDept, selectedUser, myParticipantId, isNearBottom])

  const activeRoomId = activeTab === 'channels' ? selectedDept : getRoomId(myParticipantId, selectedUser?.id)

  // Room switch → jump to bottom instantly (before paint, no scroll animation)
  useLayoutEffect(() => {
    const roomChanged = lastScrolledRoomRef.current !== activeRoomId
    if (roomChanged) {
      lastScrolledRoomRef.current = activeRoomId
      scrollToBottomInstant()
      return
    }

    const mode = pendingScrollRef.current
    if (!mode) return
    pendingScrollRef.current = null

    if (mode === 'instant') scrollToBottomInstant()
    else scrollToBottomSmooth()
  }, [activeRoomId, messageCache[activeRoomId], scrollToBottomInstant, scrollToBottomSmooth])

  // Room switch → load messages for the new room
  useEffect(() => {
    setReplyTo(null)
    pendingScrollRef.current = 'instant'
    loadMessages(true)
  }, [selectedDept, selectedUser, activeTab])

  // Background sync → only scroll if already near bottom; run both in parallel
  useEffect(() => {
    if (isTypingRef.current) {
      pendingRefresh.current = true
    } else {
      Promise.all([loadMessages(false), loadSidebarData()])
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
      // Strip ALL [reply] tags from the quoted message so reply-to-reply renders cleanly
      const cleanReplyMsg = (replyTo.message || 'Attachment').replace(/\[reply\][\s\S]*?\[\/reply\]\n?/g, '').trim()
      const replySnippet = cleanReplyMsg.replace(/\n/g, ' ').substring(0, 80)
      finalMsgText = `[reply]${replyTo.senderName}|${replySnippet}[/reply]\n${finalMsgText}`
    }

    const msgId = forcedId || crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const senderName = currentUser.employeeName || currentUser.username

    try {
      if (activeTab === 'channels') {
        const msgData = {
          id: msgId, department: selectedDept,
          senderId: myParticipantId,
          senderName,
          message: finalMsgText, fileUrl: forcedFileUrl,
        }
        setMessageCache(prev => ({
          ...prev, [roomId]: [...(prev[roomId] || []), { ...msgData, createdAt }]
        }))
        setInputMsg('')
        setReplyTo(null)
        setTimeout(scrollToBottomSmooth, 10)
        await window.electronAPI.sendChatMessage(msgData)
      } else if (activeTab === 'dms' && selectedUser) {
        const msgData = {
          id: msgId, roomId,
          senderId: myParticipantId,
          senderName,
          message: finalMsgText, fileUrl: forcedFileUrl,
        }
        setMessageCache(prev => ({
          ...prev, [roomId]: [...(prev[roomId] || []), { ...msgData, createdAt }]
        }))
        setInputMsg('')
        setReplyTo(null)
        setTimeout(scrollToBottomSmooth, 10)
        await window.electronAPI.sendDirectMessage(msgData)
      }

      window.electronAPI.markChatAsRead(myParticipantId, roomId).catch(console.error)
      loadSidebarData()
      window.electronAPI?.sendPusherEvent?.({
        channel: 'lltools-updates',
        event: 'new-message',
        data: {
          roomId,
          senderId: myParticipantId,
          message: {
            id: msgId,
            senderId: myParticipantId,
            senderName,
            message: finalMsgText,
            fileUrl: forcedFileUrl,
            createdAt,
            reactions: {},
            isUnsent: false,
            isEdited: false,
            deletedFor: [],
            ...(activeTab === 'channels' ? { department: selectedDept } : { roomId }),
          },
        },
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
  const handleToggleReaction = useCallback(async (msgId, senderId, userName, emoji, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept

    setMessageCache(prev => {
      const msgs = prev[roomId] || []
      return {
        ...prev,
        [roomId]: msgs.map(m => {
          if (m.id !== msgId) return m
          const reactions = { ...(m.reactions || {}) }
          let wasSameEmoji = false

          for (const [existingEmoji, users] of Object.entries(reactions)) {
            const filtered = (users || []).filter(u => String(u.userId) !== String(senderId))
            if (filtered.length !== (users || []).length && existingEmoji === emoji) wasSameEmoji = true
            if (filtered.length === 0) delete reactions[existingEmoji]
            else reactions[existingEmoji] = filtered
          }

          if (!wasSameEmoji) {
            reactions[emoji] = [...(reactions[emoji] || []), { userId: senderId, userName }]
          }

          return { ...m, reactions }
        })
      }
    })

    try {
      const reactions = await window.electronAPI.toggleReaction(msgId, senderId, userName, emoji, isDm)
      window.electronAPI?.sendPusherEvent?.({
        channel: 'lltools-updates',
        event: 'reaction-updated',
        data: { roomId, msgId, reactions: reactions ?? {}, actorId: String(senderId) },
      }).catch(() => {})
    } catch (err) {
      console.error('Failed to toggle reaction', err)
      loadMessages(false)
    }
  }, [selectedDept, selectedUser, myParticipantId, loadMessages])

  const handleEditMessage = useCallback(async (msgId, senderId, newMsg, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept
    setMessageCache(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(m => m.id === msgId ? { ...m, message: newMsg, isEdited: true } : m)
    }))
    try {
      await window.electronAPI?.editMessage?.(msgId, senderId, newMsg, isDm)
      pusherMessageUpdated({ roomId, msgId, type: 'edit', message: newMsg, actorId: String(senderId) })
    } catch (err) {
      console.error('Failed to edit message', err)
      loadMessages(false)
    }
  }, [selectedDept, selectedUser, myParticipantId, pusherMessageUpdated, loadMessages])

  const handleUnsendMessage = useCallback(async (msgId, senderId, isDm) => {
    const roomId = isDm ? getRoomId(myParticipantId, selectedUser.id) : selectedDept
    setMessageCache(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(m => m.id === msgId ? { ...m, isUnsent: true } : m)
    }))
    try {
      await window.electronAPI?.unsendMessage?.(msgId, senderId, isDm)
      pusherMessageUpdated({ roomId, msgId, type: 'unsend', actorId: String(senderId) })
    } catch (err) {
      console.error('Failed to unsend message', err)
      loadMessages(false)
    }
  }, [selectedDept, selectedUser, myParticipantId, pusherMessageUpdated, loadMessages])

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
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'var(--page-bg)' }}>

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

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <Sidebar size={18} />
          </button>

          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 min-h-0 flex p-6 gap-4">

        {isSidebarOpen && (
          <div className="flex h-full">
            <ChatSidebar
              activeTab={activeTab} setActiveTab={setActiveTab}
              sortedDepts={sortedDepts} selectedDept={selectedDept} setSelectedDept={setSelectedDept}
              sortedEmployees={sortedEmployees} selectedUser={selectedUser} setSelectedUser={setSelectedUser}
              isUnread={isUnread} currentUser={currentUser} getRoomId={getRoomId} sidebarData={sidebarData}
              onlineUsers={onlineUsers}
            />
          </div>
        )}

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
