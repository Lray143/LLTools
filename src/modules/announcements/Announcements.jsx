import { useState, useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import {
  Megaphone, Plus, X, Archive, ArchiveRestore, AlertTriangle,
  Users, MessageSquare, CheckCheck, Search, ChevronDown, Smile
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import NotificationBell from '../../components/ui/NotificationBell'
import AnnouncementCard from './components/AnnouncementCard'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-hover)', borderRadius: 8, padding: '4px 8px' }}>
              <Search size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search employees…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
              />
            </div>
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
function ComposeBox({ currentUser, employees, onPosted }) {
  const [open,          setOpen]          = useState(false)
  const [subject,       setSubject]       = useState('')
  const [content,       setContent]       = useState('')
  const [isUrgent,      setIsUrgent]      = useState(false)
  const [requireAck,    setRequireAck]    = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [targetIds,     setTargetIds]     = useState([]) // [] = all
  const [submitting,    setSubmitting]    = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-emoji-container]')) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const authorName = currentUser.employeeName || currentUser.username

  const handlePost = async () => {
    if (!subject.trim() || !content.trim() || submitting) return
    setSubmitting(true)
    try {
      await window.electronAPI.upsertAnnouncement({
        subject:         subject.trim(),
        content:         content.trim(),
        author_id:       String(currentUser.id),
        author_name:     authorName,
        is_urgent:       isUrgent,
        require_ack:     requireAck,
        allow_comments:  allowComments,
        target_audience: JSON.stringify(targetIds),
      })
      setSubject('')
      setContent('')
      setIsUrgent(false)
      setRequireAck(false)
      setAllowComments(true)
      setTargetIds([])
      setOpen(false)
      onPosted()
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
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
    )
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--theme-500)',
      borderRadius: 16, padding: '20px',
      boxShadow: '0 4px 24px rgba(var(--theme-500-rgb,99,102,241),0.12)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={18} style={{ color: 'var(--theme-500)' }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>New Announcement</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <X size={18} />
        </button>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Subject *
        </label>
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

      {/* Receive (target audience) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Receive
        </label>
        <EmployeeSelect employees={employees} selected={targetIds} onChange={setTargetIds} />
      </div>

      {/* Content */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Content *
          </label>
          <div style={{ position: 'relative' }} data-emoji-container>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              style={{
                background: showEmojiPicker ? 'var(--surface-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
                color: showEmojiPicker ? 'var(--theme-500)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms'
              }}
              title="Add Emoji"
            >
              <Smile size={16} />
            </button>
            {showEmojiPicker && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: 4,
                border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                background: 'var(--surface)', overflow: 'hidden'
              }}>
                <EmojiPicker
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  onEmojiClick={(e) => setContent(prev => prev + e.emoji)}
                />
              </div>
            )}
          </div>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your announcement here…"
          rows={5}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
            background: 'var(--surface-hover)', border: '1.5px solid var(--border)',
            color: 'var(--text-primary)', outline: 'none', resize: 'vertical',
            lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Options row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { key: 'urgent',   label: '🚨 Urgent',             val: isUrgent,      set: setIsUrgent },
          { key: 'ack',      label: '✅ Require Acknowledge', val: requireAck,    set: setRequireAck },
          { key: 'comments', label: '💬 Allow Comments',     val: allowComments, set: setAllowComments },
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => opt.set(v => !v)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: '1.5px solid',
              borderColor: opt.val ? 'var(--theme-500)' : 'var(--border)',
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

      {/* Submit */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handlePost}
          disabled={!subject.trim() || !content.trim() || submitting}
          style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: (!subject.trim() || !content.trim() || submitting) ? 'var(--surface-hover)' : 'var(--theme-500)',
            color: (!subject.trim() || !content.trim() || submitting) ? 'var(--text-secondary)' : '#fff',
            fontWeight: 700, fontSize: 14, transition: 'all 200ms',
          }}
        >
          {submitting ? 'Posting…' : 'Post Announcement'}
        </button>
        <button
          onClick={() => setOpen(false)}
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
      const rows = await window.electronAPI.getArchivedAnnouncements(empId)
      setArchived(rows || [])
    } catch(e) { console.error(e) }
  }, [empId])

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

    ch.bind('new-announcement', () => { load() })

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

  const displayList = view === 'archived' ? archived : announcements

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--page-bg)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
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
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-hover)', borderRadius: 10, padding: 3, gap: 2 }}>
            {[
              { id: 'feed', label: 'Feed' },
              { id: 'archived', label: 'Archive' },
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
                {tab.id === 'archived' ? <Archive size={12} style={{ marginRight: 4, display: 'inline' }} /> : null}
                {tab.label}
              </button>
            ))}
          </div>

          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Compose box (HR/Admin + feed view only) */}
          {canPost && view === 'feed' && (
            <ComposeBox
              currentUser={currentUser}
              employees={employees}
              onPosted={load}
            />
          )}

          {/* Archive view header */}
          {view === 'archived' && (
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
                {view === 'archived' ? 'No archived announcements' : 'No announcements yet'}
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
                  isArchived={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
