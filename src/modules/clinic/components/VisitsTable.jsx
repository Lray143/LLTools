import { useState } from "react"
import { Calendar, Pencil, Trash2, Archive, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { ALL_MONTHS, DISP_CLASS } from "./clinicConstants"

const ITEMS_PER_PAGE = 10

function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = []
  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, "...", totalPages)
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
  }
  return pages
}

export default function VisitsTable({
  visits,
  onEditVisit,
  onDeleteVisit,
  onOpenArchive,
  tableExpanded,
  onToggleExpand,
}) {
  const now = new Date()

  // ── Period state ─────────────────────────────────────────────────────────
  const [mode,         setMode]         = useState("monthly")          // "monthly" | "yearly"
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())     // 0–11
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear())
  const [currentPage,  setCurrentPage]  = useState(1)

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredVisits = visits.filter(v => {
    if (mode === "monthly") {
      return v.month === ALL_MONTHS[currentMonth] && v.year === currentYear
    }
    return v.year === currentYear
  })

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalRecords = filteredVisits.length
  const totalPages   = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE))
  const safePage     = Math.min(currentPage, totalPages)
  const startIdx     = (safePage - 1) * ITEMS_PER_PAGE
  const endIdx       = Math.min(startIdx + ITEMS_PER_PAGE, totalRecords)
  const pageVisits   = filteredVisits.slice(startIdx, endIdx)
  const pages        = getPaginationPages(safePage, totalPages)

  // ── Derive available years from visits for year bounds ───────────────────
  const availableYears = [...new Set(visits.map(v => v.year).filter(Boolean))].sort((a, b) => a - b)
  const minYear = availableYears[0] ?? currentYear
  const maxYear = availableYears[availableYears.length - 1] ?? currentYear

  // ── Navigator handlers ────────────────────────────────────────────────────
  function prevPeriod() {
    setCurrentPage(1)
    if (mode === "monthly") {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
      else setCurrentMonth(m => m - 1)
    } else {
      setCurrentYear(y => y - 1)
    }
  }

  function nextPeriod() {
    setCurrentPage(1)
    if (mode === "monthly") {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
      else setCurrentMonth(m => m + 1)
    } else {
      setCurrentYear(y => y + 1)
    }
  }

  function switchMode(newMode) {
    setMode(newMode)
    setCurrentPage(1)
  }

  function goToPage(p) {
    if (p >= 1 && p <= totalPages) setCurrentPage(p)
  }

  // ── Navigator label ───────────────────────────────────────────────────────
  const periodLabel = mode === "monthly"
    ? `${ALL_MONTHS[currentMonth]} ${currentYear}`
    : `All of ${currentYear}`

  const canGoPrev = mode === "yearly" ? currentYear > minYear : true
  const canGoNext = mode === "yearly" ? currentYear < maxYear : true

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">

          {/* Left: title + record count */}
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-gray-900">Recent Clinic Visits</h2>
            <span className="text-xs text-gray-400">
              {totalRecords} record{totalRecords !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Right: period controls + archive + expand */}
          <div className="flex items-center gap-2">

            {/* Monthly / Yearly toggle — segmented pill matching BiometricFilterBar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px', padding: '3px', gap: '2px',
            }}>
              {["monthly", "yearly"].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    padding: '5px 16px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: mode === m ? 600 : 400,
                    background: mode === m ? '#f97316' : 'transparent',
                    color: mode === m ? '#fff' : '#6b5c4c',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 150ms, color 150ms',
                    whiteSpace: 'nowrap', lineHeight: '1.4',
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* Period navigator: < 📅 May 2026 > */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={prevPeriod}
                disabled={!canGoPrev}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 min-w-[90px] text-center select-none">
                  {periodLabel}
                </span>
              </div>
              <button
                onClick={nextPeriod}
                disabled={!canGoNext}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Archive */}
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200 text-gray-600 hover:bg-gray-50 w-8 h-8"
              onClick={onOpenArchive}
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </Button>

            {/* Expand / Collapse */}
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200 text-gray-600 hover:bg-gray-50 w-8 h-8"
              onClick={onToggleExpand}
              title={tableExpanded ? "Collapse" : "Expand table"}
            >
              {tableExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

          </div>
        </div>
      </div>

      {/* Table body */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {filteredVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No visits in {periodLabel}</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                {[
                  "Date", "Time", "Employee", "Complaint",
                  ...(tableExpanded ? ["Blood Pressure", "Temperature", "Treatment / Action Taken"] : []),
                  "Disposition", ""
                ].map((h, i) => (
                  <th
                    key={i}
                    className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 border-b border-gray-100 pr-3 last:pr-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageVisits.map((v, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 last:border-0 hover:bg-orange-50/40 transition-colors group"
                >
                  <td className="py-3 pr-3 text-sm text-gray-500 whitespace-nowrap">{v.date}</td>
                  <td className="py-3 pr-3 text-sm text-gray-400 whitespace-nowrap">{v.time}</td>
                  <td className="py-3 pr-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{v.employee}</td>
                  <td className="py-3 pr-3 text-sm text-gray-600 whitespace-nowrap">{v.complaint}</td>
                  {tableExpanded && <>
                    <td className="py-3 pr-3 text-sm text-gray-600 whitespace-nowrap">{v.bp || "—"}</td>
                    <td className="py-3 pr-3 text-sm text-gray-600 whitespace-nowrap">{v.temp ? `${v.temp} °C` : "—"}</td>
                    <td className="py-3 pr-6 text-sm text-gray-500 max-w-xs">
                      <span className="line-clamp-2">{v.treatment || "—"}</span>
                    </td>
                  </>}
                  <td className="py-3 pr-3">
                    <span className={`text-xs font-medium ${DISP_CLASS[v.disposition] || "text-gray-500"}`}>
                      {v.disposition}
                    </span>
                  </td>
                  <td className="py-3 text-right w-14">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditVisit(v)}
                        className="p-1 text-gray-300 hover:text-orange-400 transition-colors"
                        title="Edit record"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteVisit(v)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                        title="Remove record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalRecords > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Showing {startIdx + 1} to {endIdx} of {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                    p === safePage
                      ? "bg-orange-500 text-white border border-orange-500"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}