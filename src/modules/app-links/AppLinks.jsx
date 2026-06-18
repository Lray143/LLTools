import { useState, useEffect, useCallback, useRef } from 'react'
import { Link2, Save, ExternalLink, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'

const DEFAULT_LEAVE_GFORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSfSBRl4zYfbTMCJzOfYz_bEK4y6LuV2cpu518K-xPbjWKibnA/viewform?embedded=true'

function normalizeFormUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return trimmed
  if (!trimmed.includes('docs.google.com/forms')) return trimmed
  if (trimmed.includes('embedded=true')) return trimmed
  const sep = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${sep}embedded=true`
}

function draftFromLink(link) {
  return {
    label: link.label ?? '',
    url: link.url ?? '',
    description: link.description ?? '',
  }
}

function isRemoteNewer(remoteAt, localAt) {
  if (!remoteAt) return false
  if (!localAt) return true
  return remoteAt > localAt
}

export default function AppLinks({ currentUser, refreshKey = 0 }) {
  const [links, setLinks]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [savingKey, setSavingKey]     = useState(null)
  const [successKey, setSuccessKey]     = useState(null)
  const [errorMsg, setErrorMsg]       = useState('')
  const [drafts, setDrafts]           = useState({})

  // Tracks keys the user is actively editing — background sync must not overwrite these.
  const dirtyKeysRef    = useRef(new Set())
  const savedVersionRef = useRef({})
  const savingKeyRef    = useRef(null)
  const prevRefreshKey  = useRef(refreshKey)

  const mergeRows = useCallback((rows, { initial = false } = {}) => {
    const list = rows ?? []
    setLinks(list)

    setDrafts(prev => {
      const next = { ...prev }
      for (const link of list) {
        const key = link.key
        if (!key) continue

        const isDirty  = dirtyKeysRef.current.has(key)
        const isSaving = savingKeyRef.current === key
        const saved    = savedVersionRef.current[key]

        if (initial) {
          next[key] = draftFromLink(link)
          continue
        }

        if (isDirty || isSaving) continue

        // Ignore stale remote data that arrived before our save finished propagating.
        if (saved && !isRemoteNewer(link.updatedAt, saved.updatedAt)) continue

        const currentDraft = prev[key]
        const remoteDraft  = draftFromLink(link)
        if (
          !currentDraft ||
          currentDraft.label !== remoteDraft.label ||
          currentDraft.url !== remoteDraft.url ||
          currentDraft.description !== remoteDraft.description
        ) {
          next[key] = remoteDraft
        }
      }
      return next
    })
  }, [])

  const fetchLinks = useCallback(async ({ initial = false } = {}) => {
    if (initial) setLoading(true)
    try {
      const rows = await window.electronAPI.getAppLinks()
      mergeRows(rows, { initial })
    } catch (e) {
      console.error(e)
      if (initial) setErrorMsg('Failed to load app links.')
    } finally {
      if (initial) setLoading(false)
    }
  }, [mergeRows])

  // Initial load only — no spinner on background sync ticks.
  useEffect(() => { fetchLinks({ initial: true }) }, [fetchLinks])

  // Background merge when Turso sync completes (~every 5s app-wide).
  useEffect(() => {
    if (refreshKey === prevRefreshKey.current) return
    prevRefreshKey.current = refreshKey
    fetchLinks({ initial: false })
  }, [refreshKey, fetchLinks])

  function updateDraft(key, field, value) {
    dirtyKeysRef.current.add(key)
    setDrafts(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  async function handleSave(link) {
    const draft = drafts[link.key]
    if (!draft?.url?.trim()) {
      setErrorMsg('URL cannot be empty.')
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }

    const normalizedUrl = normalizeFormUrl(draft.url)
    const payload = {
      key: link.key,
      label: draft.label?.trim() || link.label || 'Leave Request Form',
      url: normalizedUrl,
      description: draft.description?.trim() || link.description || null,
      updatedBy: currentUser?.username ?? 'admin',
    }

    setSavingKey(link.key)
    savingKeyRef.current = link.key
    setErrorMsg('')
    dirtyKeysRef.current.delete(link.key)

    try {
      const saved = await window.electronAPI.upsertAppLink(payload)
      const resolved = saved ?? { ...link, ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }

      savedVersionRef.current[link.key] = {
        url: normalizedUrl,
        updatedAt: resolved.updatedAt ?? '',
      }

      setLinks(prev => prev.map(l => l.key === link.key ? { ...l, ...resolved } : l))
      setDrafts(prev => ({
        ...prev,
        [link.key]: draftFromLink(resolved),
      }))

      setSuccessKey(link.key)
      setTimeout(() => setSuccessKey(null), 3000)
    } catch (e) {
      console.error(e)
      dirtyKeysRef.current.add(link.key)
      setErrorMsg('Failed to save link: ' + (e?.message ?? String(e)))
      setTimeout(() => setErrorMsg(''), 6000)
    } finally {
      savingKeyRef.current = null
      setSavingKey(null)
    }
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>App Links</h1>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage URLs used across the app. Changes sync to all users automatically.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col gap-5">
        {errorMsg && (
          <div className="p-3 rounded-lg text-sm font-medium border bg-red-50 border-red-200 text-red-800">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p className="text-sm opacity-50" style={{ color: 'var(--text-secondary)' }}>Loading links...</p>
        ) : links.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No links configured yet.</p>
        ) : (
          links.map(link => {
            const draft = drafts[link.key] ?? { label: '', url: '', description: '' }
            const isSaving = savingKey === link.key
            const justSaved = successKey === link.key
            const previewUrl = normalizeFormUrl(draft.url || DEFAULT_LEAVE_GFORM)
            const isDirty = dirtyKeysRef.current.has(link.key)

            return (
              <div
                key={link.key}
                className="rounded-xl p-6 shadow-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--page-bg)', border: '1px solid var(--border)' }}
                  >
                    <Link2 size={18} style={{ color: 'var(--theme-500)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {link.key}
                    </p>
                    <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
                      {link.key === 'leave_gform'
                        ? 'Used in Leave Requests when employees click "New Request".'
                        : (link.description || 'App-wide link')}
                    </p>
                    {link.updatedAt && (
                      <p className="text-xs mt-1 m-0" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                        Last updated {link.updatedAt}{link.updatedBy ? ` by ${link.updatedBy}` : ''}
                        {isDirty && !isSaving && ' · unsaved changes'}
                      </p>
                    )}
                  </div>
                  {justSaved && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle size={14} /> Saved — syncing to all users
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Display name
                    </label>
                    <input
                      value={draft.label}
                      onChange={e => updateDraft(link.key, 'label', e.target.value)}
                      className="w-full rounded-lg text-sm outline-none px-3"
                      style={{
                        height: '38px',
                        background: 'var(--page-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      URL
                    </label>
                    <input
                      value={draft.url}
                      onChange={e => updateDraft(link.key, 'url', e.target.value)}
                      placeholder={DEFAULT_LEAVE_GFORM}
                      className="w-full rounded-lg text-sm outline-none px-3 font-mono"
                      style={{
                        height: '38px',
                        background: 'var(--page-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    {link.key === 'leave_gform' && (
                      <p className="text-xs mt-1.5 m-0" style={{ color: 'var(--text-secondary)' }}>
                        Paste a Google Form link. <code>?embedded=true</code> is added automatically if missing.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      className="border-0 text-sm h-9 px-4 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'var(--theme-500)', color: '#fff' }}
                      disabled={isSaving}
                      onClick={() => handleSave(link)}
                    >
                      <Save size={14} />
                      {isSaving ? 'Saving...' : 'Save link'}
                    </Button>
                    {draft.url?.trim() && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium"
                        style={{ color: 'var(--theme-500)' }}
                      >
                        <ExternalLink size={14} />
                        Preview in browser
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
