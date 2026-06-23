import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog"
import { Button } from "./button"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

export function NotificationModal({ open, title, message, type = "info", onClose }) {
  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-sm bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 z-[300]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2 pb-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              type === 'success' ? 'bg-green-50' : 
              type === 'error' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              {type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            <DialogTitle className="text-center text-gray-900">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-gray-600 text-center px-2 pb-2 whitespace-pre-line">
          {message}
        </p>

        <DialogFooter className="flex justify-center sm:justify-center mt-2">
          <Button className="w-32 bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={onClose}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
