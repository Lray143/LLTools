import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    applyThemeToDocument(getSavedTheme())
  }, [])

  // Use a ref so the effect closure always has the latest user ID without re-binding
  const currentUserIdRef = useRef(currentUser?.id)
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id
  }, [currentUser?.id])

  // Listen for cloud sync events from the main process
  useEffect(() => {
    if (!window.electronAPI?.onDbSynced) return
    const cleanup = window.electronAPI.onDbSynced(async () => {
      setRefreshKey(k => k + 1)
      
      const uid = currentUserIdRef.current
      if (uid) {
        try {
          const freshUser = await window.electronAPI.refreshUser(uid)
          if (freshUser) {
            setCurrentUser(freshUser)
            applyThemeToDocument(freshUser.themeColor || 'original-light')
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
    if (activePage === 'chat')       return <Chat currentUser={currentUser} refreshKey={refreshKey} />

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