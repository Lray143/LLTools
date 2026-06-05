// src/modules/products/Products.jsx
import { useState } from 'react'
import { Search, Bell, User } from 'lucide-react'
import ProductsTable from './components/ProductsTable'

export default function Products() {
  const [search, setSearch] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--page-bg)' }}>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Products</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              placeholder="Search..."
              className="pl-9 rounded-lg text-sm outline-none"
              style={{ width: '14rem', height: '34px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center rounded-lg transition-colors" style={{ width: '34px', height: '34px', color: 'var(--text-secondary)' }}>
            <Bell className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center rounded-lg transition-colors" style={{ width: '34px', height: '34px', color: 'var(--text-secondary)' }}>
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ProductsTable search={search} onSearchChange={setSearch} />
    </div>
  )
}