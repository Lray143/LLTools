import { Calendar, Eye } from "lucide-react"
import { DISP_CLASS, ALL_MONTHS, RECENT_VISITS } from "./clinicConstants"

export default function VisitsTable({ selectedMonth, setSelectedMonth, onViewVisit }) {
  const activeMonths = ALL_MONTHS.filter(m => RECENT_VISITS.some(v => v.month === m))
  const filteredVisits = selectedMonth === "All"
    ? RECENT_VISITS
    : RECENT_VISITS.filter(v => v.month === selectedMonth)

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Recent Clinic Visits</h2>
          <span className="text-xs text-gray-400">{filteredVisits.length} record{filteredVisits.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-orange-400 cursor-pointer transition-colors appearance-none pr-6"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
          >
            <option value="All">All months</option>
            {activeMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2">
        {filteredVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No visits in {selectedMonth}</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                {["Date", "Employee", "Complaint", "Disposition", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 border-b border-gray-100 pr-3 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((v, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/40 transition-colors group">
                  <td className="py-3 pr-3 text-sm text-gray-500 whitespace-nowrap">{v.date}</td>
                  <td className="py-3 pr-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{v.employee}</td>
                  <td className="py-3 pr-3 text-sm text-gray-600">{v.complaint}</td>
                  <td className="py-3 pr-3">
                    <span className={`text-xs font-medium ${DISP_CLASS[v.disposition]}`}>
                      {v.disposition}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onViewVisit(v)}
                      className="text-gray-300 hover:text-orange-400 transition-colors"
                      title="View full details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}