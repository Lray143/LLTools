// ============================================================
// IMPORTS
// React's useState lets us track which page is currently active
// lucide-react gives us icons — each name is a different icon
// App.css is our component-level CSS file (mostly empty, we use Tailwind)
// ============================================================
import { useState } from 'react'
import { LayoutDashboard, Users, ClipboardList, Calculator, BarChart3, Settings } from 'lucide-react'
import './App.css'


// ============================================================
// PLACEHOLDER COMPONENTS
// These are temporary screens for each module.
// Each one is a simple function that returns some JSX (HTML-like code).
// Later you'll replace these with real screens from your modules/ folder.
// ============================================================

function Dashboard() {
  return <div><h1 className="text-2xl font-bold">Dashboard</h1></div>
}
function Employees() {
  return <div><h1 className="text-2xl font-bold">Employees</h1></div>
}
function ClinicLog() {
  return <div><h1 className="text-2xl font-bold">Clinic Log</h1></div>
}
function Calculations() {
  return <div><h1 className="text-2xl font-bold">Calculations</h1></div>
}
function Reports() {
  return <div><h1 className="text-2xl font-bold">Reports</h1></div>
}
function SettingsPage() {
  return <div><h1 className="text-2xl font-bold">Settings</h1></div>
}


// ============================================================
// NAVIGATION ITEMS — MODULES SECTION
// ============================================================
const navItems = [
  { id: 'dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'employees',     label: 'Employees',    icon: Users           },
  { id: 'clinic',        label: 'Clinic Log',   icon: ClipboardList   },
  { id: 'calculations',  label: 'Calculations', icon: Calculator      },
  { id: 'reports',       label: 'Reports',      icon: BarChart3       },
]

// ============================================================
// NAVIGATION ITEMS — SYSTEM SECTION
// ============================================================
const systemItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
]


// ============================================================
// PAGES MAP
// Maps each page id to its component.
// ============================================================
const pages = {
  dashboard:    <Dashboard />,
  employees:    <Employees />,
  clinic:       <ClinicLog />,
  calculations: <Calculations />,
  reports:      <Reports />,
  settings:     <SettingsPage />,
}


// ============================================================
// MAIN APP COMPONENT
// ============================================================
function App() {

  const [activePage, setActivePage] = useState('dashboard')

  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-52 bg-[#1e1b18] text-white flex flex-col justify-between py-6 px-3">

        <div>

          {/* --------------------------------------------------
              TOP — Company Logo
              Loads logo.png from the public/ folder.
              In Vite, files in public/ are served from the root,
              so we just use "/logo.png" as the path.
              object-contain = keeps the logo's original proportions
              w-full = stretches to fill the sidebar width
              max-h-16 = limits height to 64px so it doesn't get too big
              mb-8 = space below the logo before the nav items
          -------------------------------------------------- */}
          <div className="px-2 mb-8">
            <img
              src="/Logo.png"
              alt="Company Logo"
              className="w-full object-contain max-h-16"
            />
          </div>

          {/* --------------------------------------------------
              MIDDLE — Modules Navigation
          -------------------------------------------------- */}
          <p className="text-xs text-gray-500 uppercase px-2 mb-2">Overview</p>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}

          <p className="text-xs text-gray-500 uppercase px-2 mt-6 mb-2">System</p>

          {systemItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}

        </div>

        {/* --------------------------------------------------
            BOTTOM — Logged-in User Info
            Hardcoded for now, replace with real login data later.
        -------------------------------------------------- */}
        <div className="flex items-center gap-3 px-2">

          {/* User avatar circle with initials */}
          <div className="bg-orange-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0">
            MR
          </div>

          {/* User name, position, department */}
          <div>
            <p className="text-sm font-medium leading-none mb-1">Maria Reyes</p>
            <p className="text-xs text-gray-400 leading-none mb-1">HR Manager</p>
            <p className="text-xs text-gray-500 leading-none">Human Resources</p>
          </div>

        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto p-8">
        {pages[activePage]}
      </main>

    </div>
  )
}

export default App