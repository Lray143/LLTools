// src/modules/products/Products.jsx
import { useState } from 'react'
import { Search, Bell, User } from 'lucide-react'
import ProductsTable from './components/ProductsTable'

export default function Products() {
  const [search, setSearch] = useState('')

  return (
    <div className="bg-[#fcfcfc]" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search..."
              className="pl-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-gray-300"
              style={{ width: '14rem', height: '34px', fontSize: '13px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
            <Bell className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" style={{ width: '34px', height: '34px' }}>
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>      <ProductsTable search={search} onSearchChange={setSearch} />
    </div>
  )
}