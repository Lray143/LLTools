import { useState, useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import './App.css'

import LoginPage   from './components/ui/LoginPage'
import Sidebar     from './components/ui/Sidebar'

import Dashboard      from './modules/dashboard/Dashboard'
import Employees      from './modules/hrms/Employees'
import Biometrics     from './modules/biometrics/Biometrics'
import MyAttendance   from './modules/my-attendance/MyAttendance'
import ClinicLog      from './modules/clinic/ClinicLog'
import Products       from './modules/products/Products'
import Outlets        from './modules/outlets/Outlets'
import Calculations   from './modules/calculations/Calculations'
import Reports        from './modules/reports/Reports'
import Settings       from './modules/settings/Settings'
import LeaveRequests  from './modules/leaves/LeaveRequests'
import Chat           from './modules/chat/Chat'

import { getAllowedModules } from './lib/permissions'
import { getSavedTheme, applyThemeToDocument, saveTheme } from './lib/theme'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activePage,  setActivePage]  = useState('dashboard')
  // Increments every time a cloud sync completes — modules use this as a
  // useEffect dependency so they automatically re-fetch fresh data.
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [typingUsers, setTypingUsers] = useState({})

  useEffect(() => {
    applyThemeToDocument(getSavedTheme())
  }, [])

  useEffect(() => {
    if (!import.meta.env.VITE_PUSHER_KEY) return
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER
    })
    const channel = pusher.subscribe('lltools-updates')
    
    channel.bind('new-message', (data) => {
      const me = currentUserRef.current
      const myId = String(me?.employeeId || me?.id || '')
      // Don't force-sync for messages we sent ourselves (already in optimistic cache)
      if (data?.senderId && data.senderId === myId) return
      window.electronAPI?.forceSync?.()
    })

    channel.bind('typing', (data) => {
      const me = currentUserRef.current
      // Filter out own typing events — userId is employeeId || String(id)
      const myId = String(me?.employeeId || me?.id || '')
      if (data.userId === myId) return
      
      setTypingUsers(prev => {
        const roomTyping = prev[data.roomId] ? new Set(prev[data.roomId]) : new Set()
        roomTyping.add(data.userName)
        return { ...prev, [data.roomId]: Array.from(roomTyping) }
      })

      setTimeout(() => {
        setTypingUsers(prev => {
          const roomTyping = prev[data.roomId] ? new Set(prev[data.roomId]) : new Set()
          roomTyping.delete(data.userName)
          return { ...prev, [data.roomId]: Array.from(roomTyping) }
        })
      }, 4000)
    })

    return () => {
      pusher.unsubscribe('lltools-updates')
      pusher.disconnect()
    }
  }, [])


  // Ping online heartbeat
  useEffect(() => {
    if (!currentUser?.id) return
    window.electronAPI?.heartbeatUser?.(currentUser.id).catch(console.error)
    const interval = setInterval(() => {
      window.electronAPI?.heartbeatUser?.(currentUser.id).catch(console.error)
    }, 60000)
    return () => clearInterval(interval)
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

  const handleLogin = (user) => {
    setCurrentUser(user)
    
    let targetTheme = user.themeColor
    if (!targetTheme || targetTheme.startsWith('#')) {
      targetTheme = 'original-light'
    }
    
    saveTheme(targetTheme)
    applyThemeToDocument(targetTheme)
    
    setActivePage('dashboard')
  }

  const handleLogout = () => {
    if (currentUser) {
      window.electronAPI.logoutUser(currentUser.id).catch(console.error)
    }
    setCurrentUser(null)
    setActivePage('dashboard')
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

    // Static pages
    const STATIC_PAGES = {
      dashboard:    <Dashboard   refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      employees:    <Employees   refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      biometrics:   <Biometrics  refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      clinic:       <ClinicLog   refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      products:     <Products    refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      outlets:      <Outlets     refreshKey={refreshKey} currentUser={currentUser} onNavigate={setActivePage} />,
      calculations: <Calculations currentUser={currentUser} refreshKey={refreshKey} onNavigate={setActivePage} />,
    }
    return STATIC_PAGES[activePage] ?? null
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--page-bg)' }}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        allowedModules={allowedModules}
        currentUser={currentUser}
        refreshKey={refreshKey}
      />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default App