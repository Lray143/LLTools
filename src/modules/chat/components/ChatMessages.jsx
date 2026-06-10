import { useRef, memo } from 'react'
import { MessageSquare, Image as ImageIcon, User, Hash } from 'lucide-react'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const ChatMessages = memo(function ChatMessages({ messages, currentUser, activeTab, selectedUser, selectedDept }) {
  const messagesEndRef = useRef(null)

  if (activeTab === 'dms' && !selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <User size={48} className="mb-4 opacity-20" />
        <p>Select an employee from the sidebar</p>
        <p className="text-sm">to start a direct message.</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p>No messages here yet.</p>
        <p className="text-sm">Be the first to say hello!</p>
      </div>
    )
  }

  const mySenderId = currentUser.employeeId || String(currentUser.id)

  return (
    <div className="space-y-1">
      {messages.map((msg, i) => {
        const isMe = String(msg.senderId) === String(mySenderId)
        const prevMsg = messages[i - 1]
        const isGrouped = prevMsg &&
          String(prevMsg.senderId) === String(msg.senderId) &&
          new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60000

        return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}>
            <div className={`flex flex-col max-w-[70%] min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>

              {!isGrouped && (
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-gray-600">{msg.senderName}</span>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                </div>
              )}

              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm min-w-0
                  ${isMe ? 'text-white' : 'bg-white text-gray-800 border border-gray-100'}
                `}
                style={isMe ? { background: 'var(--theme-600)' } : {}}
              >
                {msg.message && <p className="whitespace-pre-wrap break-all overflow-hidden">{msg.message}</p>}
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
  )
})

export default ChatMessages
