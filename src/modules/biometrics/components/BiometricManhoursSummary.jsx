import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ChevronDown, ChevronRight, Clock, Calendar, TrendingUp, TrendingDown,
  Minus, Users, Fingerprint, Info,
} from 'lucide-react'
import {
  resolveRecordHours,
  isCountableManhourRecord,
} from '../biometricHours'

const fmtHours = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getMonthKey = (dateStr) => {
  if (!dateStr || dateStr.length < 7) return 'Unknown'
  return dateStr.slice(0, 7)
}

const getYearKey = (dateStr) => {
  if (!dateStr || dateStr.length < 4) return 'Unknown'
  return dateStr.slice(0, 4)
}

const formatMonthKey = (key) => {
  if (key === 'Unknown') return 'Unknown Date'
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
}

function deptExpandKey(periodType, periodKey, dept) {
  return `${periodType}:${periodKey}:${dept}`
}

function buildDepartmentGroups(rows, employeeLookup, hoursMode) {
  const map = {}
  for (const r of rows) {
    if (!isCountableManhourRecord(r, hoursMode)) continue

    const empNo = String(r.employee_no || r.id)
    const dept  = r.department || '—'
    const hours = resolveRecordHours(r, hoursMode)

    if (!map[dept]) map[dept] = { dept, hours: 0, records: 0, byEmployee: {} }
    map[dept].hours += hours
    map[dept].records += 1

    if (!map[dept].byEmployee[empNo]) {
      map[dept].byEmployee[empNo] = { hours: 0, records: 0, fallbackName: r.name, statuses: {} }
    }
    const bucket = map[dept].byEmployee[empNo]
    bucket.hours += hours
    bucket.records += 1
    const st = r.status || 'Unknown'
    bucket.statuses[st] = (bucket.statuses[st] || 0) + 1
  }

  return Object.values(map)
    .map(d => ({
      dept: d.dept,
      hours: d.hours,
      records: d.records,
      employeeCount: Object.keys(d.byEmployee).length,
      employees: Object.entries(d.byEmployee)
        .map(([empNo, data]) => {
          const live = employeeLookup[empNo]
          return {
            employeeNo: live?.employee_no ?? empNo,
            name: live?.name ?? data.fallbackName ?? '—',
            hours: data.hours,
            records: data.records,
            statuses: data.statuses,
          }
        })
        .sort((a, b) => b.hours - a.hours),
    }))
    .sort((a, b) => b.hours - a.hours)
}

function TrendBadge({ current, previous }) {
  if (previous == null || previous === 0) return null
  if (current === previous) {
    return (
      <span className="flex items-center gap-0.5 text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
        <Minus size={10} /> flat
      </span>
    )
  }
  const pct = Math.round(Math.abs((current - previous) / previous) * 100)
  const up = current > previous
  return (
    <span
      className="flex items-center gap-0.5 text-xs ml-1 font-medium"
      style={{ color: up ? '#16a34a' : '#dc2626' }}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pct}%
    </span>
  )
}

function PeriodDepartmentBreakdown({ rows, label, periodType, periodKey, employeeLookup, expandedDepts, onToggleDept, hoursMode }) {
  const departments = useMemo(
    () => buildDepartmentGroups(rows, employeeLookup, hoursMode),
    [rows, employeeLookup, hoursMode],
  )

  if (!departments.length) return null

  return (
    <div style={{ background: 'var(--page-bg-alt)', borderTop: '1px solid var(--border)' }}>
      <p
        className="text-[11px] font-semibold uppercase tracking-widest px-6 pt-3 pb-1 m-0"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label} · by department
      </p>

      <div className="pb-2">
        {departments.map(dept => {
          const expandKey  = deptExpandKey(periodType, periodKey, dept.dept)
          const isDeptOpen = !!expandedDepts[expandKey]

          return (
            <div key={expandKey} style={{ borderTop: '1px solid var(--border)' }}>
              {/* Department row */}
              <div
                className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors"
                style={{ background: isDeptOpen ? 'var(--surface-hover)' : 'transparent' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleDept(expandKey)
                }}
                onMouseEnter={e => { if (!isDeptOpen) e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { if (!isDeptOpen) e.currentTarget.style.background = 'transparent' }}
              >
                <button
                  type="button"
                  className="shrink-0 border-none bg-transparent p-0 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={(e) => { e.stopPropagation(); onToggleDept(expandKey) }}
                >
                  {isDeptOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold m-0 truncate" style={{ color: 'var(--text-primary)' }}>
                    {dept.dept}
                  </p>
                  <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''}&nbsp;·&nbsp;
                    {dept.records} record{dept.records !== 1 ? 's' : ''}
                  </p>
                </div>

                <p className="text-sm font-bold m-0 shrink-0" style={{ color: 'var(--theme-500)' }}>
                  {fmtHours(dept.hours)} hrs
                </p>
              </div>

              {/* Employee rows */}
              {isDeptOpen && (
                <div className="px-6 pb-3 pl-12">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)' }}>
                        <th className="pb-1.5 text-left font-semibold uppercase tracking-wide w-28">Emp #</th>
                        <th className="pb-1.5 text-left font-semibold uppercase tracking-wide">Name</th>
                        <th className="pb-1.5 text-left font-semibold uppercase tracking-wide w-36">Status mix</th>
                        <th className="pb-1.5 text-right font-semibold uppercase tracking-wide w-28">Manhours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dept.employees.map(emp => (
                        <tr key={String(emp.employeeNo)} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="py-2 font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {emp.employeeNo}
                          </td>
                          <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {emp.name}
                          </td>
                          <td className="py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {Object.entries(emp.statuses).map(([st, n]) => `${st} (${n})`).join(' · ')}
                          </td>
                          <td className="py-2 text-right font-semibold" style={{ color: 'var(--theme-500)' }}>
                            {fmtHours(emp.hours)} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid var(--border)' }}>
                        <td colSpan={3} className="pt-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                          Department total
                        </td>
                        <td className="pt-2 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                          {fmtHours(dept.hours)} hrs
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PeriodBreakdown({
  title, subtitle, groups, periodType,
  expandedKeys, onToggle,
  expandedDepts, onToggleDept,
  employeeLookup, maxHours, emptyLabel, hoursMode,
}) {
  if (groups.length === 0) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          {emptyLabel}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h3 className="font-semibold text-sm m-0" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'var(--page-bg-alt)', color: 'var(--text-secondary)' }}
        >
          {groups.length} period{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div>
        {groups.map((group, idx) => {
          const isExpanded = !!expandedKeys[group.key]
          const widthPct   = maxHours > 0 ? (group.hours / maxHours) * 100 : 0
          const prev       = groups[idx + 1]
          const avgPerEmp  = group.employeeCount > 0 ? group.hours / group.employeeCount : 0

          return (
            <div key={group.key} style={{ borderTop: '1px solid var(--border)' }}>
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors"
                style={{ background: isExpanded ? 'var(--surface-hover)' : 'transparent' }}
                onClick={() => onToggle(group.key)}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
              >
                <button type="button" className="shrink-0 border-none bg-transparent p-0 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                <div className="w-44 shrink-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm m-0" style={{ color: 'var(--text-primary)' }}>
                      {group.label}
                    </p>
                    <TrendBadge current={group.hours} previous={prev?.hours} />
                  </div>
                  <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--text-secondary)' }}>
                    {group.employeeCount} employee{group.employeeCount !== 1 ? 's' : ''}&nbsp;·&nbsp;
                    {group.records} record{group.records !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--page-bg-alt)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      background: 'linear-gradient(90deg, var(--theme-500), var(--theme-600, var(--theme-500)))',
                    }}
                  />
                </div>

                <div className="text-right shrink-0 w-40">
                  <p className="font-bold text-sm m-0" style={{ color: 'var(--text-primary)' }}>
                    {fmtHours(group.hours)} hrs
                  </p>
                  <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    avg {fmtHours(avgPerEmp)} / employee
                  </p>
                </div>
              </div>

              {isExpanded && (
                <PeriodDepartmentBreakdown
                  rows={group.rows}
                  label={group.label}
                  periodType={periodType}
                  periodKey={group.key}
                  employeeLookup={employeeLookup}
                  expandedDepts={expandedDepts}
                  onToggleDept={onToggleDept}
                  hoursMode={hoursMode}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BiometricManhoursSummary({ records = [], selectedDept = 'All Departments', refreshKey = 0 }) {
  const [expandedMonths, setExpandedMonths] = useState({})
  const [expandedYears,  setExpandedYears]  = useState({})
  const [expandedDepts,  setExpandedDepts]  = useState({})
  const [employees,      setEmployees]      = useState([])
  const [hoursMode,      setHoursMode]      = useState('scheduled') // matches Attendance table default

  // Re-fetch employees whenever DB syncs so names/numbers stay current
  useEffect(() => {
    window.electronAPI.getEmployees()
      .then(rows => setEmployees(rows ?? []))
      .catch(() => setEmployees([]))
  }, [refreshKey])

  const employeeLookup = useMemo(() => {
    const map = {}
    for (const e of employees) {
      map[String(e.employee_no)] = {
        employee_no: e.employee_no,
        name: e.name,
        department: e.department,
      }
    }
    return map
  }, [employees])

  const toggleDept = useCallback((key) => {
    setExpandedDepts(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const filtered = useMemo(() => {
    const base = records.filter(r => isCountableManhourRecord(r, hoursMode))
    if (selectedDept === 'All Departments') return base
    return base.filter(r => r.department === selectedDept)
  }, [records, selectedDept, hoursMode])

  const { monthGroups, yearGroups, totals } = useMemo(() => {
    const monthMap = {}
    const yearMap  = {}

    for (const r of filtered) {
      const monthKey = getMonthKey(r.date)
      const yearKey  = getYearKey(r.date)
      const hours    = resolveRecordHours(r, hoursMode)
      const empNo    = String(r.employee_no || r.id)

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { key: monthKey, label: formatMonthKey(monthKey), rows: [], hours: 0, records: 0, employees: new Set() }
      }
      monthMap[monthKey].rows.push(r)
      monthMap[monthKey].hours += hours
      monthMap[monthKey].records += 1
      monthMap[monthKey].employees.add(empNo)

      if (!yearMap[yearKey]) {
        yearMap[yearKey] = { key: yearKey, label: yearKey, rows: [], hours: 0, records: 0, employees: new Set() }
      }
      yearMap[yearKey].rows.push(r)
      yearMap[yearKey].hours += hours
      yearMap[yearKey].records += 1
      yearMap[yearKey].employees.add(empNo)
    }

    const finalize = (map) =>
      Object.values(map)
        .map(g => ({ ...g, employeeCount: g.employees.size }))
        .sort((a, b) => b.key.localeCompare(a.key))

    const months = finalize(monthMap)
    const years  = finalize(yearMap)

    const allEmployees = new Set(filtered.map(r => String(r.employee_no || r.id)))
    const totalHours   = filtered.reduce((s, r) => s + resolveRecordHours(r, hoursMode), 0)

    return {
      monthGroups: months,
      yearGroups: years,
      totals: {
        hours: totalHours,
        records: filtered.length,
        employees: allEmployees.size,
        months: months.length,
        years: years.length,
      },
    }
  }, [filtered, hoursMode])

  const maxMonthHours = Math.max(...monthGroups.map(m => m.hours), 1)
  const maxYearHours  = Math.max(...yearGroups.map(y => y.hours), 1)

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-secondary)' }}>
        <Fingerprint size={40} style={{ opacity: 0.25 }} />
        <p className="font-medium m-0" style={{ color: 'var(--text-primary)' }}>No attendance records yet</p>
        <p className="text-sm text-center max-w-xs m-0">
          Import biometric data to see monthly and annual manhours summaries here.
        </p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-secondary)' }}>
        <p className="font-medium m-0" style={{ color: 'var(--text-primary)' }}>No records for this filter</p>
        <p className="text-sm m-0">Try selecting a different department.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* DOLE accuracy notice */}
      <div
        className="rounded-xl px-4 py-3 flex gap-3 text-sm"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--theme-500)',
        }}
      >
        <Info size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--theme-500)' }} />
        <div style={{ color: 'var(--text-primary)' }}>
          <p className="font-semibold m-0 mb-1">DOLE submission basis</p>
          <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Totals are recomputed from punch times (not cached DB values). Excludes <strong>Absent</strong>,{' '}
            <strong>Incomplete</strong>, and <strong>Day Off</strong> records. Lunch break defaults to 60 minutes
            when lunch punches are missing. One row per employee per day — no double counting.
            {hoursMode === 'scheduled'
              ? ' Using scheduled hours (clamped to shift start/end) — matches the Attendance table default.'
              : ' Using actual tap hours (raw in/out) — includes early arrival and late departure.'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Hour basis:
            </span>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--page-bg-alt)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '2px', gap: '2px',
            }}>
              {[
                { id: 'scheduled', label: 'Scheduled (shift-clamped)' },
                { id: 'actual',    label: 'Actual (raw punches)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHoursMode(opt.id)}
                  style={{
                    padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: hoursMode === opt.id ? 600 : 400,
                    background: hoursMode === opt.id ? 'var(--theme-500)' : 'transparent',
                    color: hoursMode === opt.id ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4 flex items-center gap-3 shadow-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--page-bg-alt)' }}>
            <Clock size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-0.5 m-0" style={{ color: 'var(--text-secondary)' }}>Total Manhours</p>
            <p className="text-2xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>{fmtHours(totals.hours)}</p>
            <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>hours logged</p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3 shadow-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--page-bg-alt)' }}>
            <Users size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-0.5 m-0" style={{ color: 'var(--text-secondary)' }}>Employees</p>
            <p className="text-2xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>{totals.employees}</p>
            <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {totals.records} attendance record{totals.records !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3 shadow-sm"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--theme-500)',
            boxShadow: '0 0 0 1px color-mix(in srgb, var(--theme-500) 15%, transparent)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'color-mix(in srgb, var(--theme-500) 15%, var(--surface))' }}
          >
            <Calendar size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-0.5 m-0" style={{ color: 'var(--theme-500)' }}>Coverage</p>
            <p className="text-2xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>{totals.months} mo · {totals.years} yr</p>
            <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              avg {fmtHours(totals.records > 0 ? totals.hours / totals.records : 0)} hrs / record
            </p>
          </div>
        </div>
      </div>

      <PeriodBreakdown
        title="Monthly Manhours"
        subtitle="Click a month → department → employee to drill down"
        periodType="month"
        groups={monthGroups}
        expandedKeys={expandedMonths}
        onToggle={(key) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }))}
        expandedDepts={expandedDepts}
        onToggleDept={toggleDept}
        employeeLookup={employeeLookup}
        maxHours={maxMonthHours}
        emptyLabel="No monthly data available."
        hoursMode={hoursMode}
      />

      <PeriodBreakdown
        title="Annual Manhours"
        subtitle="Click a year → department → employee to drill down"
        periodType="year"
        groups={yearGroups}
        expandedKeys={expandedYears}
        onToggle={(key) => setExpandedYears(prev => ({ ...prev, [key]: !prev[key] }))}
        expandedDepts={expandedDepts}
        onToggleDept={toggleDept}
        employeeLookup={employeeLookup}
        maxHours={maxYearHours}
        emptyLabel="No annual data available."
        hoursMode={hoursMode}
      />

      <div
        className="rounded-xl px-6 py-3 flex items-center justify-between shadow-sm"
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          All-Time Total Manhours
          {selectedDept !== 'All Departments' && ` · ${selectedDept}`}
        </span>
        <span className="font-bold text-base" style={{ color: 'var(--theme-500)' }}>
          {fmtHours(totals.hours)} hrs
        </span>
      </div>
    </div>
  )
}
