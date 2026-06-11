import { useRef, memo } from 'react'
import { MessageSquare, Image as ImageIcon, User } from 'lucide-react'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Split message text on @mentions and return styled spans
function renderMessageText(text, currentUserName, isMyMessage) {
  if (!text) return null
  const parts = text.split(/(@\S+)/g)
  return parts.map((part, i) => {
    if (!part.startsWith('@')) return <span key={i}>{part}</span>
    const mention = part.slice(1).toLowerCase()
    const myFirstName = (currentUserName || '').split(' ')[0].toLowerCase()

    if (mention === 'everyone') {
      // Always bright amber — visible on any bubble colour
      return (
        <span key={i}
          className="font-bold rounded-md px-1 py-0.5 inline-block"
          style={{ color: '#92400e', background: '#fde68a', fontSize: 'inherit' }}
        >{part}</span>
      )
    }

    const isMentioningMe = myFirstName && mention.startsWith(myFirstName)
    if (isMentioningMe) {
      // High-contrast pink/red pill so it pops regardless of theme
      return (
        <span key={i}
          className="font-bold rounded-md px-1 py-0.5 inline-block"
          style={{ color: '#fff', background: '#e11d48', fontSize: 'inherit' }}
        >{part}</span>
      )
    }

    // Other mentions — white text on a semi-transparent dark overlay (readable on both light + dark bubbles)
    return (
      <span key={i}
        className="font-semibold rounded-md px-1 py-0.5 inline-block"
        style={{
          color: isMyMessage ? '#fff' : 'var(--accent-bg)',
          background: isMyMessage ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
          fontSize: 'inherit'
        }}
      >{part}</span>
    )
  })
}

const ChatMessages = memo(function ChatMessages({ messages, currentUser, activeTab, selectedUser, readReceipts = [] }) {
  const messagesEndRef = useRef(null)

  if (activeTab === 'dms' && !selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        <User size={48} className="mb-4 opacity-20" />
        <p>Select an employee from the sidebar</p>
        <p className="text-sm">to start a direct message.</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p>No messages here yet.</p>
        <p className="text-sm">Be the first to say hello!</p>
      </div>
    )
  }

  const mySenderId = currentUser.employeeId || String(currentUser.id)

  const seenByMsgId = {}
  if (readReceipts && readReceipts.length > 0 && messages.length > 0) {
    readReceipts.forEach(receipt => {
      if (String(receipt.userId) === String(mySenderId)) return
      let lastSeenMsg = null
      for (let i = messages.length - 1; i >= 0; i--) {
        if (new Date(receipt.lastReadAt) >= new Date(messages[i].createdAt)) {
          lastSeenMsg = messages[i]
          break
        }
      }
      if (lastSeenMsg) {
        if (!seenByMsgId[lastSeenMsg.id]) seenByMsgId[lastSeenMsg.id] = []
        seenByMsgId[lastSeenMsg.id].push({ name: receipt.userName, time: receipt.lastReadAt })
      }
    })
  }

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
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{msg.senderName}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{formatTime(msg.createdAt)}</span>
                </div>
              )}

              <div
                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm min-w-0"
                style={isMe
                  ? { background: 'var(--accent-bg)', color: 'var(--accent-text)' }
                  : { background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                }
              >
                {msg.message && (
                  <p className="whitespace-pre-wrap break-all overflow-hidden">
                    {renderMessageText(
                      msg.message,
                      currentUser.employeeName || currentUser.username,
                      isMe
                    )}
                  </p>
                )}
                {msg.fileUrl && (
                  <div className="mt-2 p-2 rounded border flex flex-col items-start gap-2 max-w-[240px]"
                    style={{ background: 'rgba(0,0,0,0.08)', borderColor: 'var(--border)' }}>
                    {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) ? (
                      <img src={msg.fileUrl} alt="attachment" className="rounded w-full object-cover max-h-48" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <ImageIcon size={16} />
                        <span className="text-xs truncate">Attachment</span>
                      </div>
                    )}
                    {msg.fileUrl.startsWith('attachment://') ? (
                      <button
                        onClick={() => window.electronAPI?.openAttachment?.(msg.fileUrl.replace('attachment://', ''))}
                        className="text-xs font-semibold underline hover:opacity-80 cursor-pointer bg-transparent border-none p-0"
                        style={{ color: 'inherit' }}
                      >
                        Open File
                      </button>
                    ) : (
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold underline hover:opacity-80">
                        Open File
                      </a>
                    )}
                  </div>
                )}
              </div>

              {seenByMsgId[msg.id] && (
                <div className={`text-[10px] mt-1 w-full px-1 ${isMe ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-secondary)' }}>
                  {activeTab === 'dms'
                    ? `Seen at ${formatTime(seenByMsgId[msg.id][0].time)}`
                    : `Seen by ${seenByMsgId[msg.id].map(u => u.name).join(', ')}`}
                </div>
              )}

            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
})

export default ChatMessages
