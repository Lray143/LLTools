import { useRef, useState, useEffect, useCallback } from 'react'
import { Send, Paperclip, Smile, Users, AtSign, Loader2, Reply, X } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function ChatInput({
  inputMsg, setInputMsg,
  onSend, onFileChange,
  isSending, isUploadingFile,
  disabled, onTyping,
  members = [],       // employees in current channel
  activeTab = 'channels',
  replyTo, setReplyTo
}) {
  const fileInputRef   = useRef(null)
  const textareaRef    = useRef(null)
  const mentionListRef = useRef(null)
  const [showEmojiPicker,   setShowEmojiPicker]   = useState(false)
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery,      setMentionQuery]      = useState('')
  const [mentionStart,      setMentionStart]      = useState(-1)
  const [mentionIndex,      setMentionIndex]      = useState(0)
  const [isComposing,       setIsComposing]       = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMsg])

  // Track composing state for typing indicator
  useEffect(() => {
    if (inputMsg.trim().length > 0) {
      setIsComposing(true)
    } else {
      setIsComposing(false)
    }
  }, [inputMsg])

  // Build filtered mention list
  const mentionItems = useCallback(() => {
    if (activeTab !== 'channels') return []
    const q = mentionQuery.toLowerCase()
    const everyoneMatch = q === '' || 'everyone'.startsWith(q)
    const memberMatches = members.filter(m =>
      m.name?.toLowerCase().includes(q)
    )
    return [
      ...(everyoneMatch ? [{ id: '__everyone__', name: 'everyone', label: 'everyone', sub: 'Notify all members' }] : []),
      ...memberMatches.map(m => ({
        id: m.id,
        name: m.name.split(' ')[0],
        label: m.name,
        sub: m.department || m.position || '',
      }))
    ]
  }, [mentionQuery, members, activeTab])

  const filteredMentions = mentionItems()

  // Detect @ trigger
  const handleChange = (e) => {
    const val = e.target.value
    setInputMsg(val)
    onTyping?.()

    const cursor = e.target.selectionStart
    const before = val.slice(0, cursor)
    const atMatch = before.match(/@(\w*)$/)
    if (atMatch && activeTab === 'channels') {
      setMentionQuery(atMatch[1].toLowerCase())
      setMentionStart(cursor - atMatch[0].length)
      setShowMentionPicker(true)
      setMentionIndex(0)
    } else {
      setShowMentionPicker(false)
    }
  }

  const insertMention = (item) => {
    const cursor = textareaRef.current?.selectionStart ?? inputMsg.length
    const before = inputMsg.slice(0, mentionStart)
    const after  = inputMsg.slice(cursor)
    setInputMsg(before + '@' + item.name + ' ' + after)
    setShowMentionPicker(false)
    setMentionQuery('')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKeyDown = (e) => {
    if (showMentionPicker && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(i => (i + 1) % filteredMentions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredMentions[mentionIndex])
        return
      }
      if (e.key === 'Escape') {
        setShowMentionPicker(false)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(e)
    }
  }

  // Close pickers when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-chat-input]')) {
        setShowEmojiPicker(false)
        setShowMentionPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="px-4 py-3 border-t relative" data-chat-input
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />

      {/* ── Mention Picker (redesigned to match app dropdowns) ── */}
      {showMentionPicker && filteredMentions.length > 0 && (
        <div
          ref={mentionListRef}
          className="absolute bottom-full left-4 mb-2 z-50 rounded-xl overflow-hidden chat-scroll"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            minWidth: '240px',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '6px',
          }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}>
            Mentions
          </div>
          {filteredMentions.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(item) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg"
              style={{
                background: idx === mentionIndex ? 'var(--surface-hover)' : 'transparent',
                color: idx === mentionIndex ? 'var(--theme-500)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: idx === mentionIndex ? 600 : 400,
                transition: 'background 100ms, color 100ms',
              }}
              onMouseEnter={() => setMentionIndex(idx)}
            >
              {item.id === '__everyone__' ? (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--theme-500)' }}>
                  <Users size={13} style={{ color: '#fff' }} />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: 'var(--page-bg-alt)', color: 'var(--text-primary)' }}>
                  {item.label.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="truncate" style={{ fontSize: '13px' }}>
                  {item.id === '__everyone__' ? '@everyone' : item.label}
                </span>
                {item.sub && (
                  <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {item.sub}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSend} className="flex flex-col gap-2">
        {/* ── Reply Banner ── */}
        {replyTo && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl text-sm mb-1"
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <Reply size={14} style={{ color: 'var(--theme-500)' }} className="shrink-0" />
              <span className="font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>{replyTo.senderName}</span>
              <span className="truncate text-xs text-opacity-80" style={{ color: 'var(--text-secondary)' }}>
                {replyTo.message || 'Attachment'}
              </span>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} className="p-1 shrink-0 ml-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
              style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">

        {/* Action buttons (left side) */}
        <div className="flex items-center gap-0.5 shrink-0 pb-1">

          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFile || disabled}
            className="chat-action-btn p-2 disabled:opacity-40"
            style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            title="Attach File"
          >
            {isUploadingFile ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>

          {/* Emoji button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              disabled={disabled}
              className="chat-action-btn p-2 disabled:opacity-40"
              style={{
                color: showEmojiPicker ? 'var(--theme-500)' : 'var(--text-secondary)',
                border: 'none',
                background: showEmojiPicker ? 'var(--surface-hover)' : 'transparent',
                cursor: 'pointer',
              }}
              title="Add Emoji"
            >
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50 rounded-xl overflow-hidden"
                style={{
                  border: '1px solid var(--border)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                }}>
                <EmojiPicker
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  onEmojiClick={(e) => setInputMsg(prev => prev + e.emoji)}
                />
              </div>
            )}
          </div>

          {/* Mention button — channels only */}
          {activeTab === 'channels' && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const pos = textareaRef.current?.selectionStart ?? inputMsg.length
                const before = inputMsg.slice(0, pos)
                const after  = inputMsg.slice(pos)
                setInputMsg(before + '@' + after)
                setMentionQuery('')
                setMentionStart(pos)
                setShowMentionPicker(true)
                setMentionIndex(0)
                setTimeout(() => textareaRef.current?.focus(), 0)
              }}
              className="chat-action-btn p-2 disabled:opacity-40"
              style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer' }}
              title="Mention someone"
            >
              <AtSign size={18} />
            </button>
          )}
        </div>

        {/* Textarea + Send */}
        <div className="flex-1 flex items-end border rounded-2xl px-4 gap-2 chat-input-focus"
          style={{
            minHeight: '44px',
            background: 'var(--page-bg-alt)',
            borderColor: 'var(--border)',
          }}>
          <textarea
            ref={textareaRef}
            value={inputMsg}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Select a user first...' : 'Message... (type @ to mention)'}
            disabled={disabled}
            className="flex-1 bg-transparent py-2.5 outline-none resize-none text-sm disabled:opacity-40 chat-scroll"
            style={{ minHeight: '24px', maxHeight: '120px', color: 'var(--text-primary)' }}
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={!inputMsg.trim() || isSending || disabled}
            className="chat-send-btn p-2 rounded-xl text-white shrink-0 disabled:opacity-30 mb-1"
            style={{
              background: 'var(--theme-500)',
              border: 'none',
              cursor: !inputMsg.trim() || isSending || disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
          </div>
        </div>
      </form>
    </div>
  )
}
