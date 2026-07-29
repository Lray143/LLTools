export const THEME_STORAGE_KEY = 'lltools-theme'

// ── Define Available Themes ──────────────────────────────────────────────────

export const THEMES = [
  {
    id: 'original-light',
    name: 'Original Light',
    type: 'light',
    colors: {
      pageBg: '#f9f9fb',
      pageBgAlt: '#f3f3f5',
      surface: '#ffffff',
      surfaceHover: '#fafafa',
      border: '#e5e5e5',
      borderStrong: '#d4d4d4',
      textPrimary: '#1a1a1a',
      textSecondary: '#6b7280',
      accentBg: '#f97316',      // orange-500
      accentText: '#ffffff',
      accentHover: '#ea580c',   // orange-600
      sidebarBg: '#1c1c1e',
      sidebarActive: '#f97316'
    }
  },
  {
    id: 'original-dark',
    name: 'Original Dark',
    type: 'dark',
    colors: {
      pageBg: '#111318',
      pageBgAlt: '#1a1d24',
      surface: '#1e2128',
      surfaceHover: '#262a33',
      border: '#2e3340',
      borderStrong: '#3d4455',
      textPrimary: '#e8eaed',
      textSecondary: '#9aa0ac',
      accentBg: '#f97316',
      accentText: '#ffffff',
      accentHover: '#fb923c',
      sidebarBg: '#0d0f13',
      sidebarActive: '#f97316'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: {
      pageBg: '#282a36',
      pageBgAlt: '#21222c',
      surface: '#44475a',
      surfaceHover: '#6272a4',
      border: '#6272a4',
      borderStrong: '#f8f8f2',
      textPrimary: '#f8f8f2',
      textSecondary: '#bfbfbf',
      accentBg: '#ff79c6',
      accentText: '#ffffff',
      accentHover: '#ff92df',
      sidebarBg: '#21222c',
      sidebarActive: '#ff79c6'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
      pageBg: '#2e3440',
      pageBgAlt: '#242933',
      surface: '#3b4252',
      surfaceHover: '#434c5e',
      border: '#4c566a',
      borderStrong: '#d8dee9',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      accentBg: '#88c0d0',
      accentText: '#2e3440',
      accentHover: '#8fbcbb',
      sidebarBg: '#242933',
      sidebarActive: '#88c0d0'
    }
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    type: 'dark',
    colors: {
      pageBg: '#2d2a2e',
      pageBgAlt: '#221f22',
      surface: '#403e41',
      surfaceHover: '#5b595c',
      border: '#5b595c',
      borderStrong: '#fcfcfa',
      textPrimary: '#fcfcfa',
      textSecondary: '#ababaa',
      accentBg: '#ffd866',
      accentText: '#2d2a2e',
      accentHover: '#ffdf85',
      sidebarBg: '#221f22',
      sidebarActive: '#ffd866'
    }
  },
  {
    id: 'nature',
    name: 'Nature Green',
    type: 'light',
    colors: {
      pageBg: '#f4fbf4',
      pageBgAlt: '#e6f4e6',
      surface: '#ffffff',
      surfaceHover: '#f9fdf9',
      border: '#c3e6c3',
      borderStrong: '#8fd18f',
      textPrimary: '#1b4332',
      textSecondary: '#40916c',
      accentBg: '#2d6a4f',
      accentText: '#ffffff',
      accentHover: '#1b4332',
      sidebarBg: '#081c15',
      sidebarActive: '#52b788'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    type: 'light',
    colors: {
      pageBg: '#f0f9ff',
      pageBgAlt: '#e0f2fe',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      border: '#bae6fd',
      borderStrong: '#7dd3fc',
      textPrimary: '#0c4a6e',
      textSecondary: '#0284c7',
      accentBg: '#0ea5e9',
      accentText: '#ffffff',
      accentHover: '#0284c7',
      sidebarBg: '#0369a1',
      sidebarActive: '#38bdf8'
    }
  },
  {
    id: 'discord',
    name: 'Discord Dark',
    type: 'dark',
    colors: {
      pageBg: '#313338',
      pageBgAlt: '#2b2d31',
      surface: '#383a40',
      surfaceHover: '#404249',
      border: '#1e1f22',
      borderStrong: '#2b2d31',
      textPrimary: '#dbdee1',
      textSecondary: '#949ba4',
      accentBg: '#5865f2',
      accentText: '#ffffff',
      accentHover: '#4752c4',
      sidebarBg: '#1e1f22',
      sidebarActive: '#5865f2'
    }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    type: 'dark',
    colors: {
      pageBg: '#0d1117',
      pageBgAlt: '#010409',
      surface: '#161b22',
      surfaceHover: '#21262d',
      border: '#30363d',
      borderStrong: '#8b949e',
      textPrimary: '#c9d1d9',
      textSecondary: '#8b949e',
      accentBg: '#238636',
      accentText: '#ffffff',
      accentHover: '#2ea043',
      sidebarBg: '#010409',
      sidebarActive: '#238636'
    }
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    type: 'light',
    colors: {
      pageBg: '#fff5f7',
      pageBgAlt: '#ffe4e6',
      surface: '#ffffff',
      surfaceHover: '#fff1f2',
      border: '#fecdd3',
      borderStrong: '#fda4af',
      textPrimary: '#881337',
      textSecondary: '#be123c',
      accentBg: '#e11d48',
      accentText: '#ffffff',
      accentHover: '#be123c',
      sidebarBg: '#4c0519',
      sidebarActive: '#f43f5e'
    }
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    type: 'dark',
    colors: {
      pageBg: '#1e1b4b',
      pageBgAlt: '#171439',
      surface: '#2e2768',
      surfaceHover: '#3b3285',
      border: '#4c1d95',
      borderStrong: '#6d28d9',
      textPrimary: '#ede9fe',
      textSecondary: '#c4b5fd',
      accentBg: '#8b5cf6',
      accentText: '#ffffff',
      accentHover: '#7c3aed',
      sidebarBg: '#171439',
      sidebarActive: '#8b5cf6'
    }
  },
  {
    id: 'vercel',
    name: 'Vercel Geist',
    type: 'light',
    colors: {
      pageBg: '#fafafa',
      pageBgAlt: '#f5f5f5',
      surface: '#ffffff',
      surfaceHover: '#fafafa',
      border: '#eaeaea',
      borderStrong: '#999999',
      textPrimary: '#000000',
      textSecondary: '#666666',
      accentBg: '#000000',
      accentText: '#ffffff',
      accentHover: '#333333',
      sidebarBg: '#ffffff',
      sidebarActive: '#000000'
    }
  },
  {
    id: 'amber-night',
    name: 'Amber Night',
    type: 'dark',
    colors: {
      pageBg:       '#0c0800',
      pageBgAlt:    '#130e00',
      surface:      '#1c1500',
      surfaceHover: '#2a1f00',
      border:       '#3d2e00',
      borderStrong: '#8b6400',
      textPrimary:  '#fff4d6',
      textSecondary:'#c9a04a',
      accentBg:     '#d97706',
      accentText:   '#ffffff',
      accentHover:  '#f59e0b',
      sidebarBg:    '#070500',
      sidebarActive:'#d97706'
    }
  },
  {
    id: 'kuromi',
    name: 'Kuromi',
    type: 'dark',
    mascotSidebar: './kuromi_mascot.png',
    mascotEmpty: './kuromi_empty_state.png',
    mascotFilter: 'hue-rotate(260deg) saturate(5) drop-shadow(0 0 12px rgba(147,51,234,0.7))',
    colors: {
      pageBg: '#0d0814',
      pageBgAlt: '#120b1e',
      surface: '#1c1230',
      surfaceHover: '#271847',
      border: '#3b2260',
      borderStrong: '#7c3aed',
      textPrimary: '#f0e6ff',
      textSecondary: '#c4a8f0',
      accentBg: '#9333ea',
      accentText: '#ffffff',
      accentHover: '#a855f7',
      sidebarBg: '#08040f',
      sidebarActive: '#9333ea'
    }
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    type: 'light',
    mascotSidebar: './sunflower_mascot.svg',
    mascotEmpty: './sunflower_empty_state.svg',
    mascotFilter: 'drop-shadow(0 0 12px rgba(245,158,11,0.5))',
    colors: {
      pageBg: '#fffbeb',
      pageBgAlt: '#fef3c7',
      surface: '#ffffff',
      surfaceHover: '#fffbeb',
      border: '#fde68a',
      borderStrong: '#fbbf24',
      textPrimary: '#451a03',
      textSecondary: '#78350f',
      accentBg: '#f59e0b',
      accentText: '#ffffff',
      accentHover: '#d97706',
      sidebarBg: '#451a03',
      sidebarActive: '#f59e0b'
    }
  }
]

// ── Persistence ──────────────────────────────────────────────────────────────

export function getSavedTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  
  // Backward compatibility: If the saved theme is a hex code or null, default to original light or dark
  if (!saved || saved.startsWith('#')) {
    // Check if they previously had dark mode enabled via the old MODE_STORAGE_KEY
    const oldMode = localStorage.getItem('lltools-theme-mode')
    if (oldMode === 'dark' || oldMode === 'system') {
      return 'original-dark'
    }
    return 'original-light'
  }
  
  return saved
}

export function saveTheme(themeId) {
  localStorage.setItem(THEME_STORAGE_KEY, themeId)
}

// ── Apply theme to document ──────────────────────────────────────────────────

// Derive the full theme-50…900 palette from a hex accent colour.
// For light themes: lighter shades = accent blended toward white.
// For dark themes:  lighter shades = accent blended toward the surface colour.
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function blendHex(hex1, hex2, t) {
  const a = hexToRgb(hex1)
  const b = hexToRgb(hex2)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `#${[r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function deriveThemePalette(accentBg, isDark, surface) {
  // For light: blend accent toward white for lighter shades, toward black for darker.
  // For dark: blend accent toward surface colour for lighter shades, toward black for darker.
  const lightBase  = isDark ? (surface || '#1e2128') : '#ffffff'
  const darkBase   = '#000000'

  return {
    '--theme-50':  blendHex(accentBg, lightBase, 0.92),
    '--theme-100': blendHex(accentBg, lightBase, 0.82),
    '--theme-200': blendHex(accentBg, lightBase, 0.65),
    '--theme-300': blendHex(accentBg, lightBase, 0.45),
    '--theme-400': blendHex(accentBg, lightBase, 0.22),
    '--theme-500': accentBg,
    '--theme-600': blendHex(accentBg, darkBase, 0.12),
    '--theme-700': blendHex(accentBg, darkBase, 0.26),
    '--theme-800': blendHex(accentBg, darkBase, 0.42),
    '--theme-900': blendHex(accentBg, darkBase, 0.58),
  }
}

export function applyThemeToDocument(themeId) {
  const root = document.documentElement
  
  // Performance optimization: prevent full DOM style recalculations if the theme is already active
  if (root.dataset.activeTheme === themeId) return
  root.dataset.activeTheme = themeId

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]

  // Set CSS custom properties
  root.style.setProperty('--page-bg',        theme.colors.pageBg)
  root.style.setProperty('--page-bg-alt',    theme.colors.pageBgAlt)
  root.style.setProperty('--surface',        theme.colors.surface)
  root.style.setProperty('--surface-hover',  theme.colors.surfaceHover)
  root.style.setProperty('--border',         theme.colors.border)
  root.style.setProperty('--border-strong',  theme.colors.borderStrong)
  root.style.setProperty('--text-primary',   theme.colors.textPrimary)
  root.style.setProperty('--text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--accent-bg',      theme.colors.accentBg)
  root.style.setProperty('--accent-text',    theme.colors.accentText)
  root.style.setProperty('--accent-hover',   theme.colors.accentHover)
  root.style.setProperty('--sidebar-bg',     theme.colors.sidebarBg)
  root.style.setProperty('--sidebar-active', theme.colors.sidebarActive)

  // Derive and apply the full theme palette so bg-theme-*, border-theme-*, text-theme-* all update
  const palette = deriveThemePalette(
    theme.colors.accentBg,
    theme.type === 'dark',
    theme.colors.surface
  )
  for (const [prop, value] of Object.entries(palette)) {
    root.style.setProperty(prop, value)
  }

  // Mascot images (empty string if not a mascot theme)
  root.style.setProperty('--mascot-sidebar', theme.mascotSidebar ? `url('${theme.mascotSidebar}')` : 'none')
  root.style.setProperty('--mascot-filter',  theme.mascotFilter || 'none')
  root.dataset.mascotSidebar  = theme.mascotSidebar  || ''
  root.dataset.mascotEmpty    = theme.mascotEmpty    || ''

  // Toggle Tailwind's dark mode class
  if (theme.type === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

