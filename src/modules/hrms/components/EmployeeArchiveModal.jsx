import { useState } from "react"
import { Archive, RotateCcw, Trash2, X, ChevronDown, Search } from "lucide-react"
import SearchBar from "../../../components/ui/SearchBar"
import { getColor, getInitials } from "../employeeConstants"

const SORT_OPTIONS = [
  { value: 'az',   label: 'A → Z' },
  { value: 'za',   label: 'Z → A' },
  { value: 'dept', label: 'By Department' },
  { value: 'id',   label: 'By Employee ID' },
]

export function EmployeeArchiveModal({ open, archived, onUnarchive, onPermanentDelete, onClose }) {
  const [search, setSearch]               = useState("")
  const [sortBy, setSortBy]               = useState('az')
  const [sortOpen, setSortOpen]           = useState(false)
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState(null)

  const filtered = [...archived]
    .filter(emp =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.dept.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employee_no ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'az')   return a.name.localeCompare(b.name)
      if (sortBy === 'za')   return b.name.localeCompare(a.name)
      if (sortBy === 'dept') return (a.dept || '').localeCompare(b.dept || '') || a.name.localeCompare(b.name)
      if (sortBy === 'id')   return (a.employee_no || '').localeCompare(b.employee_no || '')
      return 0
    })

  function handleConfirmPermanent() {
    if (confirmDeleteEmp) {
      onPermanentDelete(confirmDeleteEmp.id)
      setConfirmDeleteEmp(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* ── SIDE PANEL OVERLAY ── */}
      <div
        className="fixed inset-0 z-50 flex justify-end"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          id="tour-archive-panel"
          className="w-full max-w-lg h-full flex flex-col shadow-2xl"
          style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'color-mix(in srgb, var(--theme-500) 12%, var(--surface))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Archive size={17} style={{ color: 'var(--theme-500)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Archived Employees
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {archived.length} archived employee{archived.length !== 1 ? 's' : ''} · Restore or permanently delete
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search + Sort */}
          <div
            id="tour-archive-search-sort"
            className="flex gap-2 px-6 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div style={{ flex: 1 }}>
              <SearchBar
                placeholder="Search by name, department, or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Sort dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                style={{
                  height: 36, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: sortOpen ? '1px solid var(--theme-500)' : '1px solid var(--border)',
                  background: 'var(--surface)', color: sortOpen ? 'var(--theme-500)' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, transition: 'all 150ms',
                }}
              >
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <ChevronDown
                  size={12}
                  style={{ transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
                />
              </button>
              {sortOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 60, padding: '4px 0', minWidth: 150,
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '7px 14px', fontSize: 13, border: 'none', cursor: 'pointer',
                        background: 'transparent',
                        color: sortBy === opt.value ? 'var(--theme-500)' : 'var(--text-primary)',
                        fontWeight: sortBy === opt.value ? 600 : 400,
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div id="tour-archive-list" style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

            {/* Empty state */}
            {archived.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Archive size={28} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Archive is empty</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Removed employees will appear here</p>
                </div>
              </div>
            )}

            {/* No search results */}
            {archived.length > 0 && filtered.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Search size={28} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>No results for "{search}"</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Try a different name, department, or ID</p>
                </div>
              </div>
            )}

            {/* Employee list */}
            {filtered.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map(emp => (
                  <div
                    key={emp.id}
                    className="group"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--page-bg)',
                      transition: 'border-color 150ms, background 150ms',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--theme-500)'
                      e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-500) 5%, var(--surface))'
                      e.currentTarget.querySelector('.emp-actions').style.opacity = '1'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--page-bg)'
                      e.currentTarget.querySelector('.emp-actions').style.opacity = '0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${getColor(emp.name)}`}>
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>{emp.dept} · {emp.employee_no}</p>
                      </div>
                    </div>

                    <div className="emp-actions" style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0, transition: 'opacity 150ms' }}>
                      <button
                        onClick={() => onUnarchive(emp)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          border: '1px solid transparent', cursor: 'pointer',
                          background: 'transparent', color: '#16a34a',
                          transition: 'background 150ms, border-color 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; e.currentTarget.style.borderColor = 'rgba(22,163,74,0.25)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                      >
                        <RotateCcw size={13} />
                        Restore
                      </button>
                      <button
                        onClick={() => setConfirmDeleteEmp(emp)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          border: '1px solid transparent', cursor: 'pointer',
                          background: 'transparent', color: '#ef4444',
                          transition: 'background 150ms, border-color 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Restore brings an employee back to active · Permanent delete cannot be undone
            </p>
          </div>
        </div>
      </div>

      {/* ── CONFIRM PERMANENT DELETE DIALOG ── */}
      {confirmDeleteEmp && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 70,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDeleteEmp(null) }}
        >
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '28px 28px 24px',
            width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                Permanently Delete?
              </h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
              This action cannot be undone.{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{confirmDeleteEmp?.name}</strong>
              {' '}will be completely removed from the system.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmDeleteEmp(null)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanent}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: 'none', background: '#ef4444',
                  color: '#fff', cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}