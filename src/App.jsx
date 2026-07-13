import { useState, useEffect, useRef, useCallback } from 'react'
import { getPusherChannel } from './lib/pusherSingleton'
import { Sparkles, Star, Heart, Zap, Bug } from 'lucide-react'
import './App.css'

import LoginPage   from './components/ui/LoginPage'
import UpdaterSplash from './components/ui/UpdaterSplash'
import Sidebar     from './components/ui/Sidebar'
import NotificationBell from './components/ui/NotificationBell'
import AppGuide from './components/ui/AppGuide'

import Announcements  from './modules/announcements/Announcements'
import Employees      from './modules/hrms/Employees'
import Biometrics     from './modules/biometrics/Biometrics'
import MyAttendance   from './modules/my-attendance/MyAttendance'
import ClinicLog      from './modules/clinic/ClinicLog'
import Products       from './modules/products/Products'
import Outlets        from './modules/outlets/Outlets'
import Orders   from './modules/orders/Orders'
import Reports        from './modules/reports/Reports'
import Settings       from './modules/settings/Settings'
import LeaveRequests  from './modules/leaves/LeaveRequests'
import Chat           from './modules/chat/Chat'
import AppLinks       from './modules/app-links/AppLinks'

import { getAllowedModules } from './lib/permissions'
import { getSavedTheme, applyThemeToDocument, saveTheme } from './lib/theme'

import { useMemo } from 'react'

// ── Canvas-based background removal for mascot images ────────────────────────
function useTransparentImage(src, threshold = 60) {
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => {
    if (!src) { setDataUrl(''); return }
    // If it's an SVG, we don't need to process it for transparency
    if (src.endsWith('.svg')) { setDataUrl(src); return }
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

function ThemeDecorations() {
  const [theme, setTheme] = useState(document.documentElement.dataset.activeTheme || '')
  const [mascotSrc, setMascotSrc] = useState(document.documentElement.dataset.mascotSidebar || '')
  const transparentMascot = useTransparentImage(mascotSrc)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.activeTheme || '')
      setMascotSrc(document.documentElement.dataset.mascotSidebar || '')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-active-theme', 'data-mascot-sidebar'] })
    return () => observer.disconnect()
  }, [])

  const elements = useMemo(() => {
    const items = []
    // 4 mascot images
    for (let i = 0; i < 4; i++) {
      items.push({
        type: 'mascot',
        top: Math.random() * 80 + 10 + '%',
        left: Math.random() * 65 + 25 + '%', // avoid left sidebar area
        size: Math.random() * 120 + 80 + 'px',
        rotation: Math.random() * 360 + 'deg',
        opacity: Math.random() * 0.1 + 0.05
      })
    }
    // 5 secondary elements
    for (let i = 0; i < 5; i++) {
      items.push({
        type: 'secondary',
        top: Math.random() * 80 + 10 + '%',
        left: Math.random() * 65 + 25 + '%',
        size: Math.random() * 20 + 20 + 'px',
        rotation: Math.random() * 60 - 30 + 'deg',
        opacity: Math.random() * 0.2 + 0.15,
        emojiIndex: i
      })
    }
    return items
  }, [])

  if (theme !== 'sunflower' && theme !== 'kuromi') return null

  const isSunflower = theme === 'sunflower'
  const iconSet = isSunflower
    ? [{ Icon: Bug, color: '#f59e0b' }]
    : [
        { Icon: Sparkles, color: '#a78bfa' },
        { Icon: Star,     color: '#4ade80' },
        { Icon: Heart,    color: '#f472b6' },
        { Icon: Zap,      color: '#c084fc' },
      ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {elements.map((el, i) => {
        if (el.type === 'mascot') {
          if (!transparentMascot) return null
          return (
            <img 
              key={i} 
              src={transparentMascot} 
              className="absolute" 
              style={{ 
                top: el.top, 
                left: el.left, 
                width: el.size, 
                height: el.size, 
                transform: `translate(-50%, -50%) rotate(${el.rotation})`,
                opacity: el.opacity,
                filter: 'var(--mascot-filter, none)',
              }} 
              alt="" 
            />
          )
        } else {
          const { Icon, color } = iconSet[el.emojiIndex % iconSet.length]
          return (
            <div 
              key={i} 
              className="absolute drop-shadow-md" 
              style={{ 
                top: el.top, 
                left: el.left, 
                width: el.size,
                height: el.size,
                transform: `translate(-50%, -50%) rotate(${el.rotation})`,
                opacity: el.opacity,
                color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon size={parseInt(el.size)} />
            </div>
          )
        }
      })}
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activePage,  setActivePage]  = useState('announcements')
  const [updaterFinished, setUpdaterFinished] = useState(false)
  // Increments every time a cloud sync completes — modules use this as a
  // useEffect dependency so they automatically re-fetch fresh data.
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [typingUsers, setTypingUsers] = useState({})
  const typingTimersRef = useRef({})
  const [moduleBadges, setModuleBadges] = useState({})
  const handleBadgesChange = useCallback((counts) => setModuleBadges(counts), [])

  useEffect(() => {
    applyThemeToDocument(getSavedTheme())
    
    const savedId = localStorage.getItem('savedSessionId')
    if (savedId && window.electronAPI?.refreshUser) {
      window.electronAPI.refreshUser(savedId)
        .then(user => {
          if (user) {
            handleLogin(user, true)
          }
        })
        .catch(console.error)
    }
  }, [])

  useEffect(() => {
    const channel = getPusherChannel()
    if (!channel) return

    const handleNewMessage = (data) => {
      const me = currentUserRef.current
      const myId = String(me?.employeeId || me?.id || '')
      // Don't force-sync for messages we sent ourselves (already in optimistic cache)
      if (data?.senderId && data.senderId === myId) return
      window.electronAPI?.forceSync?.()
    }
    channel.bind('new-message', handleNewMessage)

    const handleReactionUpdated = () => {
      // Keep local DB in sync; Chat applies the payload instantly via its own listener.
      window.electronAPI?.forceSync?.()
    }
    channel.bind('reaction-updated', handleReactionUpdated)

    const handleMessageUpdated = () => {
      window.electronAPI?.forceSync?.()
    }
    channel.bind('message-updated', handleMessageUpdated)

    const handleTyping = (data) => {
      const me = currentUserRef.current
      // Filter out own typing events — userId is employeeId || String(id)
      const myId = String(me?.employeeId || me?.id || '')
      if (data.userId === myId) return
      
      setTypingUsers(prev => {
        const roomTyping = prev[data.roomId] ? new Set(prev[data.roomId]) : new Set()
        roomTyping.add(data.userName)
        return { ...prev, [data.roomId]: Array.from(roomTyping) }
      })

      // Debounce: clear previous timer for this room before setting a new one
      // so 10 keystrokes don't queue 10 overlapping timeouts in memory
      clearTimeout(typingTimersRef.current[`${data.roomId}::${data.userName}`])
      typingTimersRef.current[`${data.roomId}::${data.userName}`] = setTimeout(() => {
        setTypingUsers(prev => {
          const roomTyping = prev[data.roomId] ? new Set(prev[data.roomId]) : new Set()
          roomTyping.delete(data.userName)
          return { ...prev, [data.roomId]: Array.from(roomTyping) }
        })
      }, 4000)
    }
    channel.bind('typing', handleTyping)

    const handleEmployeeUpdated = (data) => {
      const me = currentUserRef.current
      if (me && (me.employeeId === data.id || String(me.id) === String(data.id))) {
        window.electronAPI?.forceSync?.()
      }
    }
    channel.bind('employee-updated', handleEmployeeUpdated)

    // Global triggers for reports and announcements to force DB sync on receivers
    const forceDbSync = () => window.electronAPI?.forceSync?.()
    
    channel.bind('report-assigned', forceDbSync)
    channel.bind('report-comment-added', forceDbSync)
    channel.bind('new-announcement-comment', forceDbSync)
    channel.bind('announcement-acknowledged', forceDbSync)
    channel.bind('announcement-comment-reacted', forceDbSync)

    return () => {
      channel.unbind('new-message', handleNewMessage)
      channel.unbind('reaction-updated', handleReactionUpdated)
      channel.unbind('message-updated', handleMessageUpdated)
      channel.unbind('typing', handleTyping)
      channel.unbind('employee-updated', handleEmployeeUpdated)
      channel.unbind('report-assigned', forceDbSync)
      channel.unbind('report-comment-added', forceDbSync)
      channel.unbind('new-announcement-comment', forceDbSync)
      channel.unbind('announcement-acknowledged', forceDbSync)
      channel.unbind('announcement-comment-reacted', forceDbSync)
    }
  }, [])


  // Ping online heartbeat on mount/login
  useEffect(() => {
    if (!currentUser?.id) return
    window.electronAPI?.heartbeatUser?.(currentUser.id).catch(console.error)
  }, [currentUser?.id])

  // Use a ref so the effect closure always has the latest user without re-binding
  const currentUserRef = useRef(currentUser)
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  // Listen for cloud sync events from the main process
  useEffect(() => {
    if (!window.electronAPI?.onDbSynced) return
    const cleanup = window.electronAPI.onDbSynced(async () => {
      setRefreshKey(k => k + 1)
      
      const current = currentUserRef.current
      if (current?.id) {
        try {
          const freshUser = await window.electronAPI.refreshUser(current.id)
          if (freshUser) {
            // ONLY update state if the data actually changed, otherwise we cause
            // massive re-render cascades every 2 seconds!
            if (JSON.stringify(freshUser) !== JSON.stringify(current)) {
              setCurrentUser(freshUser)
              if (freshUser.themeColor !== current.themeColor) {
                applyThemeToDocument(freshUser.themeColor || 'original-light')
                saveTheme(freshUser.themeColor || 'original-light')
              }
            }
          } else {
            // The user account was deleted from the database (e.g. wiped)
            setCurrentUser(null)
          }
        } catch (e) {
          console.error('Failed to auto-refresh session:', e)
        }
      }
    })
    return cleanup
  }, [])

  const handleLogin = (user, keepLogged = false) => {
    setCurrentUser(user)
    
    if (keepLogged) {
      localStorage.setItem('savedSessionId', user.id)
    } else {
      localStorage.removeItem('savedSessionId')
    }
    
    let targetTheme = user.themeColor
    if (!targetTheme || targetTheme.startsWith('#')) {
      targetTheme = 'original-light'
    }
    
    saveTheme(targetTheme)
    applyThemeToDocument(targetTheme)
    
    setActivePage('announcements')
  }

  const handleLogout = () => {
    if (currentUser) {
      window.electronAPI.logoutUser(currentUser.id).catch(console.error)
    }
    localStorage.removeItem('savedSessionId')
    setCurrentUser(null)
    setActivePage('announcements')
    // Fix Radix UI bug where dropdowns/modals leave body frozen if unmounted abruptly
    document.body.style.pointerEvents = 'auto'
  }

  if (!updaterFinished) {
    return <UpdaterSplash onComplete={() => setUpdaterFinished(true)} />
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  const allowedModules = getAllowedModules(currentUser)

  function renderPage() {
    if (!allowedModules.includes(activePage) && activePage !== 'settings') {
      return (
        <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
          <h2 className="text-2xl font-bold mb-2 text-gray-800" style={{ color: 'var(--text-primary)' }}>Access Restricted</h2>
          <p>Your account does not have a department assigned.</p>
          <p>Please contact HR to assign you a department.</p>
        </div>
      )
    }

    // Pages that need currentUser get it as a prop
    if (activePage === 'my-attendance') return <MyAttendance currentUser={currentUser} refreshKey={refreshKey} onNavigate={setActivePage} />
    if (activePage === 'leaves')     return <LeaveRequests currentUser={currentUser} refreshKey={refreshKey} onNavigate={setActivePage} />
    if (activePage === 'reports')    return <Reports currentUser={currentUser} refreshKey={refreshKey} onNavigate={setActivePage} />
    if (activePage === 'settings')   return <Settings currentUser={currentUser} />
    if (activePage === 'chat')       return <Chat currentUser={currentUser} refreshKey={refreshKey} typingUsers={typingUsers} onNavigate={setActivePage} />
    if (activePage === 'app-links')  return <AppLinks currentUser={currentUser} refreshKey={refreshKey} />

    // Static pages
    const STATIC_PAGES = {
      announcements:    <Announcements refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      employees:    <Employees   refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      biometrics:   <Biometrics  refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      clinic:       <ClinicLog   refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      products:     <Products    refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      outlets:      <Outlets     refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      orders: <Orders currentUser={currentUser} refreshKey={refreshKey} onNavigate={setActivePage} />,
    }
    return STATIC_PAGES[activePage] ?? null
  }

  return (
    <div className="flex h-screen relative" style={{ background: 'var(--page-bg)' }}>
      <ThemeDecorations />
      {currentUser && allowedModules.length > 0 && (
        <AppGuide currentUser={currentUser} />
      )}
      {/* Hidden badge-counter bell — stays mounted across all pages so Sidebar always has fresh counts */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
        <NotificationBell
          currentUser={currentUser}
          refreshKey={refreshKey}
          onNavigate={setActivePage}
          onBadgesChange={handleBadgesChange}
          suppressNative={false}
        />
      </div>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        allowedModules={allowedModules}
        currentUser={currentUser}
        refreshKey={refreshKey}
        moduleBadges={moduleBadges}
        onBadgesChange={handleBadgesChange}
      />
      <main id="tour-main-content" className="flex-1 overflow-auto relative z-10">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
