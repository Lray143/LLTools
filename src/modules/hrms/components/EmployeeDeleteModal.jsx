import { Trash2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog"

export function EmployeeDeleteModal({ open, employee, onConfirm, onClose }) {
  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-sm bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2 pb-1">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <DialogTitle className="text-center text-gray-900">Remove Employee</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-gray-500 text-center px-2 pb-2">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-gray-800">{employee?.name}</span>?
          They will be moved to the archive and can be restored later.
        </p>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0" onClick={onConfirm}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}