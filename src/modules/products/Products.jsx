// src/modules/products/Products.jsx
import { useState } from 'react'
import { User, Package } from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'
import ModuleActivityLog from '../../components/ui/ModuleActivityLog'
import SearchBar from '../../components/ui/SearchBar'
import ProductsTable from './components/ProductsTable'

export default function Products({ refreshKey = 0, currentUser, onNavigate }) {
  const [search, setSearch] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--page-bg)' }}>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(var(--theme-500-rgb,99,102,241),0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={18} style={{ color: 'var(--theme-500)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>Products</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Product list &amp; catalog management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ width: '14rem' }}>
            <SearchBar
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ModuleActivityLog module="products" refreshKey={refreshKey} />
          <NotificationBell currentUser={currentUser} refreshKey={refreshKey} onNavigate={onNavigate} />
        </div>
      </div>
      <ProductsTable search={search} onSearchChange={setSearch} refreshKey={refreshKey} currentUser={currentUser} />
    </div>
  )
}