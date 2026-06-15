import { useRef, memo, useState, useCallback } from 'react'
import { MessageSquare, Image as ImageIcon, User, Smile, Reply, X } from 'lucide-react'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatFullDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function formatDateLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = today - msgDate

  if (diff === 0) return 'Today'
  if (diff === 86400000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
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
      return (
        <span key={i} className="font-bold"
          style={{ color: isMyMessage ? '#fde68a' : '#d97706', fontSize: 'inherit' }}
        >{part}</span>
      )
    }

    const isMentioningMe = myFirstName && mention.startsWith(myFirstName)
    if (isMentioningMe) {
      return (
        <span key={i} className="font-bold"
          style={{ color: isMyMessage ? '#fda4af' : '#e11d48', fontSize: 'inherit' }}
        >{part}</span>
      )
    }

    return (
      <span key={i} className="font-semibold"
        style={{
          color: isMyMessage ? 'rgba(255,255,255,0.85)' : 'var(--theme-500)',
          fontSize: 'inherit'
        }}
      >{part}</span>
    )
  })
}

// ── Image Lightbox ──────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div className="chat-lightbox" onClick={onClose}>
      <img src={src} alt="Attachment preview" onClick={e => e.stopPropagation()} />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full"
        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        <X size={20} />
      </button>
    </div>
  )
}

const ChatMessages = memo(function ChatMessages({ messages, currentUser, activeTab, selectedUser, readReceipts = [], setReplyTo }) {
  const messagesEndRef = useRef(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [hoveredTime, setHoveredTime] = useState(null)

  if (activeTab === 'dms' && !selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <User size={28} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
        </div>
        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No conversation selected</p>
        <p className="text-xs mt-1">Select an employee from the sidebar to start messaging</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <MessageSquare size={28} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
        </div>
        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
        <p className="text-xs mt-1">Be the first to say hello!</p>
      </div>
    )
  }

  const mySenderId = currentUser.employeeId || String(currentUser.id)

  // Build read receipts lookup
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

  // Check if we need a date separator between two messages
  function needsDateSeparator(prevMsg, currMsg) {
    if (!prevMsg) return true
    const prevDate = new Date(prevMsg.createdAt).toDateString()
    const currDate = new Date(currMsg.createdAt).toDateString()
    return prevDate !== currDate
  }

  return (
    <>
      <div className="space-y-1">
        {messages.map((msg, i) => {
          const isMe = String(msg.senderId) === String(mySenderId)
          const prevMsg = messages[i - 1]
          const isGrouped = prevMsg &&
            String(prevMsg.senderId) === String(msg.senderId) &&
            new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60000
          const showDateSep = needsDateSeparator(prevMsg, msg)

          // Extract reply block if it exists
          let messageText = msg.message || ''
          let replyBlock = null
          const replyMatch = messageText.match(/^\[reply\](.*?)\[\/reply\]\n?/)
          if (replyMatch) {
            const [_, replyContent] = replyMatch
            const [replyName, ...replyTextParts] = replyContent.split('|')
            replyBlock = { name: replyName, text: replyTextParts.join('|') }
            messageText = messageText.substring(replyMatch[0].length)
          }

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSep && (
                <div className="chat-date-separator">
                  {formatDateLabel(msg.createdAt)}
                </div>
              )}

              <div className={`chat-msg-wrapper flex ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped && !showDateSep ? 'mt-0.5' : 'mt-3'}`}
                style={{ animation: 'chatFadeIn 300ms ease forwards' }}>
                <div className={`flex flex-col max-w-[70%] min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>

                  {/* Sender name + time (only for first message in a group) */}
                  {(!isGrouped || showDateSep) && (
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{msg.senderName}</span>
                      <span
                        className="text-[10px] cursor-default"
                        style={{ color: 'var(--text-secondary)' }}
                        title={formatFullDate(msg.createdAt)}
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className="relative group">
                    <div
                      className="chat-bubble-hover px-4 py-2.5 rounded-2xl text-sm leading-relaxed min-w-0"
                      style={isMe
                        ? {
                          background: 'var(--theme-500)',
                          color: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        }
                        : {
                          background: 'var(--surface)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }
                      }
                    >
                      {/* Render Reply Block */}
                      {replyBlock && (
                        <div className="mb-2 px-3 py-2 rounded-lg text-xs"
                          style={{
                            background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--page-bg-alt)',
                            borderLeft: `3px solid ${isMe ? '#fff' : 'var(--theme-500)'}`,
                            opacity: 0.9,
                          }}>
                          <div className="font-bold mb-0.5" style={{ color: isMe ? '#fff' : 'var(--theme-500)' }}>
                            {replyBlock.name}
                          </div>
                          <div className="truncate opacity-90">{replyBlock.text}</div>
                        </div>
                      )}

                      {messageText && (
                        <p className="whitespace-pre-wrap break-all overflow-hidden mt-0.5">
                          {renderMessageText(
                            messageText,
                            currentUser.employeeName || currentUser.username,
                            isMe
                          )}
                        </p>
                      )}
                      {msg.fileUrl && (
                        <div className="mt-2 p-2 rounded-lg flex flex-col items-start gap-2 max-w-[240px]"
                          style={{
                            background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--page-bg-alt)',
                            border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
                            borderRadius: '10px',
                          }}>
                          {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) ? (
                            <img
                              src={msg.fileUrl}
                              alt="attachment"
                              className="rounded-lg w-full object-cover max-h-48 cursor-zoom-in"
                              style={{ transition: 'transform 150ms' }}
                              onClick={() => setLightboxSrc(msg.fileUrl)}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            />
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

                    {/* Hover action bar */}
                    <div className={`chat-msg-actions absolute ${isMe ? 'right-1' : 'left-1'} -top-8`}>
                      <div className="flex items-center gap-0.5 rounded-lg px-1 py-0.5"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <button className="chat-action-btn p-1.5" title="React"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <Smile size={14} />
                        </button>
                        <button className="chat-action-btn p-1.5" title="Reply" onClick={() => setReplyTo?.(msg)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <Reply size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Read receipts */}
                  {seenByMsgId[msg.id] && (
                    <div className={`text-[10px] mt-1 w-full px-1 ${isMe ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-secondary)' }}>
                      {activeTab === 'dms'
                        ? `Seen at ${formatTime(seenByMsgId[msg.id][0].time)}`
                        : `Seen by ${seenByMsgId[msg.id].map(u => u.name).join(', ')}`}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  )
})

export default ChatMessages
