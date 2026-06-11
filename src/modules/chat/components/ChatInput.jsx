import { useRef, useState, useEffect } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function ChatInput({
  inputMsg, setInputMsg,
  onSend, onFileChange,
  isSending, isUploadingFile,
  disabled, onTyping,
}) {
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMsg])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(e)
    }
  }

  return (
    <div className="p-4 bg-white border-t" style={{ borderColor: 'var(--border)' }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      <form onSubmit={onSend} className="flex items-center gap-2">

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingFile || disabled}
          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0 disabled:opacity-50"
          title="Attach File"
        >
          {isUploadingFile
            ? <span className="text-xs">⏳</span>
            : <Paperclip size={20} />}
        </button>

        {/* Emoji button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            disabled={disabled}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Add Emoji"
          >
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-xl border border-gray-100">
              <EmojiPicker
                onEmojiClick={(e) => {
                  setInputMsg(prev => prev + e.emoji)
                  setShowEmojiPicker(false)
                }}
              />
            </div>
          )}
        </div>

        {/* Textarea + Send */}
        <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 gap-2 focus-within:ring-2 transition-all"
          style={{ minHeight: '44px' }}
        >
          <textarea
            ref={textareaRef}
            value={inputMsg}
            onChange={(e) => {
              setInputMsg(e.target.value)
              onTyping?.(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Select a user first...' : 'Message...'}
            disabled={disabled}
            className="flex-1 bg-transparent py-2.5 outline-none resize-none text-sm disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '120px' }}
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
            style={{ background: 'var(--theme-600)' }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
