import { memo, useState } from 'react'
import { Hash, User, Search } from 'lucide-react'

const ChatSidebar = memo(function ChatSidebar({
  activeTab, setActiveTab,
  sortedDepts, selectedDept, setSelectedDept, isUnread,
  sortedEmployees, selectedUser, setSelectedUser,
  currentUser, getRoomId, sidebarData
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDepts = sortedDepts.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredEmployees = sortedEmployees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.department && e.department.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-72 shrink-0 flex flex-col rounded-xl shadow-sm border overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

      {/* Tab Toggle */}
      <div className="flex p-2 gap-1 border-b" style={{ borderColor: 'var(--border)', background: 'var(--page-bg-alt)' }}>
        <button
          onClick={() => setActiveTab('channels')}
          className="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
          style={activeTab === 'channels'
            ? { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent-bg)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
            : { color: 'var(--text-secondary)' }}
        >
          Channels
        </button>
        <button
          onClick={() => setActiveTab('dms')}
          className="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
          style={activeTab === 'dms'
            ? { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent-bg)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
            : { color: 'var(--text-secondary)' }}
        >
          Direct Messages
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search channels or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--page-bg-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'channels' && (
          <>
            {filteredDepts.map(dept => {
              const isActive = selectedDept === dept
              const unread = isUnread(dept, true)
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-all"
                  style={{
                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                    color: isActive ? 'var(--accent-bg)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <Hash size={16} className={isActive ? 'opacity-100 shrink-0' : 'opacity-40 shrink-0'} />
                    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                      <span
                        className="truncate text-left"
                        style={{ fontWeight: unread ? 700 : isActive ? 600 : 400, color: unread ? 'var(--text-primary)' : 'inherit' }}
                      >{dept}</span>
                      {(() => {
                        const entry = sidebarData?.departments?.find(d => d.roomId === dept)
                        if (entry && entry.lastMsgAt) {
                          const isMe = String(entry.lastSenderId) === String(currentUser.employeeId || currentUser.id)
                          const prefix = isMe ? 'You' : (entry.lastSenderName?.split(' ')[0] || 'Someone')
                          return (
                            <span className="text-[11px] truncate text-left mt-0.5 max-w-full" style={{ color: 'var(--text-secondary)' }}>
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
            {filteredEmployees.map(emp => {
              const isActive = selectedUser?.id === emp.id
              const myParticipantId = currentUser.employeeId || String(currentUser.id)
              const roomId = getRoomId(myParticipantId, emp.id)
              const unread = isUnread(roomId, false)
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedUser(emp)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-all"
                  style={{
                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                    color: isActive ? 'var(--accent-bg)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                      {emp.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 text-left truncate flex flex-col justify-center">
                      <div
                        className="truncate"
                        style={{ fontWeight: unread ? 700 : 400, color: unread ? 'var(--text-primary)' : 'inherit' }}
                      >{emp.name}</div>
                      {(() => {
                        const entry = sidebarData?.dms?.find(d => d.roomId === roomId)
                        if (entry && entry.lastMsgAt) {
                          const isMe = String(entry.lastSenderId) === myParticipantId
                          const prefix = isMe ? 'You' : (entry.lastSenderName?.split(' ')[0] || 'Someone')
                          return (
                            <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              {prefix}: {entry.lastMessage || 'Sent an attachment'}
                            </div>
                          )
                        }
                        return <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{emp.department || 'No Dept'}</div>
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
