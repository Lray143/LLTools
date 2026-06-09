import { Bell, Search, User } from 'lucide-react'

export function MyAttendanceHeader() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900">My Attendance</h1>

      <div className="flex items-center gap-3">

        <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
          <Bell className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
          <User className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}