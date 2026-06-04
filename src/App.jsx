import { useState } from 'react'
import './App.css'

import LoginPage   from './components/ui/LoginPage'
import Sidebar     from './components/ui/Sidebar'

import Dashboard      from './modules/dashboard/Dashboard'
import Employees      from './modules/hrms/Employees'
import Biometrics     from './modules/biometrics/Biometrics'
import ClinicLog      from './modules/clinic/ClinicLog'
import Products       from './modules/products/Products'
import Outlets        from './modules/outlets/Outlets'
import Calculations   from './modules/calculations/Calculations'
import Reports        from './modules/reports/Reports'
import Settings       from './modules/settings/Settings'
import LeaveRequests  from './modules/leaves/LeaveRequests'

import { MODULE_ACCESS } from './lib/permissions'

const STATIC_PAGES = {
  dashboard:    <Dashboard />,
  employees:    <Employees />,
  biometrics:   <Biometrics />,
  clinic:       <ClinicLog />,
  products:     <Products />,
  outlets:      <Outlets />,
  calculations: <Calculations />,
  reports:      <Reports />,
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)   // { id, username, role, employeeId }
  const [activePage,  setActivePage]  = useState('dashboard')

  const handleLogin = (user) => {
    setCurrentUser(user)
    setActivePage('dashboard')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setActivePage('dashboard')
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  const allowedModules = MODULE_ACCESS[currentUser.role] ?? []

  function renderPage() {
    // Pages that need currentUser get it as a prop
    if (activePage === 'leaves')    return <LeaveRequests currentUser={currentUser} />
    if (activePage === 'settings')  return <Settings currentUser={currentUser} />
    return STATIC_PAGES[activePage] ?? null
  }

  return (
    <div className="flex h-screen bg-[#fcfcfc]">
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