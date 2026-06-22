import { useState, useEffect, useRef, useCallback } from 'react'
import { SmilePlus, Send, CornerDownRight, ChevronDown, ChevronUp, Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','👏','🎉']

function parseUTCDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr.includes('T') && (dateStr.endsWith('Z') || dateStr.includes('+'))) return new Date(dateStr);
  return new Date(dateStr.replace(' ', 'T') + 'Z');
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - parseUTCDate(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#0ea5e9','#f59e0b','#ef4444']
  const colorIdx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[colorIdx], color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, letterSpacing: '-0.5px',
    }}>
      {getInitials(name)}
    </div>
  )
}

// ── Single Comment ────────────────────────────────────────────────────────────
function Comment({ comment, currentUser, onReact, onReply, allComments, depth = 0 }) {
  const [emojiOpen, setEmojiOpen]   = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const emojiRef = useRef(null)

  const reactions  = (() => { try { return JSON.parse(comment.reactions || '{}') } catch { return {} } })()
  const myId       = String(currentUser.employeeId || currentUser.id)
  const myName     = currentUser.employeeName || currentUser.username

  const replies    = allComments.filter(c => c.parent_id === comment.id)

  useEffect(() => {
    if (!emojiOpen) return
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen])

  return (
    <div style={{ marginLeft: depth > 0 ? 36 : 0, marginBottom: 2 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0' }}>
        <Avatar name={comment.employee_name} size={depth > 0 ? 26 : 32} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Bubble */}
          <div style={{
            display: 'inline-block', padding: '8px 12px',
            background: 'var(--surface-hover)',
            borderRadius: '0 12px 12px 12px',
            maxWidth: '100%',
          }}>
            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
              {comment.employee_name}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {comment.content}
            </p>
          </div>

          {/* Reactions display */}
          {Object.keys(reactions).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {Object.entries(reactions).map(([emoji, names]) => {
                const iMine = names.includes(myName)
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact(comment.id, emoji)}
                    title={names.join(', ')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      padding: '2px 7px', borderRadius: 20, fontSize: 13,
                      background: iMine ? 'rgba(var(--theme-500-rgb,99,102,241),0.15)' : 'var(--surface-hover)',
                      border: iMine ? '1px solid var(--theme-500)' : '1px solid var(--border)',
                      cursor: 'pointer', transition: 'all 150ms',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>{emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: 11 }}>{names.length}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{relativeTime(comment.created_at)}</span>

            {/* Emoji picker trigger */}
            <div ref={emojiRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setEmojiOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 12, padding: '0 2px' }}
              >
                <SmilePlus size={13} />
              </button>
              {emojiOpen && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, zIndex: 50,
                  display: 'flex', gap: 4, padding: '6px 8px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  marginBottom: 4,
                }}>
                  {EMOJI_LIST.map(e => (
                    <button key={e} onClick={() => { onReact(comment.id, e); setEmojiOpen(false) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px', borderRadius: 6, transition: 'transform 120ms' }}
                      onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.3)'}
                      onMouseLeave={el => el.currentTarget.style.transform = 'scale(1)'}
                    >{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply */}
            {depth === 0 && (
              <button
                onClick={() => onReply(comment)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 12, padding: '0 2px' }}
              >
                <CornerDownRight size={13} /> Reply
              </button>
            )}

            {/* Toggle replies */}
            {replies.length > 0 && depth === 0 && (
              <button
                onClick={() => setShowReplies(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--theme-500)', fontSize: 12, fontWeight: 600, padding: '0 2px' }}
              >
                {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && depth === 0 && replies.map(reply => (
        <Comment
          key={reply.id}
          comment={reply}
          currentUser={currentUser}
          onReact={onReact}
          onReply={() => onReply(comment)} // reply-to-reply targets the root comment
          allComments={allComments}
          depth={1}
        />
      ))}
    </div>
  )
}

// ── CommentSection ────────────────────────────────────────────────────────────
export default function CommentSection({ announcementId, currentUser, pusherChannel }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const inputRef = useRef(null)
  const emojiRef = useRef(null)

  const empId = String(currentUser.employeeId || currentUser.id)
  const empName = currentUser.employeeName || currentUser.username

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const load = useCallback(async () => {
    if (!announcementId) return
    try {
      const rows = await window.electronAPI.getAnnouncementComments(announcementId)
      setComments(rows || [])
    } catch(e) { console.error(e) }
  }, [announcementId])

  useEffect(() => { load() }, [load])

  // Real-time: force a sync when Pusher fires
  useEffect(() => {
    if (!pusherChannel) return
    const handler = (data) => {
      if (data?.announcementId === announcementId || data?.commentId) {
        window.electronAPI?.forceSync?.()
      }
    }
    pusherChannel.bind('new-announcement-comment', handler)
    return () => pusherChannel.unbind('new-announcement-comment', handler)
  }, [pusherChannel, announcementId])

  // Reload when the database finishes syncing
  useEffect(() => {
    if (!window.electronAPI?.onDbSynced) return
    const cleanup = window.electronAPI.onDbSynced(() => load())
    return () => cleanup()
  }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const parentId = replyTo?.id || null
      const newComment = await window.electronAPI.addAnnouncementComment(
        announcementId, empId, empName, trimmed, parentId
      )
      // Optimistic: add immediately
      setComments(prev => [...prev, { ...newComment, reactions: '{}' }])
      setText('')
      setReplyTo(null)
    } catch(e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  const handleReact = async (commentId, reaction) => {
    // Optimistic UI update so it feels instant
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const reactionsObj = (() => { try { return JSON.parse(c.reactions || '{}') } catch { return {} } })()
        const users = reactionsObj[reaction] || []
        const isSelected = users.some(u => String(u.id) === String(empId))
        
        if (isSelected) {
          reactionsObj[reaction] = users.filter(u => String(u.id) !== String(empId))
          if (reactionsObj[reaction].length === 0) delete reactionsObj[reaction]
        } else {
          reactionsObj[reaction] = [...users, { id: empId, name: empName }]
        }
        return { ...c, reactions: JSON.stringify(reactionsObj) }
      }
      return c
    }))

    try {
      await window.electronAPI.reactAnnouncementComment(commentId, empId, empName, reaction)
    } catch(e) { console.error(e) }
    // load() is no longer strictly necessary to wait for since Pusher will also trigger a sync if needed,
    // but we can call it in the background to ensure consistency.
    load()
  }

  const handleReplyClick = (comment) => {
    setReplyTo(comment)
    inputRef.current?.focus()
  }

  // Top-level comments (parent_id is null/undefined)
  const rootComments = comments.filter(c => !c.parent_id)

  return (
    <div style={{ marginTop: 12 }}>
      {/* Comment list */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rootComments.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', margin: '12px 0', opacity: 0.7 }}>
            No comments yet. Be the first to comment!
          </p>
        )}
        {rootComments.map(c => (
          <Comment
            key={c.id}
            comment={c}
            currentUser={currentUser}
            onReact={handleReact}
            onReply={handleReplyClick}
            allComments={comments}
          />
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
        {replyTo && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 10px', borderRadius: 8, marginBottom: 6,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.08)',
            border: '1px solid var(--theme-200, #c7d2fe)',
            fontSize: 12, color: 'var(--theme-500)',
          }}>
            <span><CornerDownRight size={12} style={{ marginRight: 4 }} />Replying to <b>{replyTo.employee_name}</b></span>
            <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}>✕</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Avatar name={empName} size={28} />
          <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center', background: 'var(--surface-hover)', borderRadius: 20, padding: '6px 12px', border: '1px solid var(--border)', position: 'relative' }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
              placeholder="Write a comment…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: showEmojiPicker ? 'var(--theme-500)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', padding: 4,
              }}
            >
              <Smile size={16} />
            </button>
            {showEmojiPicker && (
              <div ref={emojiRef} style={{ position: 'absolute', bottom: 40, right: 0, zIndex: 100 }}>
                <EmojiPicker
                  onEmojiClick={(e) => {
                    setText(prev => prev + e.emoji)
                    inputRef.current?.focus()
                  }}
                  theme="auto"
                  width={300}
                  height={400}
                  lazyLoadEmojis={true}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              style={{
                background: text.trim() ? 'var(--theme-500)' : 'transparent',
                border: 'none', borderRadius: '50%', cursor: text.trim() ? 'pointer' : 'default',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: text.trim() ? '#fff' : 'var(--text-secondary)',
                transition: 'all 200ms', flexShrink: 0,
              }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
