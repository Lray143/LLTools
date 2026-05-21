// ─────────────────────────────────────────────────────────────
// components/BiometricHeader.jsx
// Matches Employees top bar exactly:
//   LEFT  → page title
//   RIGHT → search input + bell + user icons
// ─────────────────────────────────────────────────────────────

import { Bell, Search, UserRound } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input }  from '../../../components/ui/input'

export function BiometricHeader({ searchQuery, setSearchQuery }) {
  return (
    <>
      {/* LEFT — page title */}
      <h1 className="text-2xl font-semibold text-gray-900">Biometrics</h1>

      {/* RIGHT — search + icon buttons, pushed to far right */}
      <div className="flex items-center gap-3">

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-56 bg-white border-gray-200"
          />
        </div>

        {/* Bell icon — TODO: wire up notifications */}
        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
          <Bell className="w-5 h-5" />
        </Button>

        {/* User icon — TODO: wire up profile */}
        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
          <UserRound className="w-5 h-5" />
        </Button>

      </div>
    </>
  )
}