import { useRef, useState, useEffect, useCallback } from 'react'
import { Send, Paperclip, Smile, Users, AtSign } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function ChatInput({
  inputMsg, setInputMsg,
  onSend, onFileChange,
  isSending, isUploadingFile,
  disabled, onTyping,
  members = [],       // employees in current channel
  activeTab = 'channels',
}) {
  const fileInputRef   = useRef(null)
  const textareaRef    = useRef(null)
  const mentionListRef = useRef(null)
  const [showEmojiPicker,   setShowEmojiPicker]   = useState(false)
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery,      setMentionQuery]      = useState('')
  const [mentionStart,      setMentionStart]      = useState(-1)
  const [mentionIndex,      setMentionIndex]      = useState(0)  // keyboard nav

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMsg])

  // Build filtered mention list: @everyone first, then matching members
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
        name: m.name.split(' ')[0],    // insert first name
        label: m.name,
        sub: m.department || m.position || '',
      }))
    ]
  }, [mentionQuery, members, activeTab])

  const filteredMentions = mentionItems()

  // Detect @ trigger on input change
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

  // Insert the chosen mention into the textarea
  const insertMention = (item) => {
    const cursor = textareaRef.current?.selectionStart ?? inputMsg.length
    const before = inputMsg.slice(0, mentionStart)
    const after  = inputMsg.slice(cursor)
    setInputMsg(before + '@' + item.name + ' ' + after)
    setShowMentionPicker(false)
    setMentionQuery('')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  // Keyboard nav inside mention picker
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
    <div className="p-4 border-t relative" data-chat-input
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />

      {/* ── Mention Picker ── */}
      {showMentionPicker && filteredMentions.length > 0 && (
        <div
          ref={mentionListRef}
          className="absolute bottom-full left-4 mb-2 z-50 rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            minWidth: '240px',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
            Mentions
          </div>
          {filteredMentions.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(item) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left"
              style={{
                background: idx === mentionIndex ? 'var(--surface-hover)' : 'transparent',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={() => setMentionIndex(idx)}
            >
              {item.id === '__everyone__' ? (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-bg)' }}>
                  <Users size={13} style={{ color: 'var(--accent-text)' }} />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  {item.label.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-semibold truncate">
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

      <form onSubmit={onSend} className="flex items-center gap-2">

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingFile || disabled}
          className="p-2.5 rounded-full transition-colors shrink-0 disabled:opacity-50"
          style={{ color: 'var(--text-secondary)' }}
          title="Attach File"
        >
          {isUploadingFile ? <span className="text-xs">⏳</span> : <Paperclip size={20} />}
        </button>

        {/* Emoji button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            disabled={disabled}
            className="p-2.5 rounded-full transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
            title="Add Emoji"
          >
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-xl"
              style={{ border: '1px solid var(--border)' }}>
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
            className="p-2.5 rounded-full transition-colors shrink-0 disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
            title="Mention someone"
          >
            <AtSign size={20} />
          </button>
        )}

        {/* Textarea + Send */}
        <div className="flex-1 flex items-center border rounded-2xl px-4 gap-2 transition-all"
          style={{ minHeight: '44px', background: 'var(--page-bg-alt)', borderColor: 'var(--border)' }}>
          <textarea
            ref={textareaRef}
            value={inputMsg}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Select a user first...' : 'Message... (type @ to mention)'}
            disabled={disabled}
            className="flex-1 bg-transparent py-2.5 outline-none resize-none text-sm disabled:opacity-50"
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
            className="p-2 rounded-xl text-white shrink-0 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent-bg)' }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
