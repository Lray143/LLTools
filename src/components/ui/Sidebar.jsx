import { useState, useEffect } from 'react'
import {
  Megaphone, Users, ClipboardList, Calculator,
  BarChart3, Settings, Store, Fingerprint, LogOut,
  SoapDispenserDroplet, Pin, PinOff, CalendarClock, CalendarCheck, MessageSquare, Link2, HelpCircle
} from 'lucide-react'

const ROLE_LABELS = {
  admin:     'Administrator',
  hr:        'HR Department',
  clinic:    'Clinic Staff',
  inventory: 'Inventory',
  outlets:   'Outlets',
}

const ALL_NAV_ITEMS = [
  { id: 'announcements',    label: 'Announcements',   icon: Megaphone            },
  { id: 'employees',    label: 'Employees',       icon: Users                },
  { id: 'biometrics',   label: 'Biometrics',      icon: Fingerprint          },
  { id: 'my-attendance',label: 'My Attendance',   icon: CalendarCheck        },
  { id: 'clinic',       label: 'Clinic Log',      icon: ClipboardList        },
  { id: 'products',     label: 'Products',        icon: SoapDispenserDroplet },
  { id: 'outlets',      label: 'Outlets',         icon: Store                },
  { id: 'orders', label: 'Orders',    icon: Calculator           },
  { id: 'reports',      label: 'Reports',         icon: BarChart3            },
  { id: 'leaves',       label: 'Leave Requests',  icon: CalendarClock        },
]

const CHAT_ITEM     = { id: 'chat',     label: 'Chats',           icon: MessageSquare }
const APP_LINKS_ITEM = { id: 'app-links', label: 'App Links',      icon: Link2 }
const SETTINGS_ITEM = { id: 'settings', label: 'Settings', icon: Settings }

// ── Canvas-based background removal for mascot images ────────────────────────
// Iterates every pixel; if it's near-black (the baked-in bg), sets alpha = 0.
function useTransparentImage(src, threshold = 60) {
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => {
    if (!src) { setDataUrl(''); return }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < threshold && d[i+1] < threshold && d[i+2] < threshold) {
          d[i+3] = 0 // fully transparent
        }
      }
      ctx.putImageData(imgData, 0, 0)
      setDataUrl(canvas.toDataURL('image/png'))
    }
    img.src = src
  }, [src, threshold])
  return dataUrl
}

function Sidebar({ activePage, setActivePage, onLogout, allowedModules, currentUser, onPinChange, refreshKey = 0, moduleBadges = {} }) {
  const [isPinned, setIsPinned]   = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [mascotSidebar, setMascotSidebar] = useState(document.documentElement.dataset.mascotSidebar || '')
  const transparentMascot = useTransparentImage(mascotSidebar)

  // ── ONLINE STATUS ─────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Watch for theme changes to update mascot
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMascotSidebar(document.documentElement.dataset.mascotSidebar || '')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mascot-sidebar'] })
    return () => observer.disconnect()
  }, [])
  // ─────────────────────────────────────────────────────────────

  const isExpanded = isPinned || isHovered

  const navItems = ALL_NAV_ITEMS.filter(item => allowedModules.includes(item.id))

  const displayName = String(currentUser?.employeeName || currentUser?.username || '??')
  const initials  = displayName.slice(0, 2).toUpperCase()
  // Show department for employee accounts; fall back to role label for system accounts
  const roleLabel = currentUser?.department ?? ROLE_LABELS[currentUser?.role] ?? currentUser?.role ?? ''

  function handlePinToggle() {
    const next = !isPinned
    setIsPinned(next)
    onPinChange?.(next)
  }

  function NavButton({ item, badge = 0 }) {
    const Icon = item.icon
    const isActive = activePage === item.id
    // Don't show badge on the currently active module (user is already looking at it)
    const showBadge = badge > 0 && !isActive
    return (
      <button
        onClick={() => setActivePage(item.id)}
        title={!isExpanded ? item.label : undefined}
        className={`
          w-full flex items-center text-left py-2 rounded-md text-sm mb-1
          transition-all duration-200
          ${isExpanded ? 'justify-start gap-3 px-3' : 'justify-center px-0'}
          ${isActive
            ? 'text-white'
            : 'text-gray-400 hover:text-white'
          }
        `}
        style={{
          background: isActive ? 'var(--sidebar-active)' : 'transparent',
          ...(isActive ? {} : {}),
          position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Icon with badge dot when collapsed */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Icon size={16} />
          {showBadge && !isExpanded && (
            <span style={{
              position: 'absolute',
              top: '-4px', right: '-5px',
              minWidth: '14px', height: '14px',
              borderRadius: '99px',
              background: 'var(--theme-500)',
              border: '2px solid var(--sidebar-bg)',
              color: '#fff',
              fontSize: '8px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
              padding: '0 2px',
            }}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        {/* Label + badge pill when expanded */}
        <span
          className={`
            whitespace-nowrap overflow-hidden transition-all duration-200
            ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}
          `}
          style={{ flex: 1 }}
        >
          {item.label}
        </span>
        {showBadge && isExpanded && (
          <span style={{
            minWidth: '20px', height: '20px',
            borderRadius: '99px',
            background: 'var(--theme-500)',
            color: '#fff',
            fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            padding: '0 5px',
            lineHeight: 1,
          }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className={`relative shrink-0 transition-all duration-300 ${isPinned ? 'w-52' : 'w-14'}`}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
    >
      <aside
        id="tour-sidebar"
        className={`
          flex flex-col py-6 h-full relative
          text-white
          transition-[width,box-shadow] duration-300 ease-in-out
          ${isPinned
            ? 'w-52 px-3'
            : `absolute top-0 left-0 z-50 h-screen px-3
               ${isExpanded
                 ? 'w-52 shadow-[4px_0_24px_rgba(0,0,0,0.5)]'
                 : 'w-14'
               }`
          }
        `}
        style={{ background: 'var(--sidebar-bg)', overflow: 'hidden' }}
      >

        {/* ── LOGO ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-center mb-8 h-16 shrink-0">
          <img
            src="./Logo.png"
            alt="Company Logo"
            className={`
              absolute inset-0 w-full h-full object-contain px-2
              transition-all duration-300
              ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
            `}
          />
          <img
            src="./Logo.png"
            alt=""
            aria-hidden="true"
            className={`
              w-7 h-7 object-contain transition-all duration-300
              ${isExpanded ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}
            `}
          />
          <button
            id="tour-help-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))}
            title="General App Guide"
            className={`
              absolute left-1 top-1/2 -translate-y-1/2
              p-1 rounded transition-all duration-200 text-gray-500 hover:text-white
              ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <HelpCircle size={14} />
          </button>
          <button
            onClick={handlePinToggle}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            className={`
              absolute right-1 top-1/2 -translate-y-1/2
              p-1 rounded transition-all duration-200
              ${isPinned ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-white'}
              ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        </div>

        {/* ── OVERVIEW NAV (scrollable, grows to fill space) ── */}
        <div id="tour-nav-items" className="flex-1 min-h-0 overflow-y-auto relative" style={{ zIndex: 1 }}>
          <p className={`
            text-xs text-gray-500 uppercase px-2 mb-2
            transition-all duration-200 whitespace-nowrap overflow-hidden
            ${isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'}
          `}>
            Overview
          </p>
          {navItems.length > 0 ? (
            navItems.map((item) => <NavButton key={item.id} item={item} badge={moduleBadges[item.id] ?? 0} />)
          ) : (
            <div className={`
              px-2 py-3 text-xs italic text-gray-500 text-center
              transition-all duration-200
              ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}
            `}>
              No permissions
            </div>
          )}
        </div>

        {/* ── SYSTEM / SETTINGS — always pinned above user info ── */}
        <div className="shrink-0 mt-4 relative" style={{ zIndex: 1 }}>
          <div className={`
            h-px mx-1 mb-4
            transition-all duration-200
            ${isExpanded ? 'opacity-100' : 'opacity-30'}
          `} style={{ background: 'rgba(255,255,255,0.1)' }} />
          <p className={`
            text-xs text-gray-500 uppercase px-2 mb-2
            transition-all duration-200 whitespace-nowrap overflow-hidden
            ${isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'}
          `}>
            System
          </p>
          {allowedModules.includes('chat') && <NavButton item={CHAT_ITEM} badge={moduleBadges['chat'] ?? 0} />}
          {allowedModules.includes('app-links') && <NavButton item={APP_LINKS_ITEM} />}
          <NavButton item={SETTINGS_ITEM} />
        </div>

        {/* Kuromi mascot: centered watermark, low opacity so nav text stays readable */}
        {transparentMascot && (
          <img
            src={transparentMascot}
            alt=""
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
            style={{
              width: '140px',
              opacity: isExpanded ? 0.30 : 0,
              transition: 'opacity 0.3s ease',
              filter: 'var(--mascot-filter, none)',
              zIndex: 0,
            }}
          />
        )}

        {/* ── BOTTOM — User info + logout ──────────────── */}
        <div className={`
          shrink-0 flex items-center py-2 rounded-md transition-all duration-200 mt-3 relative
          ${isExpanded ? 'gap-3 px-2' : 'justify-center px-0'}
        `} style={{ zIndex: 1 }}>

          {/* Avatar with online/offline dot */}
          <button 
            className="relative shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 border-0 bg-transparent p-0"
            onClick={() => {
              setActivePage('settings')
              setTimeout(() => window.dispatchEvent(new CustomEvent('navigate-settings', { detail: 'account' })), 10)
            }}
            title="Go to Account Settings"
          >
            <div
              className="text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'var(--sidebar-active)' }}
            >
              {initials}
            </div>

            {/* Status dot */}
            <span
              title={isOnline ? 'Online' : 'Offline'}
              className={`
                absolute -bottom-0.5 -right-0.5
                w-2.5 h-2.5 rounded-full
                transition-colors duration-500
                ${isOnline ? 'bg-green-400' : 'bg-gray-500'}
              `}
              style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--sidebar-bg)' }}
            />
          </button>

          {/* Name + role */}
          <div className={`
            flex-1 transition-all duration-200 overflow-hidden min-w-0
            ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}
          `}>
            <p className="text-sm font-medium leading-none mb-1 text-gray-100 truncate">{displayName}</p>
            <p className="text-xs leading-none text-gray-400 truncate">{roleLabel}</p>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Log out"
            className={`
              p-1 rounded text-gray-500 hover:bg-red-500/10 hover:text-red-400
              transition-all duration-200 shrink-0
              ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'}
            `}
          >
            <LogOut size={14} />
          </button>
        </div>

      </aside>
    </div>
  )
}

export default Sidebar