// src/App.jsx
// App.jsx is now just a manager — imports components and decides what to show.
// No big chunks of JSX here anymore.

import { useState } from 'react'
import './App.css'

// Import components from their own files
import LoginPage from './components/ui/LoginPage'
import Sidebar from './components/ui/Sidebar'

// Import placeholder pages (move these to modules/ later)
import Dashboard from './modules/dashboard/Dashboard'
import Employees from './modules/hrms/Employees'
import Biometrics from './modules/biometrics/Biometrics'
import ClinicLog from './modules/clinic/ClinicLog'
import Outlets from './modules/outlets/Outlets'
import Calculations from './modules/calculations/Calculations'
import Reports from './modules/reports/Reports'
import Settings from './modules/settings/Settings'

// Pages map — id to component
const pages = {
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
  const [activePage, setActivePage] = useState('dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  function handleLogin() {
    setIsLoggedIn(true)
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setActivePage('dashboard')
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Show full app if logged in
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto p-8">
        {pages[activePage]}
      </main>
    </div>
  )
}

export default App