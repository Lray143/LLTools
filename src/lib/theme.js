export const THEME_STORAGE_KEY = 'lltools-theme'
export const MODE_STORAGE_KEY  = 'lltools-theme-mode'

// ── Color helpers ────────────────────────────────────────────────────────────

function hexToHSL(H) {
  let r = 0, g = 0, b = 0
  if (H.length === 4) {
    r = parseInt('0x' + H[1] + H[1])
    g = parseInt('0x' + H[2] + H[2])
    b = parseInt('0x' + H[3] + H[3])
  } else if (H.length === 7) {
    r = parseInt('0x' + H[1] + H[2])
    g = parseInt('0x' + H[3] + H[4])
    b = parseInt('0x' + H[5] + H[6])
  }
  r /= 255; g /= 255; b /= 255
  let cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin,
      h = 0, s = 0, l = 0

  if      (delta === 0) h = 0
  else if (cmax === r)  h = ((g - b) / delta) % 6
  else if (cmax === g)  h = (b - r) / delta + 2
  else                  h = (r - g) / delta + 4

  h = Math.round(h * 60)
  if (h < 0) h += 360
  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100 }
}

function HSLToHex(h, s, l) {
  s /= 100; l /= 100
  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c / 2,
      r = 0, g = 0, b = 0
  if      (h >= 0   && h < 60)  { r = c; g = x; b = 0 }
  else if (h >= 60  && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x }
  r = Math.round((r + m) * 255).toString(16).padStart(2, '0')
  g = Math.round((g + m) * 255).toString(16).padStart(2, '0')
  b = Math.round((b + m) * 255).toString(16).padStart(2, '0')
  return '#' + r + g + b
}

// ── Scale generator ──────────────────────────────────────────────────────────

function makeScale(h, s) {
  const sat = Math.min(s, 85)
  return {
    50:  HSLToHex(h, sat, 97),
    100: HSLToHex(h, sat, 92),
    200: HSLToHex(h, sat, 82),
    300: HSLToHex(h, sat, 70),
    400: HSLToHex(h, sat, 58),
    500: HSLToHex(h, sat, 48),
    600: HSLToHex(h, sat, 40),
    700: HSLToHex(h, sat, 32),
    800: HSLToHex(h, sat, 22),
    900: HSLToHex(h, sat, 12),
  }
}

// ── Microsoft-style 3-color theme generation ─────────────────────────────────
// Given a base hex, derive three harmonious palettes:
//   primary   = the chosen hue (buttons, active states, sidebar accent)
//   secondary = +30° hue shift (page backgrounds, cards, surface tints)
//   accent    = +210° hue shift (complementary pop for badges, highlights)

export function generateThemeColors(baseHex) {
  const { h, s } = hexToHSL(baseHex)
  return {
    primary:   makeScale(h, s),
    secondary: makeScale((h + 30) % 360, Math.max(s * 0.5, 15)),  // softer, more muted
    accent:    makeScale((h + 210) % 360, Math.min(s, 70)),         // complementary pop
  }
}

// ── Preset theme palettes (Microsoft-style) ──────────────────────────────────
// Each entry: { name, base (hex), preview: [3 hex colors shown in the swatch] }

export const THEME_PRESETS = [
  { name: 'Original',   base: '#f97316', mode: 'default' },
  { name: 'Dark',       base: '#f97316', mode: 'dark', preview: ['#1e2128', '#f97316', '#3d4455'] }, // Dark theme with orange accent
  { name: 'Coral',      base: '#f43f5e', mode: 'default' },
  { name: 'Rose',       base: '#ec4899', mode: 'default' },
  { name: 'Fuchsia',    base: '#d946ef', mode: 'default' },
  { name: 'Purple',     base: '#a855f7', mode: 'default' },
  { name: 'Violet',     base: '#8b5cf6', mode: 'default' },
  { name: 'Indigo',     base: '#6366f1', mode: 'default' },
  { name: 'Blue',       base: '#3b82f6', mode: 'default' },
  { name: 'Sky',        base: '#0ea5e9', mode: 'default' },
  { name: 'Cyan',       base: '#06b6d4', mode: 'default' },
  { name: 'Teal',       base: '#14b8a6', mode: 'default' },
  { name: 'Emerald',    base: '#10b981', mode: 'default' },
  { name: 'Green',      base: '#22c55e', mode: 'default' },
  { name: 'Lime',       base: '#84cc16', mode: 'default' },
  { name: 'Yellow',     base: '#eab308', mode: 'default' },
  { name: 'Amber',      base: '#f59e0b', mode: 'default' },
]

// Compute preview colors for each preset if not already defined
THEME_PRESETS.forEach(p => {
  if (!p.preview) {
    const c = generateThemeColors(p.base)
    p.preview = [c.primary[500], c.secondary[200], c.accent[400]]
  }
})

// ── Persistence ──────────────────────────────────────────────────────────────

export function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || '#3b82f6'
}

export function saveTheme(hex) {
  localStorage.setItem(THEME_STORAGE_KEY, hex)
}

// ── Apply theme to document ──────────────────────────────────────────────────
// This sets the semantic CSS custom properties based on the chosen color.
// It respects the current display mode — if dark mode is active, it will
// apply dark-appropriate values instead.

export function applyThemeToDocument(hex) {
  const { primary, secondary, accent } = generateThemeColors(hex)
  const root = document.documentElement

  // Set all three palette scales as CSS custom properties
  const palettes = { primary, secondary, accent }
  for (const [name, scale] of Object.entries(palettes)) {
    for (const [weight, color] of Object.entries(scale)) {
      root.style.setProperty(`--theme-${name}-${weight}`, color)
    }
  }

  // Backward-compatible: --theme-50 through --theme-900 map to primary
  for (const [weight, color] of Object.entries(primary)) {
    root.style.setProperty(`--theme-${weight}`, color)
  }

  // Apply semantic tokens based on the current mode
  const currentMode = resolveEffectiveMode(getSavedMode())
  applySemanticTokens(currentMode, primary, secondary)
}

// ── Dark mode ────────────────────────────────────────────────────────────────
// Modes:
//   'default' — the standard light theme (original design)
//   'dark'    — dark backgrounds, light text across the entire app
//   'system'  — follow the device OS preference

export function getSavedMode() {
  return localStorage.getItem(MODE_STORAGE_KEY) ?? 'default'
}

export function saveMode(mode) {
  localStorage.setItem(MODE_STORAGE_KEY, mode)
}

// Resolve 'system' to either 'default' or 'dark'
function resolveEffectiveMode(mode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'
  }
  // treat 'light' (old stored value) as 'default'
  if (mode === 'light') return 'default'
  return mode
}

// Set the semantic CSS custom properties for the given mode
function applySemanticTokens(effectiveMode, primary, secondary) {
  const root = document.documentElement

  if (effectiveMode === 'dark') {
    root.classList.add('dark')
    root.style.setProperty('--page-bg',        '#111318')
    root.style.setProperty('--page-bg-alt',    '#1a1d24')
    root.style.setProperty('--surface',        '#1e2128')
    root.style.setProperty('--surface-hover',  '#262a33')
    root.style.setProperty('--border',         '#2e3340')
    root.style.setProperty('--border-strong',  '#3d4455')
    root.style.setProperty('--text-primary',   '#e8eaed')
    root.style.setProperty('--text-secondary', '#9aa0ac')
    root.style.setProperty('--accent-bg',      primary[500])
    root.style.setProperty('--accent-text',    '#ffffff')
    root.style.setProperty('--accent-hover',   primary[400])
    root.style.setProperty('--sidebar-bg',     '#0d0f13')
    root.style.setProperty('--sidebar-active', primary[500])
  } else {
    // default (light) mode
    root.classList.remove('dark')
    root.style.setProperty('--page-bg',        '#f9f9fb')
    root.style.setProperty('--page-bg-alt',    '#f3f3f5')
    root.style.setProperty('--surface',        '#ffffff')
    root.style.setProperty('--surface-hover',  '#fafafa')
    root.style.setProperty('--border',         '#e5e5e5')
    root.style.setProperty('--border-strong',  '#d4d4d4')
    root.style.setProperty('--text-primary',   '#1a1a1a')
    root.style.setProperty('--text-secondary', '#6b7280')
    root.style.setProperty('--accent-bg',      primary[500])
    root.style.setProperty('--accent-text',    '#ffffff')
    root.style.setProperty('--accent-hover',   primary[600])
    root.style.setProperty('--sidebar-bg',     '#1c1c1e')
    root.style.setProperty('--sidebar-active', primary[500])
  }
}

export function applyModeToDocument(mode) {
  // Re-apply semantic tokens with the stored theme color
  const hex = getSavedTheme()
  const { primary, secondary } = generateThemeColors(hex)
  const effectiveMode = resolveEffectiveMode(mode)
  applySemanticTokens(effectiveMode, primary, secondary)
}

// Legacy export for backward compatibility
export function generateThemeScale(baseHex) {
  const { h, s } = hexToHSL(baseHex)
  return makeScale(h, s)
}
