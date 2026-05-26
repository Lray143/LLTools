// src/modules/products/components/AddGroupModal.jsx
import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function AddGroupModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-1">Add Group Header</h2>
        <p className="text-sm text-gray-500 mb-5">
          Group headers separate product categories (e.g. ASTRINGENTS, SOAPS).
        </p>

        <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
          Group Name
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. TONERS"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800
                     focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                     placeholder:text-gray-300"
        />

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600
                       hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium
                       hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Group
          </button>
        </div>
      </div>
    </div>
  )
}