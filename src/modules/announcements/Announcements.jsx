import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Pusher from 'pusher-js'
import {
  Megaphone, Plus, X, Archive, ArchiveRestore, AlertTriangle,
  Users, MessageSquare, CheckCheck, Search, ChevronDown, Smile, Paperclip,
  CheckSquare, MessageCircle, History
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import NotificationBell from '../../components/ui/NotificationBell'
import AnnouncementCard from './components/AnnouncementCard'
import SearchBar from '../../components/ui/SearchBar'
import { canPostAnnouncements } from '../../lib/permissions'

// ── Employee multi-select ─────────────────────────────────────────────────────
function EmployeeSelect({ employees, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  const label = selected.length === 0
    ? 'Everyone (all employees)'
    : `${selected.length} employee${selected.length > 1 ? 's' : ''} selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
          background: 'var(--surface-hover)', border: '1.5px solid var(--border)',
          color: selected.length === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
          fontSize: 14, textAlign: 'left',
        }}
      >
        <span>{label}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 220, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <SearchBar 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees…"
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <button
              type="button"
              onClick={() => { onChange([]); setOpen(false) }}
              style={{
                width: '100%', padding: '8px 12px', textAlign: 'left', background: selected.length === 0 ? 'rgba(var(--theme-500-rgb,99,102,241),0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: selected.length === 0 ? 'var(--theme-500)' : 'var(--text-primary)',
              }}
            >
              Everyone (all employees)
            </button>
            {filtered.map(emp => (
              <label key={emp.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer',
                background: selected.includes(emp.id) ? 'rgba(var(--theme-500-rgb,99,102,241),0.06)' : 'transparent',
              }}>
                <input
                  type="checkbox"
                  checked={selected.includes(emp.id)}
                  onChange={() => toggle(emp.id)}
                  style={{ accentColor: 'var(--theme-500)', width: 14, height: 14 }}
                />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: selected.includes(emp.id) ? 600 : 400 }}>{emp.name}</span>
                {emp.department && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{emp.department}</span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ComposeBox ────────────────────────────────────────────────────────────────
function ComposeBox({ currentUser, employees, onPosted, focused = false, onCancel }) {
  const [open,          setOpen]          = useState(false)
  const [subject,       setSubject]       = useState('')
  const [isUrgent,      setIsUrgent]      = useState(false)
  const [requireAck,    setRequireAck]    = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [targetIds,     setTargetIds]     = useState([])
  const [submitting,    setSubmitting]    = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showSubjectEmoji, setShowSubjectEmoji] = useState(false)
  const [isUploading,   setIsUploading]   = useState(false)
  const [hasContent,    setHasContent]    = useState(false)
  const fileInputRef = useRef(null)
  const editorRef    = useRef(null)
  // Keep the last saved selection so buttons don't steal focus
  const savedSelection = useRef(null)

  const authorName = currentUser.employeeName || currentUser.username

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-emoji-container]')) {
        setShowEmojiPicker(false)
        setShowSubjectEmoji(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Serialise contentEditable DOM → our text format ────────────────────────
  const serializeContent = () => {
    const el = editorRef.current
    if (!el) return ''
    const parts = []
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent)
      } else if (node.nodeName === 'BR') {
        parts.push('\n')
      } else if (node.dataset?.r2url) {
        // Inline media / file chip
        const fname = node.dataset.filename ? ` | ${node.dataset.filename}` : ''
        parts.push(`\n[attachment: ${node.dataset.r2url}${fname}]\n`)
      } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
        node.childNodes.forEach(walk)
        const last = parts[parts.length - 1]
        if (last && !last.endsWith('\n')) parts.push('\n')
      } else {
        node.childNodes.forEach(walk)
      }
    }
    el.childNodes.forEach(walk)
    return parts.join('').trim()
  }

  // ── Insert raw HTML at the cursor inside the contentEditable ───────────────
  const insertHTMLAtCursor = (html) => {
    editorRef.current?.focus()
    // Restore selection if we lost it (e.g. clicked a toolbar button)
    if (savedSelection.current) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedSelection.current)
    }
    const ok = document.execCommand('insertHTML', false, html)
    if (!ok) {
      // Fallback for environments where execCommand isn't available
      const sel = window.getSelection()
      if (!sel?.rangeCount) return
      const range = sel.getRangeAt(0)
      range.deleteContents()
      const tpl = document.createElement('div')
      tpl.innerHTML = html
      const frag = document.createDocumentFragment()
      let last
      while (tpl.firstChild) { last = tpl.firstChild; frag.appendChild(last) }
      range.insertNode(frag)
      if (last) {
        const r = range.cloneRange()
        r.setStartAfter(last); r.collapse(true)
        sel.removeAllRanges(); sel.addRange(r)
      }
    }
    setHasContent(true)
  }

  // ── File upload → insert real media element inline ─────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Always ensure the content editor is focused before inserting,
    // so the attachment never ends up inside the Subject input.
    if (editorRef.current) {
      editorRef.current.focus()
      // If no saved selection or the saved selection isn't inside the editor,
      // move the caret to the end of the editor.
      const sel = window.getSelection()
      const inside = sel?.rangeCount && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)
      if (!inside) {
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
        savedSelection.current = range.cloneRange()
      }
    }

    const localObjectUrl = URL.createObjectURL(file)
    const tempId = `att-${Date.now()}`
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    let html
    if (isImage) {
      html = `<img id="${tempId}" src="${localObjectUrl}" data-r2url="pending" data-filename="${file.name}"
        style="max-width:100%;max-height:300px;border-radius:8px;display:block;
               margin:8px 0;border:1px solid var(--border);cursor:default;"
        contenteditable="false" />`
    } else if (isVideo) {
      html = `<video id="${tempId}" src="${localObjectUrl}" data-r2url="pending" data-filename="${file.name}"
        controls preload="metadata"
        style="max-width:100%;max-height:300px;border-radius:8px;display:block;
               margin:8px 0;border:1px solid var(--border);"
        contenteditable="false"></video>`
    } else {
      html = `<span id="${tempId}" data-r2url="pending" data-filename="${file.name}" contenteditable="false"
        style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;
               background:rgba(var(--theme-500-rgb,99,102,241),0.08);
               border:1px solid rgba(var(--theme-500-rgb,99,102,241),0.2);
               border-radius:8px;font-size:13px;color:var(--text-primary);font-weight:600;
               margin:4px 2px;vertical-align:middle;">
        <span style="color:var(--theme-500); font-weight: bold; margin-right: 4px;">[Attachment]</span> ${file.name}</span>`
    }

    insertHTMLAtCursor(html)

    setIsUploading(true)
    try {
      const fileData = file.path || await file.arrayBuffer()
      const fileUrl = await window.electronAPI.uploadAttachment(
        fileData, file.name, file.type, crypto.randomUUID(), 'announcement'
      )
      // Patch the real R2 url into the element's data attribute
      const el = document.getElementById(tempId)
      if (el) {
        el.dataset.r2url = fileUrl
        el.removeAttribute('id')
      }
    } catch (err) {
      URL.revokeObjectURL(localObjectUrl)
      const el = document.getElementById(tempId)
      el?.remove()
      console.error(err)
      alert('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Clipboard paste handler ────────────────────────────────────────────────
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    // Look for an image in the clipboard
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault() // Stop browser from inserting a raw data: URL

        const file = item.getAsFile()
        if (!file) continue

        const localObjectUrl = URL.createObjectURL(file)
        const tempId = `att-${Date.now()}`
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/gif' ? 'gif' : 'png'
        const fileName = `pasted-image-${Date.now()}.${ext}`

        // Insert immediately with local preview at consistent size
        const html = `<img id="${tempId}" src="${localObjectUrl}" data-r2url="pending" data-filename="${fileName}"
          style="max-width:100%;max-height:300px;border-radius:8px;display:block;
                 margin:8px 0;border:1px solid var(--border);cursor:default;"
          contenteditable="false" />`
        insertHTMLAtCursor(html)

        setIsUploading(true)
        try {
          const fileData = await file.arrayBuffer()
          const fileUrl = await window.electronAPI.uploadAttachment(
            fileData, fileName, file.type, crypto.randomUUID(), 'announcement'
          )
          const el = document.getElementById(tempId)
          if (el) { el.dataset.r2url = fileUrl; el.removeAttribute('id') }
        } catch (err) {
          URL.revokeObjectURL(localObjectUrl)
          document.getElementById(tempId)?.remove()
          console.error(err)
          alert('Failed to upload pasted image')
        } finally {
          setIsUploading(false)
        }
        return // Only process the first image
      }
    }
    // Non-image paste (plain text): let the browser handle it normally
  }

  // ── Post ───────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    const contentStr = serializeContent()
    if (!subject.trim() || !contentStr || submitting || isUploading) return
    setSubmitting(true)
    try {
      await window.electronAPI.upsertAnnouncement({
        id:              crypto.randomUUID(),
        subject:         subject.trim(),
        content:         contentStr,
        author_id:       String(currentUser.id),
        author_name:     authorName,
        is_urgent:       isUrgent,
        require_ack:     requireAck,
        allow_comments:  allowComments,
        target_audience: JSON.stringify(targetIds),
        file_url:        null,
      })
      // Reset
      if (editorRef.current) editorRef.current.innerHTML = ''
      setSubject('')
      setIsUrgent(false)
      setRequireAck(false)
      setAllowComments(true)
      setTargetIds([])
      setHasContent(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setOpen(false)
      onPosted()
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  // ── Collapsed trigger (non-focused mode) ───────────────────────────────────
  if (!focused && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
          background: 'var(--surface)', border: '1.5px dashed var(--border)',
          color: 'var(--text-secondary)', fontSize: 14, transition: 'all 200ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-500)'; e.currentTarget.style.color = 'var(--theme-500)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(var(--theme-500-rgb,99,102,241),0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Plus size={16} style={{ color: 'var(--theme-500)' }} />
        </div>
        <span>Create an announcement…</span>
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--theme-500)',
      borderRadius: 16, padding: '20px',
      boxShadow: '0 4px 24px rgba(var(--theme-500-rgb,99,102,241),0.12)',
      // In focused mode, make the card fill the viewport container cleanly
      ...(focused ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}),
    }}>
      <div style={{ flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={18} style={{ color: 'var(--theme-500)' }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>New Announcement</span>
        </div>
        {!focused && (
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Subject *
          </label>
          <div style={{ position: 'relative' }} data-emoji-container>
            <button
              type="button"
              onClick={() => setShowSubjectEmoji(prev => !prev)}
              style={{
                background: showSubjectEmoji ? 'var(--surface-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
                color: showSubjectEmoji ? 'var(--theme-500)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', transition: 'all 150ms',
              }}
              title="Add Emoji"
            >
              <Smile size={16} />
            </button>
            {showSubjectEmoji && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: 4,
                border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                background: 'var(--surface)', overflow: 'hidden',
              }}>
                <EmojiPicker
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  onEmojiClick={(ev) => {
                    setSubject(prev => prev + ev.emoji)
                    setShowSubjectEmoji(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Holiday Schedule Update"
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 14,
            background: 'var(--surface-hover)', border: '1.5px solid var(--border)',
            color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Receive */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Receive
        </label>
        <EmployeeSelect employees={employees} selected={targetIds} onChange={setTargetIds} />
      </div>
      </div>

      {/* Content — rich contentEditable editor */}
      <div style={{ marginBottom: 16, ...(focused ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}) }}>
        {/* Sticky toolbar row — always visible even when editor is long */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 5,
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--surface)',
          paddingBottom: 4,
        }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Content *
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }} data-emoji-container>
            {/* Emoji */}
            <button
              type="button"
              onMouseDown={() => {
                // Save selection before the button steals focus
                const sel = window.getSelection()
                if (sel?.rangeCount) savedSelection.current = sel.getRangeAt(0).cloneRange()
              }}
              onClick={() => setShowEmojiPicker(prev => !prev)}
              style={{
                background: showEmojiPicker ? 'var(--surface-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
                color: showEmojiPicker ? 'var(--theme-500)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', transition: 'all 150ms',
              }}
              title="Add Emoji"
            >
              <Smile size={16} />
            </button>
            {showEmojiPicker && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: 4,
                border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                background: 'var(--surface)', overflow: 'hidden',
              }}>
                <EmojiPicker
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  onEmojiClick={(ev) => {
                    editorRef.current?.focus()
                    if (savedSelection.current) {
                      const sel = window.getSelection()
                      sel?.removeAllRanges()
                      sel?.addRange(savedSelection.current)
                    }
                    document.execCommand('insertText', false, ev.emoji)
                    setHasContent(true)
                    setShowEmojiPicker(false)
                  }}
                />
              </div>
            )}
            {/* Attach */}
            <button
              type="button"
              onMouseDown={(e) => {
                // Prevent stealing focus from whatever is active
                e.preventDefault()
              }}
              onClick={() => {
                // Always ensure the editor is focused with a valid caret
                // before the file dialog opens, so attachments land in content.
                const editor = editorRef.current
                if (editor) {
                  editor.focus()
                  const sel = window.getSelection()
                  const inside = sel?.rangeCount && editor.contains(sel.getRangeAt(0).commonAncestorContainer)
                  if (!inside) {
                    const range = document.createRange()
                    range.selectNodeContents(editor)
                    range.collapse(false)
                    sel?.removeAllRanges()
                    sel?.addRange(range)
                    savedSelection.current = range.cloneRange()
                  } else {
                    savedSelection.current = sel.getRangeAt(0).cloneRange()
                  }
                }
                fileInputRef.current?.click()
              }}
              disabled={isUploading}
              style={{
                background: 'transparent', border: 'none',
                cursor: isUploading ? 'default' : 'pointer', padding: 4, borderRadius: 6,
                color: isUploading ? 'var(--theme-500)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', transition: 'all 150ms',
                opacity: isUploading ? 0.5 : 1,
              }}
              title={isUploading ? 'Uploading…' : 'Attach File'}
            >
              <Paperclip size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
          </div>
        </div>

        {/* contentEditable rich editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            const el = editorRef.current
            setHasContent(!!(el?.textContent?.trim() || el?.querySelector('[data-r2url]')))
          }}
          onKeyDown={(e) => {
            // Save selection on every keystroke so toolbar buttons can restore it
            const sel = window.getSelection()
            if (sel?.rangeCount) savedSelection.current = sel.getRangeAt(0).cloneRange()
          }}
          onMouseUp={() => {
            const sel = window.getSelection()
            if (sel?.rangeCount) savedSelection.current = sel.getRangeAt(0).cloneRange()
          }}
          onPaste={handlePaste}
          data-placeholder="Write your announcement here… Use the attachment button to attach images, videos or files inline."
          style={{
            width: '100%',
            // In focused mode, use flex: 1 to fill space perfectly, otherwise use fixed sizing
            ...(focused ? { flex: 1, minHeight: 0 } : { minHeight: 100, maxHeight: 200 }),
            padding: '10px 12px',
            borderRadius: 10, fontSize: 14,
            background: 'var(--surface-hover)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            overflowY: 'auto',
            wordBreak: 'break-word',
            cursor: 'text',
            whiteSpace: 'pre-wrap',
          }}
        />
        {/* CSS-powered placeholder */}
        <style>{`
          [data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: var(--text-secondary);
            opacity: 0.6;
            pointer-events: none;
          }
        `}</style>

        {/* Uploading badge */}
        {isUploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: 'var(--theme-500)' }}>
            <div style={{ width: 12, height: 12, border: '2px solid var(--theme-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Uploading…
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 'auto' }}>
      {/* Options row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { key: 'urgent',   label: <><AlertTriangle size={14} style={{ marginRight: 6 }} /> Urgent</>,             val: isUrgent,      set: setIsUrgent },
          { key: 'ack',      label: <><CheckSquare size={14} style={{ marginRight: 6 }} /> Require Acknowledge</>, val: requireAck,    set: setRequireAck },
          { key: 'comments', label: <><MessageCircle size={14} style={{ marginRight: 6 }} /> Allow Comments</>,     val: allowComments, set: setAllowComments },
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => opt.set(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '6px 14px', borderRadius: 24, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: '1.5px solid',
              borderColor: opt.val ? 'var(--theme-500)' : 'transparent',
              background:   opt.val ? 'rgba(var(--theme-500-rgb,99,102,241),0.08)' : 'var(--surface-hover)',
              color:        opt.val ? 'var(--theme-500)' : 'var(--text-secondary)',
              transition: 'all 150ms',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Posted by */}
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        Posted by: <b style={{ color: 'var(--text-primary)' }}>{authorName}</b>
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handlePost}
          disabled={!subject.trim() || !hasContent || submitting || isUploading}
          style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: (!subject.trim() || !hasContent || submitting || isUploading)
              ? 'var(--surface-hover)' : 'var(--theme-500)',
            color: (!subject.trim() || !hasContent || submitting || isUploading)
              ? 'var(--text-secondary)' : '#fff',
            fontWeight: 700, fontSize: 14, transition: 'all 200ms',
          }}
        >
          {submitting ? 'Posting…' : 'Post Announcement'}
        </button>
        <button
          onClick={() => focused ? onCancel?.() : setOpen(false)}
          style={{
            padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--surface-hover)', color: 'var(--text-secondary)',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
      </div>
    </div>
  )
}


// ── Main Announcements View ───────────────────────────────────────────────────
export default function Announcements({ currentUser, refreshKey, onNavigate }) {
  const [announcements,  setAnnouncements]  = useState([])
  const [archived,       setArchived]       = useState([])
  const [employees,      setEmployees]      = useState([])
  const [view,           setView]           = useState('feed')  // 'feed' | 'archived'
  const [loading,        setLoading]        = useState(true)
  const [pusherChannel,  setPusherChannel]  = useState(null)
  const [composing,      setComposing]      = useState(false)
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null)
  const [filterHistory,  setFilterHistory]  = useState('all') // 'all' | 'acknowledged'
  const [searchQuery,    setSearchQuery]    = useState('')

  const canPost = canPostAnnouncements(currentUser)
  const empId   = String(currentUser.employeeId || currentUser.id)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [anns, emps] = await Promise.all([
        window.electronAPI.getAnnouncements(empId),
        window.electronAPI.getEmployees ? window.electronAPI.getEmployees() : Promise.resolve([]),
      ])
      setAnnouncements(anns || [])
      setEmployees((emps || []).map ? (emps || []) : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [empId])

  const loadArchived = useCallback(async () => {
    try {
      const rows = canPost 
        ? await window.electronAPI.getArchivedAnnouncements(empId)
        : await window.electronAPI.getHistory(empId)
      setArchived(rows || [])
    } catch(e) { console.error(e) }
  }, [empId, canPost])

  useEffect(() => { load() }, [load, refreshKey])
  useEffect(() => { if (view === 'archived') loadArchived() }, [view, loadArchived, refreshKey])

  // ── Pusher ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!import.meta.env.VITE_PUSHER_KEY) return
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    })
    const ch = pusher.subscribe('lltools-updates')
    setPusherChannel(ch)

    ch.bind('new-announcement', () => { window.electronAPI?.forceSync?.() })

    return () => {
      pusher.unsubscribe('lltools-updates')
      pusher.disconnect()
    }
  }, [load])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleArchive = async (id) => {
    await window.electronAPI.archiveAnnouncement(id)
    load()
  }

  const handlePermDelete = async (id) => {
    await window.electronAPI.permDeleteAnnouncement(id)
    loadArchived()
  }

  const handleUnarchive = async (id) => {
    // "restore" = set status back to Active by re-upserting with same data
    const ann = archived.find(a => a.id === id)
    if (!ann) return
    await window.electronAPI.upsertAnnouncement({ ...ann, status: 'Active' })
    load()
    loadArchived()
  }

  const feedList = useMemo(() => {
    if (canPost) return announcements
    return announcements.filter(a => {
      // "if they opened an acknowledgement post and just close it (without acknowledging) it should not vanish. it will only banish when they acknowledge it."
      if (a.require_ack && a.has_acknowledged > 0) return false;
      // "when a non hr opened a non acknowledgement post on announcement , it should vanish on feed and go to the see tab."
      if (!a.require_ack && a.has_read > 0) return false;
      return true;
    })
  }, [announcements, canPost])

  const historyList = useMemo(() => {
    if (filterHistory === 'acknowledged') {
      return archived.filter(a => a.has_acknowledged > 0)
    }
    return archived
  }, [archived, filterHistory])

  const displayListRaw = view === 'archived' ? (canPost ? archived : historyList) : feedList
  const displayList = searchQuery.trim() === ''
    ? displayListRaw
    : displayListRaw.filter(a => (a.subject || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))

  // ── Preload Images for Feed ────────────────────────────────────────────────
  useEffect(() => {
    if (!displayList || displayList.length === 0) return
    const urlsToPreload = new Set()
    
    displayList.forEach(ann => {
      const content = ann.content || ''
      const ATTACH_RE = /\[attachment:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]/g
      let match
      while ((match = ATTACH_RE.exec(content)) !== null) {
        const rawUrl = match[1].trim()
        const renderUrl = rawUrl.replace('https://pub-b12f4572a0004391ac727c63af4321b8.r2.dev/', 'r2://')
        if (renderUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
          urlsToPreload.add(renderUrl)
        }
      }
      // Legacy single attachment
      if (ann.file_url) {
        const renderUrl = ann.file_url.replace('https://pub-b12f4572a0004391ac727c63af4321b8.r2.dev/', 'r2://')
        if (renderUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
          urlsToPreload.add(renderUrl)
        }
      }
    })

    // Preload silently to warm up the r2:// cache
    urlsToPreload.forEach(url => {
      const img = new window.Image()
      img.src = url
    })
  }, [displayList])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--page-bg)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b shrink-0"
        style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Megaphone size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Announcements
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Company-wide posts and updates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search bar */}
          <div style={{ width: 180 }}>
            <SearchBar
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by subject..."
            />
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: 10, padding: 3, gap: 2 }}>
            {[
              { id: 'feed', label: 'Feed' },
              { id: 'archived', label: canPost ? 'Archive' : 'Seen' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: view === tab.id ? 'var(--surface)' : 'transparent',
                  color: view === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: view === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 150ms',
                }}
              >
                {tab.id === 'archived' && canPost ? <Archive size={12} style={{ marginRight: 4, display: 'inline' }} /> : null}
                {tab.id === 'archived' && !canPost ? <History size={12} style={{ marginRight: 4, display: 'inline' }} /> : null}
                {tab.label}
              </button>
            ))}
          </div>

          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── Focused Compose Mode ── */}
      {composing && (
        <div style={{
          flex: 1, padding: '24px 32px',
          background: 'var(--page-bg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden' // Hide outer scroll, let the editor scroll
        }}>
          <div style={{
            maxWidth: 1400, width: '100%', margin: '0 auto',
            flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0
          }}>
            {/* Back button */}
            <button
              onClick={() => setComposing(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                padding: '4px 0', marginBottom: 20, flexShrink: 0
              }}
            >
              ← Back to feed
            </button>
            <ComposeBox
              currentUser={currentUser}
              employees={employees}
              focused
              onPosted={() => { setComposing(false); load() }}
              onCancel={() => setComposing(false)}
            />
          </div>
        </div>
      )}

      {/* ── Focused Reading Mode ── */}
      {!composing && viewingAnnouncement && (
        <div style={{
          flex: 1, padding: '24px 32px',
          background: 'var(--page-bg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            maxWidth: 1400, width: '100%', margin: '0 auto',
            flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0
          }}>
            <button
              onClick={() => { setViewingAnnouncement(null); load(); loadArchived(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                padding: '4px 0', marginBottom: 20, flexShrink: 0
              }}
            >
              ← Back to feed
            </button>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
              <AnnouncementCard
                announcement={viewingAnnouncement}
                currentUser={currentUser}
                canPost={canPost}
                pusherChannel={pusherChannel}
                onUpdate={load}
                onView={() => setViewingAnnouncement(viewingAnnouncement)}
                focused={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Body (Feed) ── */}
      {!composing && !viewingAnnouncement && (
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Compose box — only show the collapsed trigger button when NOT composing */}
          {canPost && view === 'feed' && (
            <button
              onClick={() => setComposing(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
                background: 'var(--surface)', border: '1.5px dashed var(--border)',
                color: 'var(--text-secondary)', fontSize: 14,
                transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-500)'; e.currentTarget.style.color = 'var(--theme-500)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(var(--theme-500-rgb,99,102,241),0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Plus size={16} style={{ color: 'var(--theme-500)' }} />
              </div>
              <span>Create an announcement…</span>
            </button>
          )}

          {/* Archive view header */}
          {view === 'archived' && canPost && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              borderRadius: 10, background: 'rgba(var(--theme-500-rgb,99,102,241),0.06)',
              border: '1px solid rgba(var(--theme-500-rgb,99,102,241),0.15)',
            }}>
              <Archive size={15} style={{ color: 'var(--theme-500)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Archived announcements are stored for record-keeping. Only HR/Admin can permanently delete them.
              </span>
            </div>
          )}
          {view === 'archived' && !canPost && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px',
              borderRadius: 10, background: 'rgba(var(--theme-500-rgb,99,102,241),0.06)',
              border: '1px solid rgba(var(--theme-500-rgb,99,102,241),0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={15} style={{ color: 'var(--theme-500)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Your collection of announcements you have seen and acknowledged.
                </span>
              </div>
              <select
                value={filterHistory}
                onChange={(e) => setFilterHistory(e.target.value)}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text-primary)',
                  fontSize: 12, fontWeight: 600, outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="all">All Seen</option>
                <option value="acknowledged">Acknowledged Only</option>
              </select>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--theme-500)', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0 }}>Loading announcements…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && displayList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Megaphone size={30} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                {view === 'archived' ? (canPost ? 'No archived announcements' : 'No announcements seen yet') : 'No announcements yet'}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                {view === 'feed' && canPost ? 'Create the first announcement above.' : 'Check back later.'}
              </p>
            </div>
          )}

          {/* List */}
          {!loading && displayList.map(ann => (
            <div key={ann.id}>
              {view === 'archived' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnnouncementCard
                    announcement={ann}
                    currentUser={currentUser}
                    canPost={canPost}
                    pusherChannel={pusherChannel}
                    onArchive={() => {}}
                    onDelete={() => handlePermDelete(ann.id)}
                    onView={() => setViewingAnnouncement(ann)}
                    isArchived={true}
                  />
                  {canPost && (
                    <button
                      onClick={() => handleUnarchive(ann.id)}
                      style={{
                        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--surface-hover)', color: 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <ArchiveRestore size={12} /> Restore to Feed
                    </button>
                  )}
                </div>
              ) : (
                <AnnouncementCard
                  announcement={ann}
                  currentUser={currentUser}
                  canPost={canPost}
                  pusherChannel={pusherChannel}
                  onArchive={() => handleArchive(ann.id)}
                  onDelete={() => handlePermDelete(ann.id)}
                  onView={() => setViewingAnnouncement(ann)}
                  isArchived={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
