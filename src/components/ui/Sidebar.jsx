import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, ClipboardList, Calculator,
  BarChart3, Settings, Store, Fingerprint, LogOut,
  SoapDispenserDroplet, Pin, PinOff, CalendarClock, CalendarCheck
} from 'lucide-react'

const ROLE_LABELS = {
  admin:     'Administrator',
  hr:        'HR Department',
  clinic:    'Clinic Staff',
  inventory: 'Inventory',
  outlets:   'Outlets',
}

const ALL_NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard      },
  { id: 'employees',    label: 'Employees',       icon: Users                },
  { id: 'biometrics',   label: 'Biometrics',      icon: Fingerprint          },
  { id: 'my-attendance',label: 'My Attendance',   icon: CalendarCheck        },
  { id: 'clinic',       label: 'Clinic Log',      icon: ClipboardList        },
  { id: 'products',     label: 'Products',        icon: SoapDispenserDroplet },
  { id: 'outlets',      label: 'Outlets',         icon: Store                },
  { id: 'calculations', label: 'Calculations',    icon: Calculator           },
  { id: 'reports',      label: 'Reports',         icon: BarChart3            },
  { id: 'leaves',       label: 'Leave Requests',  icon: CalendarClock        },
]

const SETTINGS_ITEM = { id: 'settings', label: 'Settings', icon: Settings }

function Sidebar({ activePage, setActivePage, onLogout, allowedModules, currentUser, onPinChange, refreshKey = 0 }) {
  const [isPinned, setIsPinned]   = useState(true)
  const [isHovered, setIsHovered] = useState(false)

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
  // ─────────────────────────────────────────────────────────────

  const isExpanded = isPinned || isHovered

  const navItems = ALL_NAV_ITEMS.filter(item => allowedModules.includes(item.id))

  const displayName = currentUser?.employeeName || currentUser?.username || '??'
  const initials  = displayName.slice(0, 2).toUpperCase()
  // Show department for employee accounts; fall back to role label for system accounts
  const roleLabel = currentUser?.department ?? ROLE_LABELS[currentUser?.role] ?? currentUser?.role ?? ''

  function handlePinToggle() {
    const next = !isPinned
    setIsPinned(next)
    onPinChange?.(next)
  }

  function NavButton({ item }) {
    const Icon = item.icon
    const isActive = activePage === item.id
    return (
      <button
        onClick={() => setActivePage(item.id)}
        title={!isExpanded ? item.label : undefined}
        className={`
          w-full flex items-center py-2 rounded-md text-sm mb-1
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
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon size={16} className="shrink-0" />
        <span
          className={`
            whitespace-nowrap overflow-hidden transition-all duration-200
            ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}
          `}
        >
          {item.label}
        </span>
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
        className={`
          flex flex-col py-6 h-full
          text-white overflow-hidden
          transition-[width,box-shadow] duration-300 ease-in-out
          ${isPinned
            ? 'relative w-52 px-3'
            : `absolute top-0 left-0 z-50 h-screen px-3
               ${isExpanded
                 ? 'w-52 shadow-[4px_0_24px_rgba(0,0,0,0.5)]'
                 : 'w-14'
               }`
          }
        `}
        style={{ background: 'var(--sidebar-bg)' }}
      >

        {/* ── LOGO ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-center mb-8 h-16 shrink-0">
          <img
            src="/Logo.png"
            alt="Company Logo"
            className={`
              absolute inset-0 w-full h-full object-contain px-2
              transition-all duration-300
              ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
            `}
          />
          <img
            src="/Logo.png"
            alt=""
            aria-hidden="true"
            className={`
              w-7 h-7 object-contain transition-all duration-300
              ${isExpanded ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}
            `}
          />
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
        <div className="flex-1 min-h-0 overflow-y-auto">
          <p className={`
            text-xs text-gray-500 uppercase px-2 mb-2
            transition-all duration-200 whitespace-nowrap overflow-hidden
            ${isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'}
          `}>
            Overview
          </p>
          {navItems.map((item) => <NavButton key={item.id} item={item} />)}
        </div>

        {/* ── SYSTEM / SETTINGS — always pinned above user info ── */}
        <div className="shrink-0 mt-4">
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
          <NavButton item={SETTINGS_ITEM} />
        </div>

        {/* ── BOTTOM — User info + logout ──────────────── */}
        <div className={`
          shrink-0 flex items-center py-2 rounded-md transition-all duration-200 mt-3
          ${isExpanded ? 'gap-3 px-2' : 'justify-center px-0'}
        `}>

          {/* Avatar with online/offline dot */}
          <div className="relative shrink-0">
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
          </div>

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