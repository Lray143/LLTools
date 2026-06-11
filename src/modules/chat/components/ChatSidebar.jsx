import { memo, useState } from 'react'
import { Hash, User, Search } from 'lucide-react'

const ChatSidebar = memo(function ChatSidebar({
  activeTab, setActiveTab,
  sortedDepts, selectedDept, setSelectedDept, isUnread,
  sortedEmployees, selectedUser, setSelectedUser,
  currentUser, getRoomId,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDepts = sortedDepts.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredEmployees = sortedEmployees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.department && e.department.toLowerCase().includes(searchQuery.toLowerCase())))

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

      {/* Search Bar */}
      <div className="px-3 py-2 border-b bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ focusRingColor: 'var(--theme-600)' }}
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
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-all
                    ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'}
                  `}
                  style={isActive ? { color: 'var(--theme-600)' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <Hash size={16} className={isActive ? 'opacity-100' : 'opacity-40'} />
                    <span className={unread ? 'font-bold text-gray-900' : ''}>{dept}</span>
                  </div>
                  {unread && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />}
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
                    <div className="flex-1 text-left truncate">
                      <div className={`truncate ${unread ? 'font-bold text-gray-900' : ''}`}>{emp.name}</div>
                      <div className="text-[10px] text-gray-400 truncate leading-tight">{emp.department || 'No Dept'}</div>
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
