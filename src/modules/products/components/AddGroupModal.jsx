// src/modules/products/components/AddGroupModal.jsx
import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function AddGroupModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [shakeError, setShakeError] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = name.trim().toUpperCase()
    if (!trimmed) {
      setShakeError(true)
      setError(true)
      setTimeout(() => setShakeError(false), 500)
      return
    }
    setError(false)
    onAdd(trimmed)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        width: '100%', maxWidth: '360px',
        padding: '28px',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px',
            transition: 'color 100ms',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={17} />
        </button>

        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Add Group Header
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Group headers separate product categories (e.g. ASTRINGENTS, SOAPS).
        </p>

        <label style={{
          display: 'block',
          fontSize: '11px', fontWeight: 700, color: 'var(--theme-500)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          marginBottom: '6px',
        }}>
          Group Name <span className={shakeError && error ? 'shake' : ''} style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(false) }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. TONERS"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px', fontSize: '13px',
            border: `1px solid ${error && !name.trim() ? '#ef4444' : '#e5e7eb'}`, borderRadius: '10px',
            outline: 'none', color: 'var(--text-primary)',
            transition: 'border-color 150ms',
          }}
          onFocus={e => e.target.style.borderColor = (error && !name.trim()) ? '#ef4444' : 'var(--theme-500)'}
          onBlur={e => e.target.style.borderColor = (error && !name.trim()) ? '#ef4444' : '#e5e7eb'}
        />
        {(error && !name.trim()) && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', marginBottom: 0 }}>Group name is required.</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '9px',
              borderRadius: '10px', border: '1px solid #e5e7eb',
              background: 'var(--surface)', color: 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'background 100ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            style={{
              flex: 1, padding: '9px',
              borderRadius: '10px', border: 'none',
              background: name.trim() ? 'var(--theme-500)' : 'var(--theme-200)',
              color: '#fff',
              fontSize: '13px', fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 150ms',
            }}
          >
            Add Group
          </button>
        </div>
      </div>
    </div>
  )
}