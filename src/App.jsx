import { useState } from 'react'
import './App.css'

import LoginPage   from './components/ui/LoginPage'
import Sidebar     from './components/ui/Sidebar'

import Dashboard   from './modules/dashboard/Dashboard'
import Employees   from './modules/hrms/Employees'
import Biometrics  from './modules/biometrics/Biometrics'
import ClinicLog   from './modules/clinic/ClinicLog'
import Outlets     from './modules/outlets/Outlets'
import Calculations from './modules/calculations/Calculations'
import Reports     from './modules/reports/Reports'
import Settings    from './modules/settings/Settings'

import { MODULE_ACCESS } from './lib/permissions'

const ALL_PAGES = {
  dashboard:    <Dashboard />,
  employees:    <Employees />,
  biometrics:   <Biometrics />,
  clinic:       <ClinicLog />,
  outlets:      <Outlets />,
  calculations: <Calculations />,
  reports:      <Reports />,
  settings:     <Settings />,
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)   // { id, username, role }
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

  // Only render pages this role is allowed to see
  const allowedModules = MODULE_ACCESS[currentUser.role] ?? []

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        allowedModules={allowedModules}
        currentUser={currentUser}
      />
      <main className="flex-1 overflow-auto">
        {ALL_PAGES[activePage]}
      </main>
    </div>
  )
}

export default App