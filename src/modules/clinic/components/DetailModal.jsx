import { useState } from "react"
import { DISP_CLASS } from "./clinicConstants"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog"
import { Paperclip, FileText, Image as ImageIcon, ExternalLink } from "lucide-react"
import FilePreviewModal, { resolveAttachment } from "./FilePreviewModal"

function getFileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return ImageIcon
  return FileText
}

export default function DetailModal({ visit, onClose }) {
  const [previewAtt, setPreviewAtt] = useState(null)

  async function handleOpenFile(att) {
    const result = await resolveAttachment(att)
    if (result.useModal) setPreviewAtt(result.att)
  }

  return (
    <>
      <style>{`
        .clinic-dialog-overlay {
          background-color: rgba(30, 30, 30, 0.6) !important;
          backdrop-filter: none !important;
        }
      `}</style>

      {/* In-app file preview — rendered outside the Dialog so it covers everything */}
      {previewAtt && (
        <FilePreviewModal
          att={previewAtt}
          onClose={() => setPreviewAtt(null)}
        />
      )}

      <Dialog open={!!visit} onOpenChange={val => { if (!val) onClose() }}>
        <DialogContent
          className="sm:max-w-md bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 [&>button]:hidden max-h-[90vh] overflow-y-auto"
          overlayClassName="clinic-dialog-overlay"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Visit Details</DialogTitle>
            {visit && <p className="text-xs text-gray-400 mt-0.5">{visit.date} · {visit.time}</p>}
          </DialogHeader>

          {visit && (
            <div className="space-y-5 py-2">

              {/* Employee header */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm flex-shrink-0">
                  {visit.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{visit.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[
                      visit.gender ? (visit.gender.charAt(0).toUpperCase() + visit.gender.slice(1)) : null,
                      visit.age ? `${visit.age} yrs` : null,
                    ].filter(Boolean).join(" · ") || "Employee"}
                  </p>
                </div>
                <span className={`ml-auto text-xs font-semibold ${DISP_CLASS[visit.disposition]}`}>
                  {visit.disposition}
                </span>
              </div>

              <div className="h-px bg-gray-50" />

              {/* Complaint */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Complaint / Reason</p>
                <p className="text-sm font-medium text-gray-800">{visit.complaint || "—"}</p>
              </div>

              {/* Vital Signs: 2x2 grid */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Vital Signs</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Blood Pressure</p>
                    <p className="text-sm font-semibold text-gray-800">{visit.bp || "—"}</p>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Temperature</p>
                    <p className="text-sm font-semibold text-gray-800">{visit.temp ? `${visit.temp} °C` : "—"}</p>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Pulse Rate</p>
                    <p className="text-sm font-semibold text-gray-800">{visit.pulse ? `${visit.pulse} bpm` : "—"}</p>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Oxygen Saturation</p>
                    <p className="text-sm font-semibold text-gray-800">{visit.spo2 ? `${visit.spo2}%` : "—"}</p>
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Treatment / Action Taken</p>
                <div className="bg-white rounded-xl px-4 py-3 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-all">{visit.treatment || "—"}</p>
                </div>
              </div>

              {/* Attachments */}
              {(visit.attachments ?? []).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Attachments</p>
                  <div className="flex flex-col gap-1.5">
                    {visit.attachments.map((att, idx) => {
                      const Icon = getFileIcon(att.name)
                      return (
                        <button
                          key={idx}
                          onClick={() => handleOpenFile(att)}
                          className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg hover:border-orange-300 transition-colors text-left w-full"
                        >
                          <Icon size={13} className="text-orange-400 flex-shrink-0" />
                          <span className="flex-1 text-xs text-gray-700 truncate font-medium">{att.name}</span>
                          <ExternalLink size={12} className="text-gray-300 flex-shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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