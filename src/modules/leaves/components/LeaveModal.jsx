import { useState, useEffect } from 'react'
import { CalendarClock, Calendar } from 'lucide-react'
import { LEAVE_TYPES, dayCount } from './leaveConstants'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select"
import { toSentenceCase } from "../../../lib/validation"

export function LeaveModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0], start_date: '', end_date: '', reason: '',
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setForm({
        leave_type: LEAVE_TYPES[0],
        start_date: "",
        end_date: "",
        reason: "",
      })
      setError("")
    }
  }, [open])

  async function handleSubmit() {
    if (!form.start_date || !form.end_date) {
      setError("Start Date and End Date are required.")
      return
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("End Date cannot be before Start Date.")
      return
    }
    setError("")
    onSubmit(form)
  }

  const days = dayCount(form.start_date, form.end_date)

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="outline-none focus:outline-none ring-0 focus:ring-0 border-0 p-0" style={{ width: '500px', maxWidth: '95vw', background: 'var(--surface)', color: 'var(--text-primary)' }}>
        <div className="p-8 pb-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-hover)', border: '1px solid var(--theme-200)' }}>
              <CalendarClock size={20} style={{ color: 'var(--theme-500)' }} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                File a Leave Request
              </DialogTitle>
              <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Your request will be reviewed by HR.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Leave Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Leave Type</label>
              <Select value={form.leave_type} onValueChange={val => setForm({ ...form, leave_type: val })}>
                <SelectTrigger className="w-full h-10 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  {LEAVE_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="text-sm h-10"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>End Date</label>
                <Input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="text-sm h-10"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Day count pill */}
            {form.start_date && form.end_date && (
              <div className="rounded-lg py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 w-fit" style={{ background: 'var(--surface-hover)', border: '1px solid var(--theme-200)', color: 'var(--theme-600)' }}>
                <Calendar size={14} />
                {days} day{days !== 1 ? 's' : ''} of leave
              </div>
            )}

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Reason <span className="font-normal opacity-70">(optional)</span>
              </label>
              <textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                onBlur={() => setForm(f => ({ ...f, reason: toSentenceCase(f.reason) }))}
                placeholder="Briefly explain the reason for your leave..."
                rows={3}
                className="w-full p-3 border rounded-lg text-sm outline-none resize-y"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex flex-col gap-2">
          {error && <div className="text-red-500 text-xs font-medium text-right w-full">{error}</div>}
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" className="text-sm h-10" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="border-0 text-sm h-10 px-6 disabled:opacity-50 transition-colors" style={{ background: 'var(--theme-500)', color: '#fff' }}>
              {loading ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
