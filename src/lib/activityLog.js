/** @typedef {'employees'|'products'|'outlets'|'calculations'} ActivityModule */
/** @typedef {'add'|'edit'|'archive'|'permanent_delete'} ActivityAction */

const editDebouncers = new Map()
const editBuckets = new Map()

export function auditUser(currentUser) {
  return {
    userId:   String(currentUser?.employeeId || currentUser?.id || ''),
    userName: currentUser?.employeeName || currentUser?.username || 'Unknown user',
  }
}

export function emptyDisplay(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

export function formatDaySchedule(sched) {
  if (!sched || typeof sched !== 'object') return '—'
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days.map(d => {
    const entry = sched[d]
    if (entry === null) return `${d.slice(0, 3)}: Off`
    if (entry?.start && entry?.end) return `${d.slice(0, 3)}: ${entry.start}–${entry.end}`
    return `${d.slice(0, 3)}: —`
  }).join(' · ')
}

export function formatDiscounts(discounts) {
  if (!discounts?.length) return 'None'
  return discounts.map(d => `${d.name}: ${d.value}%`).join(', ')
}

export const EMPLOYEE_LOG_FIELDS = [
  { key: 'employee_no', label: 'Employee #' },
  { key: 'name', label: 'Name' },
  { key: 'dept', label: 'Department' },
  { key: 'role', label: 'Position' },
  { key: 'contact', label: 'Contact' },
  { key: 'daySchedule', label: 'Weekly schedule', format: formatDaySchedule },
]

export const OUTLET_LOG_FIELDS = [
  { key: 'name', label: 'Outlet name' },
  { key: 'address', label: 'Address' },
  { key: 'region', label: 'Region' },
  { key: 'status', label: 'Status' },
  { key: 'discounts', label: 'Discounts', format: formatDiscounts },
]

export const PRODUCT_ROW_FIELDS = [
  { key: 'caseBarcode', label: 'Case barcode' },
  { key: 'itemBarcode', label: 'Item barcode' },
  { key: 'description', label: 'Description' },
  { key: 'qty', label: 'QTY / case' },
  { key: 'size', label: 'Item size' },
  { key: 'price', label: 'Price' },
]

export function diffFields(before, after, fieldDefs) {
  const changes = []
  for (const def of fieldDefs) {
    const bRaw = before?.[def.key]
    const aRaw = after?.[def.key]
    const bStr = def.format ? def.format(bRaw) : emptyDisplay(bRaw)
    const aStr = def.format ? def.format(aRaw) : emptyDisplay(aRaw)
    if (bStr !== aStr) {
      changes.push({ field: def.key, label: def.label, before: bStr, after: aStr })
    }
  }
  return changes
}

export function snapshotFromFields(obj, fieldDefs) {
  const snapshot = {}
  for (const def of fieldDefs) {
    const raw = obj?.[def.key]
    snapshot[def.label] = def.format ? def.format(raw) : emptyDisplay(raw)
  }
  return snapshot
}

/**
 * Structured activity payload stored as JSON in `details`.
 * @param {object} p
 */
export function buildActivityDetails({
  recordType,
  recordId,
  employeeNo,
  changes,
  snapshot,
  removedSnapshot,
  note,
  table,
}) {
  const payload = {}
  if (recordType) payload.recordType = recordType
  if (recordId) payload.recordId = String(recordId)
  if (employeeNo) payload.employeeNo = String(employeeNo)
  if (table) payload.table = table
  if (changes?.length) payload.changes = changes
  if (snapshot && Object.keys(snapshot).length) payload.snapshot = snapshot
  if (removedSnapshot && Object.keys(removedSnapshot).length) payload.removedSnapshot = removedSnapshot
  if (note) payload.note = note
  return payload
}

export function parseActivityDetails(raw) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch (_) { /* legacy plain-text */ }
  return { note: raw }
}

function serializeDetails(details) {
  if (!details) return null
  if (typeof details === 'string') return details.slice(0, 8000)
  return JSON.stringify(details).slice(0, 8000)
}

export async function logModuleActivity(currentUser, module, action, entityLabel, entityId = null, details = null) {
  const { userId, userName } = auditUser(currentUser)
  try {
    await window.electronAPI.addModuleActivityLog({
      module,
      action,
      entityLabel: String(entityLabel || '—').slice(0, 240),
      entityId: entityId ? String(entityId) : null,
      userId,
      userName,
      details: serializeDetails(details),
    })
  } catch (err) {
    console.error('Failed to write activity log', err)
  }
}

/** Debounced log with plain text or structured details. */
export function logModuleActivityDebounced(currentUser, module, action, entityLabel, entityId = null, details = null, delayMs = 2500) {
  const key = `${module}:${entityId ?? entityLabel}:${action}`
  if (editDebouncers.has(key)) clearTimeout(editDebouncers.get(key))
  editDebouncers.set(key, setTimeout(() => {
    editDebouncers.delete(key)
    logModuleActivity(currentUser, module, action, entityLabel, entityId, details)
  }, delayMs))
}

/**
 * Accumulate field-level edits for one record, then log once after idle.
 */
export function logFieldEditDebounced(currentUser, module, entityLabel, entityId, change, meta = {}, delayMs = 2500) {
  const key = `${module}:${entityId}:edit`
  let bucket = editBuckets.get(key)
  if (!bucket) {
    bucket = { entityLabel, meta, changesByField: new Map() }
    editBuckets.set(key, bucket)
  }
  bucket.changesByField.set(change.field, change)

  if (editDebouncers.has(key)) clearTimeout(editDebouncers.get(key))
  editDebouncers.set(key, setTimeout(() => {
    editDebouncers.delete(key)
    editBuckets.delete(key)
    const changes = Array.from(bucket.changesByField.values())
    logModuleActivity(currentUser, module, 'edit', bucket.entityLabel, entityId, buildActivityDetails({
      recordType: meta.recordType,
      recordId: entityId,
      employeeNo: meta.employeeNo,
      table: meta.table,
      changes,
      note: meta.note,
    }))
  }, delayMs))
}

export const ACTIVITY_ACTION_META = {
  add:              { label: 'Added',    color: '#16a34a' },
  edit:             { label: 'Edited',   color: 'var(--theme-500)' },
  archive:          { label: 'Archived', color: '#d97706' },
  permanent_delete: { label: 'Deleted',  color: '#dc2626' },
}

export const ACTIVITY_MODULE_LABELS = {
  employees:    'Employees',
  products:     'Products',
  outlets:      'Outlets',
  calculations: 'Calculations',
}
