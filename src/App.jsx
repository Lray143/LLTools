// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react'
import { LayoutDashboard, Users, ClipboardList, Calculator, BarChart3, Settings, Store, Fingerprint, LogOut } from 'lucide-react'
import './App.css'


// ============================================================
// HOW THIS FILE WORKS
// ============================================================
// main.jsx renders <App /> into the HTML page.
// App.jsx is the ROOT component — it doesn't do work itself,
// it just decides WHAT to show based on state.
//
// If not logged in → show <LoginPage />
// If logged in     → show sidebar + whatever module is active
//
// Every component below is a function that returns JSX (HTML-like code).
// When you write <Dashboard /> React calls the Dashboard function
// and puts whatever it returns into the page.
// ============================================================


// ============================================================
// LOGIN PAGE COMPONENT
// { onLogin } is a PROP — data/functions passed in from the parent.
// Same concept as HTML attributes: <img src="..." alt="..." />
// Here we pass a function instead of a string.
// When Log In is clicked → calls onLogin() → sets isLoggedIn=true in App
// ============================================================
function LoginPage({ onLogin }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-80">
        <img
          src="/Logo.png"
          alt="Logo"
          className="w-32 mx-auto mb-6 object-contain"
        />
        <h1 className="text-xl font-bold text-center mb-6">Login</h1>
        <button
          onClick={onLogin}
          className="w-full bg-orange-500 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Log In
        </button>
      </div>
    </div>
  )
}


// ============================================================
// PLACEHOLDER COMPONENTS
// These are temporary — just showing the page name for now.
// Later you'll replace each one by importing the real screen
// from your modules/ folder.
//
// Example replacement later:
//   import EmployeeList from './modules/hrms/EmployeeList'
//   Then replace the Employees function with <EmployeeList />
// ============================================================
function Dashboard() {
  return <div><h1 className="text-2xl font-bold">Dashboard</h1></div>
}
function Employees() {
  return <div><h1 className="text-2xl font-bold">Employees</h1></div>
}
function Biometrics() {
  return <div><h1 className="text-2xl font-bold">Biometrics</h1></div>
}
function ClinicLog() {
  return <div><h1 className="text-2xl font-bold">Clinic Log</h1></div>
}
function Outlets() {
  return <div><h1 className="text-2xl font-bold">Outlets</h1></div>
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
// Array of objects. Each object = one sidebar button.
//   id    → used to track which page is active
//   label → text shown on the button
//   icon  → icon from lucide-react
// ============================================================
const navItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'employees',    label: 'Employees',    icon: Users           },
  { id: 'biometrics',   label: 'Biometrics',   icon: Fingerprint     },
  { id: 'clinic',       label: 'Clinic Log',   icon: ClipboardList   },
  { id: 'outlets',      label: 'Outlets',      icon: Store           },
  { id: 'calculations', label: 'Calculations', icon: Calculator      },
  { id: 'reports',      label: 'Reports',      icon: BarChart3       },
]

// ============================================================
// NAVIGATION ITEMS — SYSTEM SECTION
// Separate from navItems so it shows under a different label.
// ============================================================
const systemItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
]


// ============================================================
// PAGES MAP
// Object that maps page id → component to render.
// When user clicks a nav button, activePage is set to the id.
// Then pages[activePage] looks up and returns the right component.
//
// Example:
//   activePage = 'clinic'
//   pages['clinic'] = <ClinicLog />
//   So <ClinicLog /> gets rendered in the main content area
// ============================================================
const pages = {
  dashboard:    <Dashboard />,
  employees:    <Employees />,
  biometrics:   <Biometrics />,
  clinic:       <ClinicLog />,
  outlets:      <Outlets />,
  calculations: <Calculations />,
  reports:      <Reports />,
  settings:     <SettingsPage />,
}


// ============================================================
// MAIN APP COMPONENT
// The root component. main.jsx calls this.
//
// STATE used here:
//   activePage  → which module tab is currently open
//   isLoggedIn  → controls whether login or full app is shown
//
// useState(false) means the starting value is false.
// useState('dashboard') means the starting value is 'dashboard'.
// ============================================================
function App() {

  const [activePage, setActivePage] = useState('dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Called when Log In button is clicked
  // Sets isLoggedIn to true → React re-renders → login gate is skipped
  function handleLogin() {
    setIsLoggedIn(true)
  }

  // Called when logout icon is clicked
  // Sets isLoggedIn to false → React re-renders → login page shows again
  // Also resets active page so next login starts at Dashboard
  function handleLogout() {
    setIsLoggedIn(false)
    setActivePage('dashboard')
  }

  // ============================================================
  // LOGIN GATE
  // Checked every time App re-renders.
  // If not logged in → return login page and STOP here.
  // The rest of the function (full app) never runs.
  // ============================================================
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  // ============================================================
  // FULL APP LAYOUT
  // Only reaches here when isLoggedIn is true.
  // Two columns: sidebar on left, main content on right.
  // ============================================================
  return (
    <div className="flex h-screen bg-gray-100">

      {/* ==================================================
          SIDEBAR
          Fixed width, dark background, three sections:
          TOP (logo) | MIDDLE (nav) | BOTTOM (user + logout)
          justify-between pushes TOP+MIDDLE up, BOTTOM down
      ================================================== */}
      <aside className="w-52 bg-[#1e1b18] text-white flex flex-col justify-between py-6 px-3">

        {/* TOP + MIDDLE in one div so justify-between works correctly */}
        <div>

          {/* TOP — Company Logo
              /Logo.png works because Vite serves public/ from root.
              object-contain keeps logo proportions.
              max-h-16 = max height 64px so it doesn't overflow. */}
          <div className="px-2 mb-8">
            <img
              src="/Logo.png"
              alt="Company Logo"
              className="w-full object-contain max-h-16"
            />
          </div>

          {/* MIDDLE — Module Nav Buttons
              .map() loops through navItems and returns a button for each.
              key= is required by React when rendering lists.
              isActive compares item.id to activePage — if match, orange bg. */}
          <p className="text-xs text-gray-500 uppercase px-2 mb-2">Overview</p>

          {navItems.map((item) => {
            const Icon = item.icon               // capital I so React treats it as a component
            const isActive = activePage === item.id  // true or false
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'                          // active state
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'  // inactive state
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}

          {/* System section — same pattern as above */}
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
        {/* End of TOP + MIDDLE */}


        {/* BOTTOM — User Info + Logout Icon
            Layout: [avatar] [name + role — takes remaining space] [logout icon]
            The row itself does NOT logout — only the icon button does.
            flex-1 on the text div pushes the logout icon to the far right. */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-md">

          {/* Avatar — orange circle with user initials
              shrink-0 = prevents circle from squishing if name is long */}
          <div className="bg-orange-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0">
            MR
          </div>

          {/* User name and role
              flex-1 = takes all remaining space, pushing logout icon right */}
          <div className="flex-1">
            <p className="text-sm font-medium leading-none mb-1">Maria Reyes</p>
            <p className="text-xs text-gray-400 leading-none">HR Manager</p>
          </div>

          {/* Logout icon button
              ONLY this triggers logout — not the whole row.
              p-1 = small padding so hover area is slightly bigger than icon.
              hover:bg-red-500/10 = subtle red bg on hover.
              hover:text-red-400 = red icon on hover.
              transition-colors = smooth color animation. */}
          <button
            onClick={handleLogout}
            className="p-1 rounded text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
          </button>

        </div>
        {/* End of BOTTOM */}

      </aside>
      {/* End of SIDEBAR */}


      {/* ==================================================
          MAIN CONTENT AREA
          flex-1 = takes all remaining horizontal space
          overflow-auto = shows scrollbar if content is too tall
          p-8 = 32px padding on all sides

          pages[activePage] looks up the current page id
          and renders the matching component.
      ================================================== */}
      <main className="flex-1 overflow-auto p-8">
        {pages[activePage]}
      </main>

    </div>
  )
}


// ============================================================
// EXPORT
// Makes App available to main.jsx which imports and renders it.
// Without this line, main.jsx can't find the App component.
// ============================================================
export default App