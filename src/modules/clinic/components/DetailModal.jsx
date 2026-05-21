import { DISP_CLASS } from "./clinicConstants"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog"

export default function DetailModal({ visit, onClose }) {
  return (
    <>
      <style>{`
        .clinic-dialog-overlay {
          background-color: rgba(30, 30, 30, 0.6) !important;
          backdrop-filter: none !important;
        }
      `}</style>
      <Dialog open={!!visit} onOpenChange={val => { if (!val) onClose() }}>
        <DialogContent
          className="sm:max-w-md bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 [&>button]:hidden"
          overlayClassName="clinic-dialog-overlay"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Visit Details</DialogTitle>
            {visit && <p className="text-xs text-gray-400 mt-0.5">{visit.date} · {visit.time}</p>}
          </DialogHeader>

          {visit && (
            <div className="space-y-6 py-2">

              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm flex-shrink-0">
                  {visit.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{visit.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Employee</p>
                </div>
                <span className={`ml-auto text-xs font-semibold ${DISP_CLASS[visit.disposition]}`}>
                  {visit.disposition}
                </span>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-800">{visit.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Time</p>
                  <p className="text-sm font-medium text-gray-800">{visit.time}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Complaint / Reason</p>
                <p className="text-sm font-medium text-gray-800">{visit.complaint}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Vital Signs</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Blood Pressure</p>
                    <p className="text-sm font-semibold text-gray-800">{visit.bp}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Temperature</p>
                    <p className="text-sm font-semibold text-gray-800">{visit.temp} °C</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Treatment / Action Taken</p>
                <p className="text-sm text-gray-600 leading-relaxed">{visit.treatment}</p>
              </div>

            </div>
          )}

          <DialogFooter>
            <Button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}