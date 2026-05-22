import { Calendar, Eye, Pencil, Trash2, Archive } from "lucide-react"
import { Button } from "../../../components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { DISP_CLASS, ALL_MONTHS } from "./clinicConstants"

export default function VisitsTable({
  visits,
  selectedMonth,
  setSelectedMonth,
  onViewVisit,
  onEditVisit,
  onDeleteVisit,
  onOpenArchive,
}) {
  const activeMonths   = ALL_MONTHS.filter(m => visits.some(v => v.month === m))
  const filteredVisits = selectedMonth === "All"
    ? visits
    : visits.filter(v => v.month === selectedMonth)

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

      <div className="px-6 pt-5 pb-0">
        {/* Single header row */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">

          {/* Left: title + record count */}
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-gray-900">Recent Clinic Visits</h2>
            <span className="text-xs text-gray-400">
              {filteredVisits.length} record{filteredVisits.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Right: month filter + archive */}
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 bg-white border-gray-200">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border border-gray-200">
                <SelectItem value="All" className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                  All months
                </SelectItem>
                {activeMonths.map(m => (
                  <SelectItem key={m} value={m} className="focus:bg-gray-50 focus:text-gray-900 cursor-pointer">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={onOpenArchive}
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </div>

      {/* Table body */}
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
              {filteredVisits.map((v, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 last:border-0 hover:bg-orange-50/40 transition-colors group"
                >
                  <td className="py-3 pr-3 text-sm text-gray-500 whitespace-nowrap">{v.date}</td>
                  <td className="py-3 pr-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{v.employee}</td>
                  <td className="py-3 pr-3 text-sm text-gray-600">{v.complaint}</td>
                  <td className="py-3 pr-3">
                    <span className={`text-xs font-medium ${DISP_CLASS[v.disposition]}`}>
                      {v.disposition}
                    </span>
                  </td>

                  {/* Action buttons – fade in on row hover */}
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onViewVisit(v)}
                        className="p-1 text-gray-300 hover:text-orange-400 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditVisit(v)}
                        className="p-1 text-gray-300 hover:text-orange-400 transition-colors"
                        title="Edit record"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteVisit(v)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                        title="Remove record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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