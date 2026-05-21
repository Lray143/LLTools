// ─────────────────────────────────────────────────────────────
// components/BiometricFilterBar.jsx
// Filter controls: month selector, department filter,
// Daily/Weekly/Monthly toggle, Import button, Export button.
//
// Props:
//   selectedMonth / setSelectedMonth — controlled month dropdown
//   selectedDept  / setSelectedDept  — controlled dept dropdown
//   viewMode      / setViewMode      — Daily | Weekly | Monthly
//   onImportClick — opens the hidden file input
//   onExport      — triggers exportToXLSX
//   months        — array of month strings
//   departments   — array of department strings
// ─────────────────────────────────────────────────────────────

import { ChevronDown, Download, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/button'

export function BiometricFilterBar({
  selectedMonth, setSelectedMonth,
  selectedDept,  setSelectedDept,
  viewMode,      setViewMode,
  onImportClick,
  onExport,
  months,
  departments,
}) {
  return (
    <div className="flex items-center justify-between mb-4">

      {/* LEFT — month, dept, view toggle */}
      <div className="flex items-center gap-2">

        {/* Month selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none rounded-xl pl-3 pr-8 py-2 outline-none cursor-pointer"
            style={{
              background  : '#fff',
              border      : '1px solid rgba(0,0,0,0.12)',
              color       : '#2c2010',
              fontSize    : '13px',
              boxShadow   : '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color:'#a09278' }}
          />
        </div>

        {/* Department filter */}
        <div className="relative">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="appearance-none rounded-xl pl-3 pr-8 py-2 outline-none cursor-pointer"
            style={{
              background  : '#fff',
              border      : '1px solid rgba(0,0,0,0.12)',
              color       : '#2c2010',
              fontSize    : '13px',
              boxShadow   : '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color:'#a09278' }}
          />
        </div>

        {/* Daily / Weekly / Monthly toggle */}
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ border:'1px solid rgba(0,0,0,0.12)', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}
        >
          {['Daily','Weekly','Monthly'].map((mode) => {
            const active = viewMode === mode
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-4 py-2 transition-colors duration-150"
                style={{
                  fontSize   : '13px',
                  background : active ? '#f97316' : '#fff',
                  color      : active ? '#fff' : '#6b5c4c',
                  border     : 'none',
                  cursor     : 'pointer',
                  fontWeight : active ? 500 : 400,
                }}
              >
                {mode}
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT — Import + Export buttons */}
      <div className="flex items-center gap-2">

        {/* Import — uses shadcn Button with outline variant */}
        <Button
          variant="outline"
          className="gap-2 border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-400"
          onClick={onImportClick}
        >
          <Upload size={14} />
          Import
        </Button>

        {/* Export — uses shadcn Button with brand orange */}
        <Button
          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={onExport}
        >
          <Download size={14} />
          Export Report
        </Button>

      </div>
    </div>
  )
}