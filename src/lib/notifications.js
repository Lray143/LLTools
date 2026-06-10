// src/lib/notifications.js
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight "seen IDs" tracker stored in localStorage.
// No DB changes required — works for a single-user desktop app.
// All keys are namespaced so different employees on the same machine don't collide.
// ─────────────────────────────────────────────────────────────────────────────

// Admin/HR: track pending items that need their attention
export const SEEN_REPORTS_KEY = 'lltools-seen-reports'
export const SEEN_LEAVES_KEY  = 'lltools-seen-leaves'

// Employee: track status-change updates on their own items (per-user)
export const myReportUpdatesKey = (userId) => `lltools-my-report-updates-${userId}`
export const myLeaveUpdatesKey  = (userId) => `lltools-my-leave-updates-${userId}`

/** Read the set of seen IDs from localStorage for a given key. */
function getSeenSet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

/** Persist the seen set back to localStorage. */
function saveSeenSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch { /* quota exceeded etc. — silently ignore */ }
}

/** Mark a single ID as seen. */
export function markSeen(key, id) {
  const set = getSeenSet(key)
  set.add(String(id))
  saveSeenSet(key, set)
}

/** Mark all given IDs as seen (bulk). */
export function markAllSeen(key, ids) {
  const set = getSeenSet(key)
  ids.forEach(id => set.add(String(id)))
  saveSeenSet(key, set)
}

/** Return only the items whose ID has NOT been seen yet. */
export function getUnseenItems(items, key) {
  const seen = getSeenSet(key)
  return items.filter(item => !seen.has(String(item.id)))
}

/** Convenience: return the unseen count. */
export function getUnseenCount(items, key) {
  return getUnseenItems(items, key).length
}
