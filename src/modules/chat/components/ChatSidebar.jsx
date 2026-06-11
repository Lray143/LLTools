import { memo } from 'react'
import { Hash, User } from 'lucide-react'

const ChatSidebar = memo(function ChatSidebar({
  activeTab, setActiveTab,
  sortedDepts, selectedDept, setSelectedDept, isUnread,
  sortedEmployees, selectedUser, setSelectedUser,
  currentUser, getRoomId, sidebarData
}) {
  return (
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
            {sortedDepts.map(dept => {
              const isActive = selectedDept === dept
              const unread = isUnread(dept, true)
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-all
                    ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'}
                  `}
                  style={isActive ? { color: 'var(--theme-600)' } : {}}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <Hash size={16} className={isActive ? 'opacity-100 shrink-0' : 'opacity-40 shrink-0'} />
                    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                      <span className={unread ? 'font-bold text-gray-900 truncate text-left' : 'truncate text-left'}>{dept}</span>
                      {(() => {
                        const entry = sidebarData?.departments?.find(d => d.roomId === dept)
                        if (entry && entry.lastMsgAt) {
                          const isMe = String(entry.lastSenderId) === String(currentUser.employeeId || currentUser.id)
                          const prefix = isMe ? 'You' : (entry.lastSenderName?.split(' ')[0] || 'Someone')
                          return (
                            <span className="text-[11px] text-gray-400 truncate text-left mt-0.5 max-w-full">
                              {prefix}: {entry.lastMessage || 'Sent an attachment'}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                  {unread && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shrink-0 ml-2" />}
                </button>
              )
            })}
          </>
        )}

        {activeTab === 'dms' && (
          <>
            {sortedEmployees.map(emp => {
              const isActive = selectedUser?.id === emp.id
              const myParticipantId = currentUser.employeeId || String(currentUser.id)
              const roomId = getRoomId(myParticipantId, emp.id)
              const unread = isUnread(roomId, false)
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedUser(emp)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-all
                    ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'}
                  `}
                  style={isActive ? { color: 'var(--theme-600)' } : {}}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User size={12} className="text-gray-500" />
                    </div>
                    <div className="flex-1 text-left truncate flex flex-col justify-center">
                      <div className={`truncate ${unread ? 'font-bold text-gray-900' : ''}`}>{emp.name}</div>
                      {(() => {
                        const entry = sidebarData?.dms?.find(d => d.roomId === roomId)
                        if (entry && entry.lastMsgAt) {
                          const isMe = String(entry.lastSenderId) === myParticipantId
                          const prefix = isMe ? 'You' : (entry.lastSenderName?.split(' ')[0] || 'Someone')
                          return (
                            <div className="text-[11px] text-gray-400 truncate mt-0.5">
                              {prefix}: {entry.lastMessage || 'Sent an attachment'}
                            </div>
                          )
                        }
                        return <div className="text-[10px] text-gray-400 truncate mt-0.5">{emp.department || 'No Dept'}</div>
                      })()}
                    </div>
                  </div>
                  {unread && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shrink-0 ml-2" />}
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
})

export default ChatSidebar
