import { useState, useRef, useEffect, useMemo } from "react"
import { Calendar, Pencil, Trash2, Archive, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, Paperclip, Eye, Filter, ChevronDown, X } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { ALL_MONTHS, DISP_CLASS, COMPLAINT_GROUPS } from "./clinicConstants"
import { exportClinicToXLSX } from "../exportClinicToXLSX"
import FilePreviewModal, { resolveAttachment } from "./FilePreviewModal"

const ITEMS_PER_PAGE = 12

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
  onRowClick,
  searchQuery = "",
}) {
  const now = new Date()

  const todayISO = now.toISOString().split("T")[0]

  const [mode,         setMode]         = useState("monthly")
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear())
  const [currentDate,  setCurrentDate]  = useState(todayISO)
  const [currentPage,  setCurrentPage]  = useState(1)
  const [previewFile,  setPreviewFile]  = useState(null)

  // Complaint filter state
  const [complaintFilter,       setComplaintFilter]       = useState(null)
  const [complaintDropdownOpen,  setComplaintDropdownOpen]  = useState(false)
  const [complaintSearch,        setComplaintSearch]        = useState("")
  const complaintDropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (complaintDropdownRef.current && !complaintDropdownRef.current.contains(e.target)) {
        setComplaintDropdownOpen(false)
        setComplaintSearch("")
      }
    }
    if (complaintDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [complaintDropdownOpen])

  const q = searchQuery.trim().toLowerCase()

  // Pre-filter by date/mode and search (but NOT by complaint yet)
  const dateAndSearchFiltered = visits.filter(v => {
    const vYear = Number(v.year)
    // Date/mode filter
    if (mode === "daily"   && v._rawDate !== currentDate) return false
    if (mode === "monthly" && !(v.month === ALL_MONTHS[currentMonth] && vYear === currentYear)) return false
    if (mode === "yearly"  && vYear !== currentYear) return false
    // Search filter
    if (!q) return true
    return (
      (v.fullName      ?? "").toLowerCase().includes(q) ||
      (v.employeeCode  ?? "").toLowerCase().includes(q) ||
      (v.employee      ?? "").toLowerCase().includes(q) ||
      (v.complaint     ?? "").toLowerCase().includes(q)
    )
  })

  // Build complaint counts from the date/search filtered set
  const complaintCounts = useMemo(() => {
    const counts = {}
    dateAndSearchFiltered.forEach(v => {
      const c = (v.complaint ?? "").trim()
      if (c) {
        counts[c] = (counts[c] || 0) + 1
      }
    })
    return counts
  }, [dateAndSearchFiltered])

  // Build the dropdown items: existing complaints from data + all predefined ones
  const complaintDropdownItems = useMemo(() => {
    const items = []
    const seen = new Set()

    // 1. Complaints that actually appear in the current data (sorted by count descending)
    const dataComplaints = Object.entries(complaintCounts)
      .sort((a, b) => b[1] - a[1])
    dataComplaints.forEach(([name, count]) => {
      items.push({ name, count, inData: true })
      seen.add(name.toLowerCase())
    })

    // 2. Predefined complaints from COMPLAINT_GROUPS (with 0 count if not in data)
    COMPLAINT_GROUPS.forEach(group => {
      group.options.forEach(opt => {
        if (!seen.has(opt.toLowerCase())) {
          items.push({ name: opt, count: 0, inData: false, group: group.group })
          seen.add(opt.toLowerCase())
        }
      })
    })

    return items
  }, [complaintCounts])

  // Filter the dropdown items by the search query inside the dropdown
  const filteredDropdownItems = useMemo(() => {
    const s = complaintSearch.trim().toLowerCase()
    if (!s) return complaintDropdownItems
    return complaintDropdownItems.filter(item => item.name.toLowerCase().includes(s))
  }, [complaintDropdownItems, complaintSearch])

  // Apply complaint filter on top of date/search filter
  const filteredVisits = complaintFilter
    ? dateAndSearchFiltered.filter(v => (v.complaint ?? "").trim() === complaintFilter)
    : dateAndSearchFiltered

  function selectComplaint(name) {
    setComplaintFilter(name)
    setComplaintDropdownOpen(false)
    setComplaintSearch("")
    setCurrentPage(1)
  }

  function clearComplaintFilter() {
    setComplaintFilter(null)
    setCurrentPage(1)
  }

  const totalRecords = filteredVisits.length
  const totalPages   = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE))
  const safePage     = Math.min(currentPage, totalPages)
  const startIdx     = (safePage - 1) * ITEMS_PER_PAGE
  const endIdx       = Math.min(startIdx + ITEMS_PER_PAGE, totalRecords)
  const pageVisits   = filteredVisits.slice(startIdx, endIdx)
  const pages        = getPaginationPages(safePage, totalPages)

  const availableYears = [...new Set(visits.map(v => Number(v.year)).filter(Boolean))].sort((a, b) => a - b)
  const minYear = availableYears[0] ?? currentYear
  const maxYear = availableYears[availableYears.length - 1] ?? currentYear

  const availableDates = [...new Set(visits.map(v => v._rawDate).filter(Boolean))].sort()
  const minDate = availableDates[0] ?? currentDate
  const maxDate = availableDates[availableDates.length - 1] ?? currentDate

  function shiftDate(iso, days) {
    const d = new Date(iso)
    d.setDate(d.getDate() + days)
    return d.toISOString().split("T")[0]
  }

  function prevPeriod() {
    setCurrentPage(1)
    if (mode === "daily") {
      setCurrentDate(d => shiftDate(d, -1))
    } else if (mode === "monthly") {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
      else setCurrentMonth(m => m - 1)
    } else {
      setCurrentYear(y => y - 1)
    }
  }

  function nextPeriod() {
    setCurrentPage(1)
    if (mode === "daily") {
      setCurrentDate(d => shiftDate(d, 1))
    } else if (mode === "monthly") {
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

  async function handlePreviewAttachment(attachments) {
    if (!attachments || attachments.length === 0) return
    const att = attachments[0]
    const res = await resolveAttachment(att)
    if (res.useModal) {
      setPreviewFile(res.att)
    }
  }

  function formatDayLabel(iso) {
    if (!iso) return ""
    const [y, mo, d] = iso.split("-").map(Number)
    const monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mo - 1]
    return `${monthName} ${d}, ${y}`
  }

  const periodLabel = mode === "daily"
    ? formatDayLabel(currentDate)
    : mode === "monthly"
      ? `${ALL_MONTHS[currentMonth]} ${currentYear}`
      : `All of ${currentYear}`

  const canGoPrev = mode === "daily"   ? currentDate > minDate
                  : mode === "yearly"  ? currentYear > minYear
                  : true
  const canGoNext = mode === "daily"   ? currentDate < maxDate
                  : mode === "yearly"  ? currentYear < maxYear
                  : true

  return (
    <div id="tour-clinic-table" className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

      {/* Header controls section */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-gray-900">Recent Clinic Visits</h2>
            <span className="text-xs text-gray-400">
              {totalRecords} record{totalRecords !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Complaint Filter Dropdown */}
            <div className="relative" ref={complaintDropdownRef}>
              <button
                id="tour-clinic-complaint-filter"
                onClick={() => {
                  setComplaintDropdownOpen(o => !o)
                  setComplaintSearch("")
                }}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "5px 12px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 500,
                  background: complaintFilter ? "var(--surface-hover)" : "var(--surface)",
                  color: complaintFilter ? "var(--theme-600)" : "var(--text-secondary)",
                  border: complaintFilter ? "1.5px solid var(--theme-400)" : "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 150ms",
                  whiteSpace: "nowrap", lineHeight: "1.4",
                  maxWidth: "220px",
                }}
              >
                <Filter className="w-3.5 h-3.5 flex-shrink-0" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {complaintFilter || "All Complaints"}
                </span>
                {complaintFilter ? (
                  <X
                    className="w-3.5 h-3.5 flex-shrink-0 hover:text-red-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); clearComplaintFilter() }}
                  />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                )}
              </button>

              {complaintDropdownOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    width: "340px", maxHeight: "420px",
                    background: 'var(--surface)', border: "1px solid #e5e7eb",
                    borderRadius: "12px", boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
                    zIndex: 50, display: "flex", flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Search inside dropdown */}
                  <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #f3f4f6" }}>
                    <input
                      autoFocus
                      value={complaintSearch}
                      onChange={e => setComplaintSearch(e.target.value)}
                      placeholder="Search complaints…"
                      style={{
                        width: "100%", padding: "7px 10px", fontSize: "12px",
                        border: "1px solid #e5e7eb", borderRadius: "8px",
                        outline: "none", color: 'var(--text-primary)',
                        background: 'var(--surface-hover)',
                      }}
                      onFocus={e => e.target.style.borderColor = "var(--theme-400)"}
                      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  {/* "All Complaints" option */}
                  <button
                    onClick={() => selectComplaint(null)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 14px", fontSize: "12.5px", fontWeight: 600,
                      color: !complaintFilter ? "var(--theme-600)" : "var(--text-primary)",
                      background: !complaintFilter ? "var(--surface-hover)" : "transparent",
                      border: "none", borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={e => { if (complaintFilter) e.currentTarget.style.background = "#fafafa" }}
                    onMouseLeave={e => { if (complaintFilter) e.currentTarget.style.background = "transparent" }}
                  >
                    <span>All Complaints</span>
                    <span style={{
                      fontSize: "11px", fontWeight: 700,
                      color: "var(--text-secondary)", background: 'var(--surface-hover)',
                      borderRadius: "6px", padding: "2px 8px",
                      minWidth: "28px", textAlign: "center",
                    }}>
                      {dateAndSearchFiltered.length}
                    </span>
                  </button>

                  {/* Scrollable complaint list */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
                    {filteredDropdownItems.length === 0 ? (
                      <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                        No complaints found
                      </div>
                    ) : (
                      filteredDropdownItems.map((item, i) => {
                        const isActive = complaintFilter === item.name
                        return (
                          <button
                            key={`${item.name}-${i}`}
                            onClick={() => selectComplaint(item.name)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "7px 14px", fontSize: "12.5px", fontWeight: isActive ? 600 : 400,
                              color: isActive ? "var(--theme-600)" : item.count > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                              background: isActive ? "var(--surface-hover)" : "transparent",
                              border: "none", cursor: "pointer",
                              textAlign: "left", width: "100%",
                              transition: "background 100ms",
                              gap: "8px",
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fafafa" }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {item.name}
                            </span>
                            <span style={{
                              fontSize: "11px", fontWeight: 700, flexShrink: 0,
                              color: item.count > 0 ? (isActive ? "var(--theme-600)" : "var(--text-secondary)") : "var(--text-secondary)",
                              background: item.count > 0 ? (isActive ? "var(--theme-200)" : "#f3f4f6") : "#fafafa",
                              borderRadius: "6px", padding: "2px 8px",
                              minWidth: "28px", textAlign: "center",
                            }}>
                              {item.count}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div id="tour-clinic-modes" style={{
              display: "flex", alignItems: "center",
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: "10px", padding: "3px", gap: "2px",
            }}>
              {["daily", "monthly", "yearly"].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    padding: "5px 16px", borderRadius: "8px",
                    fontSize: "13px", fontWeight: mode === m ? 600 : 400,
                    background: mode === m ? "var(--theme-500)" : "transparent",
                    color: mode === m ? "#fff" : "var(--text-secondary)",
                    border: "none", cursor: "pointer",
                    transition: "background 150ms, color 150ms",
                    whiteSpace: "nowrap", lineHeight: "1.4",
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            <div id="tour-clinic-date-nav" className="flex items-center gap-0.5">
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

            <Button
              id="tour-clinic-archive"
              variant="outline"
              size="icon"
              className="border-gray-200 text-gray-600 hover:bg-white w-8 h-8"
              onClick={onOpenArchive}
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </Button>

            <Button
              id="tour-clinic-export"
              variant="outline"
              size="icon"
              className="border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-300 w-8 h-8"
              onClick={() => exportClinicToXLSX(
                filteredVisits,
                `clinic-visits-${periodLabel.replace(/ /g, "-")}.xlsx`,
                periodLabel,
              )}
              title="Export to spreadsheet"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              id="tour-clinic-expand"
              variant="outline"
              size="icon"
              className="border-gray-200 text-gray-600 hover:bg-white w-8 h-8"
              onClick={onToggleExpand}
              title={tableExpanded ? "Collapse" : "Expand table"}
            >
              {tableExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Active complaint filter chip */}
        {complaintFilter && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 0 4px",
          }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>Filtered by:</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "12px", fontWeight: 600, color: "var(--theme-600)",
              background: 'var(--surface-hover)', border: "1px solid var(--theme-200)",
              borderRadius: "20px", padding: "3px 10px 3px 12px",
            }}>
              {complaintFilter}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                onClick={clearComplaintFilter}
              />
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {complaintCounts[complaintFilter] ?? 0} case{(complaintCounts[complaintFilter] ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto py-2">
        {filteredVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-6">
            <Calendar className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No visits in {periodLabel}</p>
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: tableExpanded ? "1440px" : "100%" }}>
            <colgroup>
              {tableExpanded ? [
                <col key="c1"  style={{ width: "105px" }} />, // Date
                <col key="c2"  style={{ width: "90px"  }} />, // Time
                <col key="c3"  style={{ width: "160px" }} />, // Employee
                <col key="c4"  style={{ width: "80px"  }} />, // Gender
                <col key="c5"  style={{ width: "60px"  }} />, // Age
                <col key="c6"  style={{ width: "165px" }} />, // Complaint
                <col key="c7"  style={{ width: "90px"  }} />, // BP
                <col key="c8"  style={{ width: "80px"  }} />, // Temp
                <col key="c9"  style={{ width: "90px"  }} />, // Pulse
                <col key="c10" style={{ width: "75px"  }} />, // SpO2
                <col key="c11" style={{ width: "225px" }} />, // Treatment
                <col key="c12" style={{ width: "120px" }} />, // Disposition
                <col key="c13" style={{ width: "65px"  }} />, // Files
                <col key="c14" style={{ width: "70px"  }} />, // Actions
              ] : [
                <col key="d1" style={{ width: "13%" }} />, // Date
                <col key="d2" style={{ width: "12%" }} />, // Time
                <col key="d3" style={{ width: "22%" }} />, // Employee
                <col key="d4" style={{ width: "28%" }} />, // Complaint
                <col key="d5" style={{ width: "19%" }} />, // Disposition
                <col key="d6" style={{ width: "6%"  }} />, // Actions
              ]}
            </colgroup>

            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4 pl-6">Date</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Time</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Employee</th>
                {tableExpanded && <>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Gender</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Age</th>
                </> }
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Complaint</th>
                {tableExpanded && <>
                  <th className="text-left text-[11px] font-semibold text-orange-300 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">BP</th>
                  <th className="text-left text-[11px] font-semibold text-orange-300 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Temp</th>
                  <th className="text-left text-[11px] font-semibold text-orange-300 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Pulse</th>
                  <th className="text-left text-[11px] font-semibold text-orange-300 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">SpO₂</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Treatment</th>
                </> }
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Disposition</th>
                {tableExpanded && (
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 border-b border-gray-100 pr-4">Files</th>
                )}
                <th className="border-b border-gray-100"></th>
              </tr>
            </thead>

            <tbody>
              {pageVisits.map((v, i) => {
                const rowBg = i % 2 === 0 ? "var(--surface)" : "var(--surface-hover)"
                const attachments = v.attachments ?? []
                return (
                  <tr
                    key={i}
                    className="group"
                    style={{ background: rowBg, borderBottom: '1px solid var(--border)', transition: "background 100ms" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--page-bg-alt)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = rowBg }}
                  >
                    <td className="py-3.5 pr-4 pl-6 text-sm text-gray-500 whitespace-nowrap">{v.date}</td>
                    <td className="py-3.5 pr-4 text-sm text-gray-400 whitespace-nowrap">{v.time}</td>
                    <td 
                      className="py-3.5 pr-4 text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-theme-500 hover:underline decoration-dashed transition-colors"
                      title="Click to view full entry details"
                      onClick={() => onRowClick?.(v)}
                    >
                      {v.employee}
                    </td>
                    {tableExpanded && <>
                      <td className="py-3.5 pr-4 text-xs text-gray-500 whitespace-nowrap capitalize">{v.gender || "—"}</td>
                      <td className="py-3.5 pr-4 text-xs text-gray-500 whitespace-nowrap">{v.age || "—"}</td>
                    </> }
                    <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">{v.complaint || "—"}</td>
                    {tableExpanded && <>
                      <td className="py-3.5 pr-4 text-xs font-medium text-gray-700 whitespace-nowrap">{v.bp || <span className="text-gray-300">—</span>}</td>
                      <td className="py-3.5 pr-4 text-xs font-medium text-gray-700 whitespace-nowrap">{v.temp ? `${v.temp}°C` : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3.5 pr-4 text-xs font-medium text-gray-700 whitespace-nowrap">{v.pulse ? `${v.pulse} bpm` : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3.5 pr-4 text-xs font-medium text-gray-700 whitespace-nowrap">{v.spo2 ? `${v.spo2}%` : <span className="text-gray-300">—</span>}</td>
                      
                      {/* Interactive Treatment Field */}
                      <td 
                        className="py-3.5 pr-4 text-xs text-gray-500 max-w-[225px] cursor-pointer group/treatment"
                        title="Click to view full entry details"
                        onClick={() => onRowClick?.(v)}
                      >
                        <span className="line-clamp-2 group-hover/treatment:text-theme-500 group-hover/treatment:underline decoration-dashed transition-colors leading-relaxed">
                          {v.treatment || <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                    </>}
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-semibold ${DISP_CLASS[v.disposition] || "text-gray-500"}`}>
                        {v.disposition}
                      </span>
                    </td>
                    {tableExpanded && (
                      <td className="py-3.5 pr-4">
                        {attachments.length > 0 ? (
                          <button
                            className="flex items-center gap-1.5 text-xs text-theme-400 hover:text-theme-600 transition-colors font-medium"
                            title={attachments.map(a => a.name).join(", ")}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewAttachment(attachments);
                            }}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{attachments.length}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="py-3.5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditVisit(v); }}
                          className="p-1.5 text-gray-300 hover:text-theme-400 hover:bg-theme-50 rounded-md transition-colors"
                          title="Edit record"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteVisit(v); }}
                          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove record"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      {totalRecords > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Showing {startIdx + 1} to {endIdx} of {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      ? "bg-theme-500 text-white border border-theme-500"
                      : "border border-gray-200 text-gray-600 hover:bg-white"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Attachment Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          att={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}