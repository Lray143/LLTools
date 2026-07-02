// ── Input Validation & Auto-Formatting Utilities ──────────────────────────────
// Shared across all modules for consistent data quality.

// Filipino lowercase particles that stay lowercase in Title Case
const LOWERCASE_PARTICLES = new Set([
  'de', 'dela', 'del', 'delos', 'das', 'ng', 'ni', 'sa',
])

/**
 * Smart Title Case — capitalises the first letter of each word,
 * but keeps Filipino surname particles lowercase (unless first word).
 * "juan dela cruz" → "Juan dela Cruz"
 * "ana de leon"    → "Ana de Leon"
 */
export function toTitleCase(str) {
  if (!str) return ''
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (i > 0 && LOWERCASE_PARTICLES.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

/**
 * Sentence case — capitalise only the first letter of the string.
 * "hello world" → "Hello world"
 */
export function toSentenceCase(str) {
  if (!str) return ''
  const trimmed = str.trim().replace(/\s+/g, ' ')
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Strip everything except digits from a string.
 * "ABC-123" → "123"
 */
export function digitsOnly(str) {
  if (!str) return ''
  return String(str).replace(/\D/g, '')
}

/**
 * Format a Philippine mobile number: 09XX-XXX-XXXX
 * Handles raw digits (09171234567) and messy input.
 * Non-PH-format strings are returned trimmed but unchanged.
 */
export function formatContact(str) {
  if (!str) return ''
  const raw = str.replace(/[\s\-().]/g, '')
  // Match 11-digit PH mobile (09xxxxxxxxx) or +63 variant
  const ph11 = raw.match(/^(0\d{10})$/)
  if (ph11) {
    const d = ph11[1]
    return `${d.slice(0, 4)}-${d.slice(4, 7)}-${d.slice(7)}`
  }
  const ph63 = raw.match(/^\+?(63\d{10})$/)
  if (ph63) {
    const d = '0' + ph63[1].slice(2)
    return `${d.slice(0, 4)}-${d.slice(4, 7)}-${d.slice(7)}`
  }
  return str.trim()
}

/**
 * Clamp a numeric value between min and max (inclusive).
 * Returns '' if input is empty/NaN.
 */
export function clampNumber(val, min, max) {
  if (val === '' || val === null || val === undefined) return ''
  const n = Number(val)
  if (isNaN(n)) return ''
  return String(Math.min(max, Math.max(min, n)))
}

/**
 * Validate blood pressure format (e.g. "120/80").
 * Returns true if valid or empty.
 */
export function isValidBP(str) {
  if (!str || !str.trim()) return true
  return /^\d{2,3}\/\d{2,3}$/.test(str.trim())
}

/**
 * Auto-format and clamp blood pressure to realistic human bounds.
 * Clamps systolic (50-300) and diastolic (30-200).
 * "1000/1000" → "300/200"
 */
export function formatBP(str) {
  if (!str || !str.trim()) return ''
  const parts = str.split('/')
  if (parts.length !== 2) return str.trim()
  
  let sys = parseInt(parts[0].replace(/\D/g, ''), 10)
  let dia = parseInt(parts[1].replace(/\D/g, ''), 10)
  
  if (isNaN(sys) || isNaN(dia)) return str.trim()
  
  sys = Math.min(300, Math.max(50, sys))
  dia = Math.min(200, Math.max(30, dia))
  
  return `${sys}/${dia}`
}

/**
 * Basic URL validation — checks for protocol and domain.
 */
export function isValidUrl(str) {
  if (!str) return false
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`)
    return !!url.hostname
  } catch {
    return false
  }
}

/**
 * Auto-prefix https:// if the URL doesn't start with a protocol.
 */
export function ensureProtocol(str) {
  if (!str) return ''
  const trimmed = str.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Sanitise free text — trim edges, collapse multiple spaces.
 */
export function sanitizeText(str) {
  if (!str) return ''
  return str.trim().replace(/\s+/g, ' ')
}
