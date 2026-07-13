import React, { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "w-full",
  autoFocus = false,
  style = {}
}) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const handleClear = () => {
    if (onClear) onClear()
    else if (onChange) onChange({ target: { value: '' } })
    inputRef.current?.focus()
  }

  return (
    <div 
      className={`relative flex items-center transition-all duration-200 ${className}`}
      style={style}
    >
      <Search 
        size={14} 
        className={`absolute left-3 pointer-events-none transition-colors duration-200 ${isFocused ? 'text-theme-500' : 'text-gray-400'}`} 
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        className={`
          w-full pl-9 pr-8 py-1.5 
          bg-white border text-[13px]
          rounded-lg outline-none transition-all duration-200
          text-gray-800 placeholder:text-gray-400
          ${isFocused 
            ? 'border-theme-500 ring-2 ring-theme-500/20 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300 shadow-sm'}
        `}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
          title="Clear search"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
