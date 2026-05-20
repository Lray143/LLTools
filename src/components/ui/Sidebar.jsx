// src/components/Sidebar.jsx

// This component is responsible for ONLY the sidebar.
// It receives these props from App.jsx:
//   activePage   → which page is currently active
//   setActivePage → function to change the active page
//   onLogout     → function to log out

import { LayoutDashboard, Users, ClipboardList, Calculator, BarChart3, Settings, Store, Fingerprint, LogOut } from 'lucide-react'

// Nav items defined here since they belong to the sidebar
const navItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'employees',    label: 'Employees',    icon: Users           },
  { id: 'biometrics',   label: 'Biometrics',   icon: Fingerprint     },
  { id: 'clinic',       label: 'Clinic Log',   icon: ClipboardList   },
  { id: 'outlets',      label: 'Outlets',      icon: Store           },
  { id: 'calculations', label: 'Calculations', icon: Calculator      },
  { id: 'reports',      label: 'Reports',      icon: BarChart3       },
]

const systemItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

function Sidebar({ activePage, setActivePage, onLogout }) {
  return (
    <aside className="w-52 bg-[#1e1b18] text-white flex flex-col justify-between py-6 px-3">

      {/* TOP + MIDDLE */}
      <div>

        {/* TOP — Logo */}
        <div className="px-2 mb-8">
          <img
            src="/Logo.png"
            alt="Company Logo"
            className="w-full object-contain max-h-16"
          />
        </div>

        {/* MIDDLE — Module nav */}
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

      {/* BOTTOM — User info + logout */}
      <div className="flex items-center gap-3 px-2 py-2 rounded-md">
        <div className="bg-orange-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0">
          MR
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-none mb-1">Maria Reyes</p>
          <p className="text-xs text-gray-400 leading-none">HR Manager</p>
        </div>
        <button
          onClick={onLogout}
          className="p-1 rounded text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>

    </aside>
  )
}

export default Sidebar