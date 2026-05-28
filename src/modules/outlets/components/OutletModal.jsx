import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Tag } from 'lucide-react'

const emptyDiscount = () => ({ id: crypto.randomUUID(), name: '', value: '' })

export default function OutletModal({ outlet, onSave, onClose }) {
  const isEditing = !!outlet?.id

  const [name,      setName]      = useState('')
  const [address,   setAddress]   = useState('')
  const [status,    setStatus]    = useState('Active')
  const [discounts, setDiscounts] = useState([])
  const [errors,    setErrors]    = useState({})
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (outlet) {
      setName(outlet.name       ?? '')
      setAddress(outlet.address ?? '')
      setStatus(outlet.status   ?? 'Active')
      setDiscounts(outlet.discounts?.map((d) => ({ ...d })) ?? [])
    }
  }, [outlet])

  const addDiscount = () =>
    setDiscounts((prev) => [...prev, emptyDiscount()])

  const removeDiscount = (id) =>
    setDiscounts((prev) => prev.filter((d) => d.id !== id))

  const updateDiscount = (id, field, value) =>
    setDiscounts((prev) =>
      prev.map((d) => d.id === id ? { ...d, [field]: value } : d)
    )

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
    if (!validate()) return
    setSaving(true)
    const payload = {
      id:        outlet?.id ?? crypto.randomUUID(),
      name:      name.trim(),
      address:   address.trim(),
      status,
      discounts: discounts.map((d) => ({
        id:    d.id,
        name:  d.name.trim(),
        value: Number(d.value),
      })),
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Edit Outlet' : 'Add Outlet'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Outlet Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outlet Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
              placeholder="e.g. Main Branch – Makati"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                errors.name ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Ayala Ave, Makati City"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Discounts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Tag size={14} className="text-orange-500" />
                Discounts
              </label>
              <button
                onClick={addDiscount}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {discounts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                No discounts added yet. Click "Add" to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {discounts.map((d, i) => (
                  <div key={d.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        value={d.name}
                        onChange={(e) => updateDiscount(d.id, 'name', e.target.value)}
                        placeholder="Discount name"
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                          errors[`d_name_${i}`] ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {errors[`d_name_${i}`] && (
                        <p className="text-xs text-red-500 mt-0.5">{errors[`d_name_${i}`]}</p>
                      )}
                    </div>
                    <div className="w-24">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={d.value}
                          onChange={(e) => updateDiscount(d.id, 'value', e.target.value)}
                          placeholder="0"
                          className={`w-full border rounded-lg pl-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                            errors[`d_value_${i}`] ? 'border-red-400' : 'border-gray-200'
                          }`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                      </div>
                      {errors[`d_value_${i}`] && (
                        <p className="text-xs text-red-500 mt-0.5">{errors[`d_value_${i}`]}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeDiscount(d.id)}
                      className="mt-1 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Outlet'}
          </button>
        </div>
      </div>
    </div>
  )
}