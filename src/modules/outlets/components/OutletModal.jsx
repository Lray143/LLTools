import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Tag, ChevronDown } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input }  from '../../../components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select'
import { DISCOUNT_PRESETS } from '../outletConstants'
import { toTitleCase } from '../../../lib/validation'

const emptyDiscount = (index) => ({ id: crypto.randomUUID(), name: `Discount ${index + 1}`, value: '' })

export default function OutletModal({ outlet, onSave, onClose, regions = [] }) {
  const isEditing = !!outlet?.id

  const [name,      setName]      = useState('')
  const [address,   setAddress]   = useState('')
  const [region,    setRegion]    = useState('')
  const [status,    setStatus]    = useState('Active')
  const [discounts, setDiscounts] = useState([])
  const [errors,    setErrors]    = useState({})
  const [shakeError, setShakeError] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const regionRef = useRef(null)

  useEffect(() => {
    if (outlet) {
      setName(outlet.name       ?? '')
      setAddress(outlet.address ?? '')
      setRegion(outlet.region   ?? '')
      setStatus(outlet.status   ?? 'Active')
      setDiscounts(outlet.discounts?.map(d => ({ ...d })) ?? [])
      setErrors({})
    }
  }, [outlet])

  // Close region dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (regionRef.current && !regionRef.current.contains(e.target)) {
        setRegionOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addDiscount    = () => setDiscounts(prev => [...prev, emptyDiscount(prev.length)])
  const removeDiscount = (id) => setDiscounts(prev => prev.filter(d => d.id !== id))
  const updateDiscount = (id, field, value) =>
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Outlet name is required.'
    discounts.forEach((d, i) => {
      if (!d.name.trim()) e[`d_name_${i}`] = 'Name required'
      if (d.value === '' || isNaN(Number(d.value)) || Number(d.value) < 0 || Number(d.value) > 100)
        e[`d_value_${i}`] = '0–100'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
      return
    }
    setSaving(true)
    const payload = {
      id:        outlet?.id ?? crypto.randomUUID(),
      name:      name.trim(),
      address:   address.trim(),
      region:    region || null,
      status,
      discounts: discounts.map(d => ({
        id:    d.id,
        name:  d.name.trim(),
        value: Number(d.value),
      })),
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <Dialog open={true} onOpenChange={val => { if (!val) onClose() }} modal={false}>
      <DialogContent 
        className="sm:max-w-lg bg-white outline-none focus:outline-none ring-0 focus:ring-0 border-0 max-h-[92vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-1">
          <DialogTitle className="text-gray-900 text-base font-semibold">
            {isEditing ? 'Edit Outlet' : 'Add Outlet'}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            {isEditing ? "Update the outlet's information below." : 'Fill in the details to add a new outlet.'}
          </p>
        </DialogHeader>

        <div id="tour-outlet-modal-form" className="flex flex-col gap-5 py-2">

          {/* ── SECTION: Basic Info ── */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">

              {/* Outlet Name — full width */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Outlet Name <span className={`text-red-400 ${shakeError ? 'shake' : ''}`}>*</span>
                </label>
                <Input
                  placeholder="e.g. Main Branch – Makati"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  onBlur={() => setName(n => toTitleCase(n))}
                  className={`bg-white text-sm h-9 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.name && <p className="text-xs text-red-500 -mt-0.5">{errors.name}</p>}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-white border-gray-200 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" className="z-[200] bg-white border border-gray-200" style={{ minWidth: 0, width: 'var(--radix-select-trigger-width)' }}>
                    {['Active', 'Inactive'].map(s => (
                      <SelectItem key={s} value={s} className="focus:bg-white focus:text-gray-900 cursor-pointer text-sm">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region — custom combobox */}
              <div className="flex flex-col gap-1.5" ref={regionRef}>
                <label className="text-xs font-medium text-gray-600">Region</label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Region I, NCR…"
                    value={region}
                    onChange={e => { setRegion(e.target.value); setRegionOpen(true) }}
                    onFocus={() => setRegionOpen(true)}
                    className="bg-white border-gray-200 text-sm h-9 pr-8"
                  />
                  {regions.length > 0 && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setRegionOpen(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronDown size={14} className={`transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {regionOpen && regions.length > 0 && (
                    <div className="absolute z-[210] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                      {regions
                        .filter(r => r.toLowerCase().includes(region.toLowerCase()))
                        .map(r => (
                          <button
                            key={r}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setRegion(r); setRegionOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-theme-50 hover:text-theme-700 ${
                              region === r ? 'bg-theme-50 text-theme-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {r}
                          </button>
                        ))
                      }
                      {regions.filter(r => r.toLowerCase().includes(region.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-400 italic">No matches — type to add new</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Address — full width */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Address</label>
                <Input
                  placeholder="e.g. 123 Ayala Ave, Makati City"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onBlur={() => setAddress(a => toTitleCase(a))}
                  className="bg-white border-gray-200 text-sm h-9"
                />
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="border-t border-gray-100" />

          {/* ── SECTION: Discounts ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag size={11} className="text-gray-400" />
                Discounts
              </p>
              <Button
                type="button"
                size="sm"
                onClick={addDiscount}
                className="h-7 text-xs px-3 bg-theme-500 hover:bg-theme-600 text-white border-0 gap-1"
              >
                <Plus size={11} /> Add
              </Button>
            </div>

            {discounts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                No discounts added yet. Click "Add" to create one.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {discounts.map((d, i) => (
                  <div key={d.id} className="flex gap-2 items-start">
                    <div className="flex-1 flex flex-col gap-0.5">
                      <Input
                        value={d.name}
                        onChange={e => updateDiscount(d.id, 'name', e.target.value)}
                        onBlur={() => updateDiscount(d.id, 'name', toTitleCase(d.name))}
                        placeholder="Discount name (e.g. Senior Citizen)"
                        className={`bg-white text-sm h-9 ${errors[`d_name_${i}`] ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {errors[`d_name_${i}`] && <p className="text-xs text-red-500">{errors[`d_name_${i}`]}</p>}
                    </div>
                    <div className="w-24 flex flex-col gap-0.5">
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={d.value}
                          onChange={e => updateDiscount(d.id, 'value', e.target.value)}
                          placeholder="0"
                          className={`bg-white text-sm h-9 pr-6 ${errors[`d_value_${i}`] ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">%</span>
                      </div>
                      {errors[`d_value_${i}`] && <p className="text-xs text-red-500">{errors[`d_value_${i}`]}</p>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                      onClick={() => removeDiscount(d.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-white text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-theme-500 hover:bg-theme-600 text-white border-0 text-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Outlet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}