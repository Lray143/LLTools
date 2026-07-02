import { useState, useEffect } from 'react'
import { ClipboardList, Paperclip, X } from 'lucide-react'
import { REPORT_TYPES, PRIORITIES } from './reportConstants'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Dialog, DialogContent, DialogTitle,
} from "../../../components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select"
import { toSentenceCase, toTitleCase } from "../../../lib/validation"

const emptyForm = () => ({
  report_type: REPORT_TYPES[0],
  subject: '',
  description: '',
  priority: 'Medium',
  branch: '',
  attachments: [],
  // Material Request
  itemName: '', quantity: '', unit: '', reason: '', neededBy: '',
  // Accident / Incident
  employeeInvolved: '', accidentDate: '', location: '', witnesses: '', severity: '', immediateAction: '',
  // Technical Issue
  affectedSystem: '', device: '', errorMessage: '', urgency: '',
})

export function ReportModal({ open, onClose, onSubmit, loading, editReport }) {
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      if (editReport) {
        setForm({
          ...emptyForm(),
          report_type: editReport.reportType,
          subject: editReport.subject,
          description: editReport.description,
          priority: editReport.priority,
          branch: editReport.branch,
          attachments: (editReport.attachmentPaths || []).map(p => ({ name: p.split(/[\\/]/).pop(), path: p })),
          ...(editReport.reportDetailsJson || {})
        })
      } else {
        setForm(emptyForm())
      }
      setError("")
    }
  }, [open, editReport])

  function handleAttach() {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async () => {
      const files = Array.from(input.files ?? [])
      const saved = []
      for (const f of files) {
        const buf = await f.arrayBuffer()
        const result = await window.electronAPI.saveAttachment({ name: f.name, buffer: Buffer.from(buf) })
        saved.push({ name: f.name, path: result.path })
      }
      setForm(prev => ({ ...prev, attachments: [...prev.attachments, ...saved] }))
    }
    input.click()
  }

  function removeAttachment(idx) {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))
  }

  function handleSubmit() {
    if (!form.subject.trim()) return
    // Build report_details_json based on type
    let reportDetailsJson = null
    if (form.report_type === 'Material Request') {
      reportDetailsJson = {
        itemName: form.itemName, quantity: form.quantity, unit: form.unit,
        reason: form.reason, neededBy: form.neededBy,
      }
    } else if (form.report_type === 'Accident / Incident') {
      reportDetailsJson = {
        employeeInvolved: form.employeeInvolved, accidentDate: form.accidentDate,
        location: form.location, witnesses: form.witnesses,
        severity: form.severity, immediateAction: form.immediateAction,
      }
    } else if (form.report_type === 'Technical Issue') {
      reportDetailsJson = {
        affectedSystem: form.affectedSystem, device: form.device,
        errorMessage: form.errorMessage, urgency: form.urgency,
      }
    }
    onSubmit({
      reportType: form.report_type,
      subject: form.subject,
      description: form.description,
      priority: form.priority,
      branch: form.branch,
      attachmentPaths: form.attachments.map(a => a.path),
      reportDetailsJson,
    })
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="outline-none focus:outline-none ring-0 focus:ring-0 border-0 p-0 flex flex-col overflow-hidden" style={{ width: '620px', maxWidth: '95vw', maxHeight: '90vh', background: 'var(--surface)', color: 'var(--text-primary)' }}>
        <div className="p-8 pb-4 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-hover)', border: '1px solid var(--theme-200)' }}>
              <ClipboardList size={20} style={{ color: 'var(--theme-500)' }} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                {editReport ? 'Edit Report' : 'Create New Report'}
              </DialogTitle>
              <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {editReport ? 'Update your report details below.' : 'Your report will be reviewed by an administrator.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Report Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Report Type</label>
              <Select value={form.report_type} onValueChange={val => set('report_type', val)}>
                <SelectTrigger className="w-full h-10 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  {REPORT_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject + Priority */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Subject *</label>
                <Input value={form.subject} onChange={e => set('subject', e.target.value)} onBlur={() => set('subject', toSentenceCase(form.subject))} placeholder="Brief subject..." className="text-sm h-10" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                <Select value={form.priority} onValueChange={val => set('priority', val)}>
                  <SelectTrigger className="w-full h-10 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p} value={p} className="cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Branch */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Branch <span className="font-normal opacity-70">(optional)</span>
              </label>
              <Input value={form.branch} onChange={e => set('branch', e.target.value)} onBlur={() => set('branch', toTitleCase(form.branch))} placeholder="e.g. Main Office, Warehouse A..." className="text-sm h-10" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Provide details about your report..." rows={3} className="w-full p-3 border rounded-lg text-sm outline-none resize-y" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            </div>

            {/* ── TYPE-SPECIFIC FIELDS ── */}
            {form.report_type === 'Material Request' && (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest m-0" style={{ color: 'var(--theme-500)' }}>Material Request Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Item Name</label><Input value={form.itemName} onChange={e => set('itemName', e.target.value)} onBlur={() => set('itemName', toTitleCase(form.itemName))} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Quantity</label><Input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} onBlur={() => set('quantity', Math.max(1, Number(form.quantity) || 1))} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Unit</label><Input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs, kg, etc." className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Needed By</label><Input type="date" value={form.neededBy} onChange={e => set('neededBy', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Reason</label><Input value={form.reason} onChange={e => set('reason', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                </div>
              </div>
            )}

            {form.report_type === 'Accident / Incident' && (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest m-0" style={{ color: '#dc2626' }}>Accident / Incident Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Employee Involved</label><Input value={form.employeeInvolved} onChange={e => set('employeeInvolved', e.target.value)} onBlur={() => set('employeeInvolved', toTitleCase(form.employeeInvolved))} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Date of Accident</label><Input type="date" value={form.accidentDate} onChange={e => set('accidentDate', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Location</label><Input value={form.location} onChange={e => set('location', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Witnesses</label><Input value={form.witnesses} onChange={e => set('witnesses', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Severity</label>
                    <Select value={form.severity} onValueChange={val => set('severity', val)}>
                      <SelectTrigger className="w-full h-9 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        {['Minor', 'Moderate', 'Severe', 'Critical'].map(s => <SelectItem key={s} value={s} className="cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Immediate Action Taken</label><Input value={form.immediateAction} onChange={e => set('immediateAction', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                </div>
              </div>
            )}

            {form.report_type === 'Technical Issue' && (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest m-0" style={{ color: '#7c3aed' }}>Technical Issue Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Affected System</label><Input value={form.affectedSystem} onChange={e => set('affectedSystem', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Device</label><Input value={form.device} onChange={e => set('device', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Error Message</label><Input value={form.errorMessage} onChange={e => set('errorMessage', e.target.value)} className="text-sm h-9" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Urgency</label>
                    <Select value={form.urgency} onValueChange={val => set('urgency', val)}>
                      <SelectTrigger className="w-full h-9 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        {['Low', 'Medium', 'High', 'Critical'].map(u => <SelectItem key={u} value={u} className="cursor-pointer text-sm" style={{ color: 'var(--text-primary)' }}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Attachments <span className="font-normal opacity-70">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {form.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border" style={{ background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <Paperclip size={12} />
                    <span className="max-w-[120px] truncate">{a.name}</span>
                    <button onClick={() => removeAttachment(i)} className="hover:text-red-500 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={handleAttach} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <Paperclip size={12} /> Add File
                </button>
              </div>
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
            <Button onClick={handleSubmit} disabled={loading} className="border-0 text-sm h-10 px-6 disabled:opacity-50 disabled:pointer-events-none transition-colors" style={{ background: 'var(--theme-500)', color: '#fff' }}>
              {loading ? 'Saving…' : (editReport ? 'Save Changes' : 'Submit Report')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
