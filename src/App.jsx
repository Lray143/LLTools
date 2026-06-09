import { useState, useEffect } from 'react'
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

import { getAllowedModules } from './lib/permissions'
import { getSavedTheme, applyThemeToDocument, getSavedMode, applyModeToDocument, saveTheme, saveMode } from './lib/theme'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activePage,  setActivePage]  = useState('dashboard')

  useEffect(() => {
    applyThemeToDocument(getSavedTheme())
    applyModeToDocument(getSavedMode())
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    if (user.themeColor) {
      saveTheme(user.themeColor)
      applyThemeToDocument(user.themeColor)
    }
    if (user.themeMode) {
      saveMode(user.themeMode)
      applyModeToDocument(user.themeMode)
    }
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
    if (activePage === 'my-attendance') return <MyAttendance currentUser={currentUser} />
    if (activePage === 'leaves')     return <LeaveRequests currentUser={currentUser} />
    if (activePage === 'reports')    return <Reports currentUser={currentUser} />
    if (activePage === 'settings')   return <Settings currentUser={currentUser} />

    // Static pages (no user context needed)
    const STATIC_PAGES = {
      dashboard:    <Dashboard />,
      employees:    <Employees />,
      biometrics:   <Biometrics />,
      clinic:       <ClinicLog />,
      products:     <Products />,
      outlets:      <Outlets />,
      calculations: <Calculations />,
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
      />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default App