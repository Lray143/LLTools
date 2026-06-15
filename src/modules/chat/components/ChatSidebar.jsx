import { memo, useState } from 'react'
import { Hash, User, Search, MessageSquare } from 'lucide-react'

const ChatSidebar = memo(function ChatSidebar({
  activeTab, setActiveTab,
  sortedDepts, selectedDept, setSelectedDept, isUnread,
  sortedEmployees, selectedUser, setSelectedUser,
  currentUser, getRoomId, sidebarData
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const filteredDepts = sortedDepts.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredEmployees = sortedEmployees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.department && e.department.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-72 shrink-0 flex flex-col rounded-xl shadow-sm overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>

      {/* ── Tab Toggle (pill style matching LeaveRequests HR switcher) ── */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--page-bg-alt)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '3px', gap: '2px',
        }}>
          {[
            { id: 'channels', label: 'Channels', Icon: Hash },
            { id: 'dms', label: 'Messages', Icon: MessageSquare },
          ].map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <button key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  background: active ? 'var(--theme-500)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  transition: 'background 150ms, color 150ms',
                  whiteSpace: 'nowrap', lineHeight: '1.4',
                  flex: 1, justifyContent: 'center',
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search Bar (matching app-wide input style) ── */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="relative chat-input-focus" style={{
          borderRadius: '8px',
          border: searchFocused ? '1px solid var(--theme-500)' : '1px solid var(--border)',
          transition: 'border-color 200ms ease',
        }}>
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: searchFocused ? 'var(--theme-500)' : 'var(--text-secondary)', transition: 'color 200ms' }} />
          <input
            type="text"
            placeholder={activeTab === 'channels' ? 'Search channels...' : 'Search people...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm focus:outline-none"
            style={{
              background: 'var(--page-bg-alt)',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-2 chat-scroll">
        {activeTab === 'channels' && (
          <>
            {/* Section label */}
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Channels ({filteredDepts.length})
              </span>
            </div>

            {filteredDepts.map(dept => {
              const isActive = selectedDept === dept
              const unread = isUnread(dept, true)
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`chat-sidebar-item w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-0.5 ${isActive ? 'chat-sidebar-active' : ''}`}
                  style={{
                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                    color: isActive ? 'var(--theme-500)' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isActive ? 'var(--theme-500)' : 'var(--page-bg-alt)',
                        transition: 'background 150ms',
                      }}>
                      <Hash size={13} style={{
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        transition: 'color 150ms',
                      }} />
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                      <span
                        className="truncate"
                        style={{ fontWeight: unread ? 700 : isActive ? 600 : 400, color: unread ? 'var(--text-primary)' : 'inherit', fontSize: '13px' }}
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
                  {unread && (
                    <div className="w-2 h-2 rounded-full shrink-0 ml-2"
                      style={{ background: 'var(--theme-500)', boxShadow: '0 0 6px rgba(var(--theme-500-rgb, 59, 130, 246), 0.4)' }} />
                  )}
                </button>
              )
            })}
          </>
        )}

        {activeTab === 'dms' && (
          <>
            {/* Section label */}
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                People ({filteredEmployees.length})
              </span>
            </div>

            {filteredEmployees.map(emp => {
              const isActive = selectedUser?.id === emp.id
              const myParticipantId = currentUser.employeeId || String(currentUser.id)
              const roomId = getRoomId(myParticipantId, emp.id)
              const unread = isUnread(roomId, false)
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedUser(emp)}
                  className={`chat-sidebar-item w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-0.5 ${isActive ? 'chat-sidebar-active' : ''}`}
                  style={{
                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                    color: isActive ? 'var(--theme-500)' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar with online/offline dot */}
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold"
                        style={{
                          background: isActive ? 'var(--theme-500)' : 'var(--page-bg-alt)',
                          color: isActive ? '#fff' : 'var(--text-primary)',
                          transition: 'background 150ms, color 150ms',
                        }}>
                        {emp.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                        emp.last_active && (Date.now() - new Date(emp.last_active + 'Z').getTime()) < 3 * 60 * 1000
                          ? 'bg-green-500' 
                          : 'bg-zinc-400 dark:bg-zinc-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left truncate flex flex-col justify-center">
                      <div
                        className="truncate"
                        style={{ fontWeight: unread ? 700 : isActive ? 600 : 400, color: unread ? 'var(--text-primary)' : 'inherit', fontSize: '13px' }}
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
                  {unread && (
                    <div className="w-2 h-2 rounded-full shrink-0 ml-2"
                      style={{ background: 'var(--theme-500)', boxShadow: '0 0 6px rgba(var(--theme-500-rgb, 59, 130, 246), 0.4)' }} />
                  )}
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
