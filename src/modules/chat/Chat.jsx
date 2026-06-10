import { useState, useEffect, useRef, useMemo } from 'react'
import { Send, Hash, MessageSquare, Image as ImageIcon, Paperclip, User } from 'lucide-react'

const DEPARTMENTS = [
  'HR', 'Admin', 'Accounting', 'Finance', 'Sales', 
  'Marketing', 'Warehouse', 'Production', 'IT', 'Intern'
]

const GLOBAL_ROLES = ['admin', 'hr']

export default function Chat({ currentUser, refreshKey }) {
  const [activeTab, setActiveTab] = useState('channels') // 'channels' | 'dms'
  const [messages, setMessages] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [employees, setEmployees] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const canSeeAll = GLOBAL_ROLES.includes(currentUser?.role)
  
  // Channels State
  const initialDept = currentUser?.department || 'Admin'
  const [selectedDept, setSelectedDept] = useState(initialDept)

  // DMs State
  const [selectedUser, setSelectedUser] = useState(null) // employee object

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await window.electronAPI.getEmployees()
        // Filter out current user
        setEmployees(data.filter(e => e.id !== currentUser.employeeId && currentUser.username !== e.employee_no))
      } catch (err) {
        console.error('Failed to load employees', err)
      }
    }
    loadEmployees()
  }, [currentUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Calculate DM Room ID based on both users' IDs
  // Because currentUser.id is from the 'users' table (integer/string) 
  // and employee.id is a UUID, we must consistently stringify and sort.
  const getRoomId = (user1Id, user2Id) => {
    return `DM_${[String(user1Id), String(user2Id)].sort().join('_')}`
  }

  // Fetch messages depending on the active tab
  useEffect(() => {
    async function load() {
      try {
        if (activeTab === 'channels') {
          const msgs = await window.electronAPI.getChatMessages(selectedDept)
          setMessages(msgs || [])
        } else if (activeTab === 'dms' && selectedUser) {
          // If the employee has a linked user account, we use that ID. 
          // If not, we use their employee ID as a fallback, but technically they can't login yet anyway.
          // For safety, we use the employee table's ID, but wait, the senderId is currentUser.id (users table).
          // We need to use currentUser.employeeId if they are an employee. 
          // But Admin has no employeeId.
          // Let's use `currentUser.employeeId || currentUser.id` for the current user's participant ID.
          const myParticipantId = currentUser.employeeId || String(currentUser.id)
          const theirParticipantId = selectedUser.id // employee table ID
          const roomId = getRoomId(myParticipantId, theirParticipantId)
          const msgs = await window.electronAPI.getDirectMessages(roomId)
          setMessages(msgs || [])
        }
        setTimeout(scrollToBottom, 50)
      } catch (err) {
        console.error('Failed to load messages', err)
      }
    }
    load()
  }, [selectedDept, selectedUser, activeTab, refreshKey, currentUser])

  const handleSend = async (e, forcedFileUrl = null) => {
    if (e) e.preventDefault()
    if (!inputMsg.trim() && !forcedFileUrl) return

    setIsSending(true)
    const senderId = currentUser.employeeId || String(currentUser.id)

    try {
      if (activeTab === 'channels') {
        const msgData = {
          id: crypto.randomUUID(),
          department: selectedDept,
          senderId: senderId,
          senderName: currentUser.employeeName || currentUser.username,
          message: inputMsg.trim() || 'Sent an attachment',
          fileUrl: forcedFileUrl
        }
        setMessages(prev => [...prev, { ...msgData, createdAt: new Date().toISOString() }])
        setInputMsg('')
        setTimeout(scrollToBottom, 10)
        await window.electronAPI.sendChatMessage(msgData)
      } else if (activeTab === 'dms' && selectedUser) {
        const theirParticipantId = selectedUser.id
        const roomId = getRoomId(senderId, theirParticipantId)
        
        const msgData = {
          id: crypto.randomUUID(),
          roomId: roomId,
          senderId: senderId,
          senderName: currentUser.employeeName || currentUser.username,
          message: inputMsg.trim() || 'Sent an attachment',
          fileUrl: forcedFileUrl
        }
        setMessages(prev => [...prev, { ...msgData, createdAt: new Date().toISOString() }])
        setInputMsg('')
        setTimeout(scrollToBottom, 10)
        await window.electronAPI.sendDirectMessage(msgData)
      }
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear the input
    e.target.value = ''

    setIsUploadingFile(true)
    try {
      // Get binary data from the file to send over IPC
      const arrayBuffer = await file.arrayBuffer()
      const publicUrl = await window.electronAPI.uploadAttachment(arrayBuffer, file.name, file.type)
      
      // Automatically send the message with the file URL
      await handleSend(null, publicUrl)
    } catch (err) {
      console.error('File upload error', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  function formatTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // Determine which departments to show in Channels tab
  const visibleDepts = useMemo(() => {
    if (canSeeAll) return DEPARTMENTS
    if (currentUser.department) return [currentUser.department]
    return []
  }, [canSeeAll, currentUser.department])

  return (
    <div className="flex h-full p-4 gap-4" style={{ background: 'var(--page-bg)' }}>
      
      {/* ── SIDEBAR (Visible to everyone now) ── */}
      <div className="w-72 shrink-0 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        
        {/* Tab Toggle */}
        <div className="flex p-2 gap-1 border-b bg-gray-50/50" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'channels' ? 'bg-white shadow-sm text-gray-800 border' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'channels' ? { borderColor: 'var(--border)', color: 'var(--theme-600)' } : {}}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'dms' ? 'bg-white shadow-sm text-gray-800 border' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'dms' ? { borderColor: 'var(--border)', color: 'var(--theme-600)' } : {}}
          >
            Direct Messages
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'channels' && (
            <>
              {visibleDepts.map(dept => {
                const isActive = selectedDept === dept
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-all
                      ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'}
                    `}
                    style={isActive ? { color: 'var(--theme-600)' } : {}}
                  >
                    <Hash size={16} className={isActive ? 'opacity-100' : 'opacity-40'} />
                    {dept}
                  </button>
                )
              })}
            </>
          )}

          {activeTab === 'dms' && (
            <>
              {employees.map(emp => {
                const isActive = selectedUser?.id === emp.id
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedUser(emp)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-all
                      ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'}
                    `}
                    style={isActive ? { color: 'var(--theme-600)' } : {}}
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User size={12} className="text-gray-500" />
                    </div>
                    <div className="flex-1 text-left truncate">
                      <div className="truncate">{emp.name}</div>
                      <div className="text-[10px] text-gray-400 truncate leading-tight">{emp.department || 'No Dept'}</div>
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden relative" style={{ borderColor: 'var(--border)' }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shadow-sm z-10" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div>
            {activeTab === 'channels' ? (
              <>
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Hash size={20} style={{ color: 'var(--theme-600)' }} />
                  {selectedDept}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Real-time synchronization active.</p>
              </>
            ) : (
              <>
                {selectedUser ? (
                  <>
                    <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <User size={20} style={{ color: 'var(--theme-600)' }} />
                      {selectedUser.name}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedUser.position || 'Employee'} • {selectedUser.department}</p>
                  </>
                ) : (
                  <h1 className="text-lg font-bold text-gray-800">Direct Messages</h1>
                )}
              </>
            )}
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {(activeTab === 'dms' && !selectedUser) ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <User size={48} className="mb-4 opacity-20" />
              <p>Select an employee from the sidebar</p>
              <p className="text-sm">to start a direct message.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>No messages here yet.</p>
              <p className="text-sm">Be the first to say hello!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => {
                const mySenderId = currentUser.employeeId || String(currentUser.id)
                const isMe = String(msg.senderId) === String(mySenderId)
                
                const prevMsg = messages[i - 1]
                const isGrouped = prevMsg && 
                                  String(prevMsg.senderId) === String(msg.senderId) && 
                                  new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60000

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-2' : ''}`}>
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className="text-xs font-semibold text-gray-600">{msg.senderName}</span>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                        </div>
                      )}

                      <div 
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                          ${isMe ? 'text-white' : 'bg-white text-gray-800 border border-gray-100'}
                        `}
                        style={isMe ? { background: 'var(--theme-600)' } : {}}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        {/* File Attachment Rendering */}
                        {msg.fileUrl && (
                          <div className="mt-2 p-2 bg-black/5 rounded border border-black/5 flex flex-col items-start gap-2 max-w-[240px]">
                            {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) ? (
                              <img src={msg.fileUrl} alt="attachment" className="rounded w-full object-cover max-h-48" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <ImageIcon size={16} />
                                <span className="text-xs truncate">Attachment</span>
                              </div>
                            )}
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold underline hover:opacity-80">
                              Open File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t" style={{ borderColor: 'var(--border)' }}>
          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile || (activeTab === 'dms' && !selectedUser)}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mb-0.5 disabled:opacity-50"
              title="Attach File"
            >
              {isUploadingFile ? <span className="animate-spin text-xs">⏳</span> : <Paperclip size={20} />}
            </button>

            <div className="flex-1 relative">
              <textarea
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeTab === 'dms' && !selectedUser ? 'Select a user first...' : `Message...`}
                disabled={activeTab === 'dms' && !selectedUser}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-4 pr-12 outline-none focus:ring-2 resize-none transition-all disabled:opacity-50 disabled:bg-gray-100"
                style={{ minHeight: '52px', maxHeight: '160px' }}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                }}
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || isSending || (activeTab === 'dms' && !selectedUser)}
                className="absolute right-2 bottom-2 p-2 rounded-xl text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                style={{ background: 'var(--theme-600)' }}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
