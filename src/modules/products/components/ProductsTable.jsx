// src/modules/products/components/ProductsTable.jsx
import { useState, useMemo, useEffect, Fragment } from 'react'
import { Archive } from 'lucide-react'
import { INITIAL_GROUPS } from '../productData'

import ProductsToolbar        from './ProductsToolbar'
import GroupHeaderRow         from './GroupHeaderRow'
import ProductRow             from './ProductRow'
import AddGroupModal          from './AddGroupModal'
import ArchivedProductsDrawer from './ArchivedProductsDrawer'

const COLUMNS = [
  { label: '',                 width: '32px'                     },
  { label: 'Case Barcode',     width: '140px', align: 'left'     },
  { label: 'Item Barcode',     width: '140px', align: 'left'     },
  { label: 'Item Description', width: 'auto',  align: 'left'     },
  { label: 'QTY / Case',       width: '80px',  align: 'center'   },
  { label: 'Item Size',        width: '80px',  align: 'center'   },
  { label: 'Price / Piece',    width: '110px', align: 'right'    },
  { label: '',                 width: '40px'                     },
]

const makeBlankRow = () => ({
  id: crypto.randomUUID(),
  caseBarcode: '', itemBarcode: '', description: '',
  qty: '', size: '', price: '',
})

const matchesSearch = (row, term) => {
  const t = term.toLowerCase()
  return (
    row.description?.toLowerCase().includes(t) ||
    row.caseBarcode?.toLowerCase().includes(t)  ||
    row.itemBarcode?.toLowerCase().includes(t)
  )
}

export default function ProductsTable({ search = '', onSearchChange }) {
  const [groups,         setGroups]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [collapsed,      setCollapsed]      = useState({})
  const [showAddGroup,   setShowAddGroup]   = useState(false)
  const [editMode,       setEditMode]       = useState(false)
  const [selectedRows,   setSelectedRows]   = useState(new Set())
  const [showArchive,    setShowArchive]    = useState(false)
  const [archivedRows,   setArchivedRows]   = useState([])
  const [archiveLoading, setArchiveLoading] = useState(false)

  const [outlets,          setOutlets]          = useState([])
  const [selectedOutletId, setSelectedOutletId] = useState(null)
  const [outletPrices,     setOutletPrices]     = useState({})

  useEffect(() => {
    window.electronAPI.getProductGroups()
      .then((data) => setGroups(data?.length ? data : INITIAL_GROUPS))
      .catch(() => setGroups(INITIAL_GROUPS))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    window.electronAPI.getOutlets()
      .then((data) => setOutlets(data ?? []))
      .catch(() => setOutlets([]))
  }, [])

  useEffect(() => {
    if (!selectedOutletId) { setOutletPrices({}); return }
    window.electronAPI.getOutletProductPrices(selectedOutletId)
      .then((priceMap) => setOutletPrices(priceMap ?? {}))
      .catch(() => setOutletPrices({}))
  }, [selectedOutletId])

  useEffect(() => {
    if (!editMode) setSelectedRows(new Set())
  }, [editMode])

  useEffect(() => {
    if (!showArchive) return
    setArchiveLoading(true)
    window.electronAPI.getArchivedProducts()
      .then(setArchivedRows)
      .catch(() => setArchivedRows([]))
      .finally(() => setArchiveLoading(false))
  }, [showArchive])

  const totalItems  = groups.reduce((s, g) => s + g.rows.length, 0)
  const totalGroups = groups.length

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    return groups
      .map((g) => ({ ...g, rows: g.rows.filter((r) => matchesSearch(r, search)) }))
      .filter((g) => g.rows.length > 0)
  }, [groups, search])

  const allVisibleIds = useMemo(
    () => filteredGroups.flatMap((g) => g.rows.map((r) => r.id)),
    [filteredGroups]
  )
  const allSelected  = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedRows.has(id))
  const someSelected = selectedRows.size > 0
  const isOutletMode = !!selectedOutletId

  const handleToggleRow = (id) =>
    setSelectedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleToggleAll = () =>
    allSelected ? setSelectedRows(new Set()) : setSelectedRows(new Set(allVisibleIds))

  const removeFromGroups = (ids) => {
    const idSet = new Set(ids)
    setGroups((prev) =>
      prev.map((g) => ({ ...g, rows: g.rows.filter((r) => !idSet.has(r.id)) }))
    )
    setSelectedRows((prev) => { const n = new Set(prev); ids.forEach((id) => n.delete(id)); return n })
  }

  const handleBulkArchive = () => {
    if (!window.confirm(`Archive ${selectedRows.size} selected row${selectedRows.size !== 1 ? 's' : ''}? You can restore them from the Archive.`)) return
    selectedRows.forEach((id) => window.electronAPI.archiveProduct(id))
    removeFromGroups([...selectedRows])
  }

  const handleAddGroup = (name) => {
    const newGroup = { id: crypto.randomUUID(), name, rows: [] }
    window.electronAPI.upsertProductGroup({ id: newGroup.id, name, sortOrder: groups.length })
    setGroups((prev) => [...prev, newGroup])
  }

  const handleRenameGroup = (groupId, newName) => {
    const idx = groups.findIndex((g) => g.id === groupId)
    window.electronAPI.upsertProductGroup({ id: groupId, name: newName, sortOrder: idx })
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: newName } : g))
  }

  const handleDeleteGroup = (groupId) => {
    if (!window.confirm('Archive this entire group and all its rows? You can restore individual rows from the Archive.')) return
    window.electronAPI.deleteProductGroup(groupId)
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
  }

  const handleToggleCollapse = (groupId) =>
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }))

  const handleAddRow = (groupId) => {
    const newRow = makeBlankRow()
    window.electronAPI.upsertProduct({ ...newRow, groupId, sortOrder: 9999 })
    setGroups((prev) =>
      prev.map((g) => g.id === groupId ? { ...g, rows: [...g.rows, newRow] } : g)
    )
    setCollapsed((prev) => ({ ...prev, [groupId]: false }))
  }

  const handleUpdateCell = (groupId, rowId, field, value) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g
        return {
          ...g,
          rows: g.rows.map((r, i) => {
            if (r.id !== rowId) return r
            const updated = { ...r, [field]: value }
            window.electronAPI.upsertProduct({ ...updated, groupId, sortOrder: i })
            return updated
          }),
        }
      })
    )
  }

  const handleArchiveRow = (groupId, rowId) => {
    window.electronAPI.archiveProduct(rowId)
    removeFromGroups([rowId])
  }

  const handleUpdateOutletPrice = (productId, price) => {
    window.electronAPI.upsertOutletProductPrice(selectedOutletId, productId, price)
    setOutletPrices((prev) => ({ ...prev, [productId]: price }))
  }

  const handleResetOutletPrice = (productId) => {
    window.electronAPI.deleteOutletProductPrice(selectedOutletId, productId)
    setOutletPrices((prev) => { const next = { ...prev }; delete next[productId]; return next })
  }

  const handleSelectOutlet = (outletId) => {
    setSelectedOutletId(outletId || null)
    setEditMode(false)
  }

  const handleRestore = (id) => {
    window.electronAPI.restoreProduct(id)
    setArchivedRows((prev) => prev.filter((r) => r.id !== id))
    window.electronAPI.getProductGroups().then(setGroups).catch(() => {})
  }

  const handlePermanentDelete = (id) => {
    if (!window.confirm('Permanently delete this product? This cannot be undone.')) return
    window.electronAPI.permanentDeleteProduct(id)
    setArchivedRows((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
        Loading products…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Toolbar (mirrors BiometricHeader row) ── */}
      <ProductsToolbar
        search={search}
        onSearchChange={onSearchChange}
        hideSearch
        onAddGroup={() => setShowAddGroup(true)}
        totalItems={totalItems}
        totalGroups={totalGroups}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        onOpenArchive={() => setShowArchive(true)}
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelectOutlet={handleSelectOutlet}
      />

      {/* ── Bulk-action bar ── */}
      {editMode && someSelected && !isOutletMode && (
        <div style={{
          margin: '12px 32px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff8f2', border: '1px solid #fed7aa',
          borderRadius: '10px', padding: '8px 16px',
        }}>
          <span style={{ fontSize: '13px', color: '#c2410c', fontWeight: 500 }}>
            {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setSelectedRows(new Set())}
              style={{
                fontSize: '12px', color: '#6b7280', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: '7px',
                transition: 'background 100ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Clear selection
            </button>
            <button
              onClick={handleBulkArchive}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '12px', fontWeight: 600, color: '#fff',
                background: '#f97316', border: 'none', borderRadius: '7px',
                padding: '5px 12px', cursor: 'pointer',
              }}
            >
              <Archive size={12} />
              Archive selected
            </button>
          </div>
        </div>
      )}

      {/* ── Table area (mirrors BiometricTable container) ── */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable', padding: '16px 32px 24px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '14px',
          border: '1px solid #f0ebe3',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>

            {/* ── Header ── */}
            <thead>
              <tr style={{ background: '#f5f2ec', borderBottom: '1px solid #e8e2d8' }}>
                {/* Checkbox th */}
                <th style={{ width: '32px', padding: '10px 12px' }}>
                  {editMode && !isOutletMode && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      style={{ cursor: 'pointer', accentColor: '#f97316' }}
                    />
                  )}
                </th>
                {COLUMNS.slice(1).map((col, i) => (
                  <th
                    key={i}
                    style={{
                      width: col.width,
                      padding: '10px 12px',
                      textAlign: col.align ?? 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#f97316',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {col.label}
                    {col.label === 'Price / Piece' && isOutletMode && (
                      <span style={{ marginLeft: '4px', color: '#fb923c', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                        (outlet)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredGroups.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}
                  >
                    {search ? 'No products match your search.' : 'No products yet. Add a group to get started.'}
                  </td>
                </tr>
              )}

              {filteredGroups.map((group) => (
                <Fragment key={group.id}>
                  <GroupHeaderRow
                    group={group}
                    collapsed={!!collapsed[group.id]}
                    onToggleCollapse={handleToggleCollapse}
                    onRenameGroup={handleRenameGroup}
                    onAddRow={handleAddRow}
                    onDeleteGroup={handleDeleteGroup}
                    editMode={editMode && !isOutletMode}
                  />
                  {!collapsed[group.id] &&
                    group.rows.map((row, rowIndex) => (
                      <ProductRow
                        key={row.id}
                        row={row}
                        rowIndex={rowIndex}
                        groupId={group.id}
                        onUpdateCell={handleUpdateCell}
                        onDeleteRow={handleArchiveRow}
                        editMode={editMode}
                        selected={selectedRows.has(row.id)}
                        onToggleSelect={handleToggleRow}
                        isOutletMode={isOutletMode}
                        outletPrice={isOutletMode ? outletPrices[row.id] : undefined}
                        onUpdateOutletPrice={handleUpdateOutletPrice}
                        onResetOutletPrice={handleResetOutletPrice}
                      />
                    ))
                  }
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Footer hint ── */}
        <p style={{ fontSize: '11px', color: '#b0a090', textAlign: 'center', marginTop: '12px' }}>
          {isOutletMode && editMode
            ? 'Click the Price cell to set a custom outlet price · ↺ to reset to default'
            : isOutletMode
            ? 'Orange prices are outlet-specific overrides · enable Editing to change them'
            : editMode
            ? 'Click any cell to edit · Check rows to multi-select · Deleted rows go to Archive'
            : 'Toggle "Locked" to enable editing'}
        </p>
      </div>

      {showAddGroup && (
        <AddGroupModal onAdd={handleAddGroup} onClose={() => setShowAddGroup(false)} />
      )}

      {showArchive && (
        <ArchivedProductsDrawer
          rows={archivedRows}
          loading={archiveLoading}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onClose={() => setShowArchive(false)}
        />
      )}
    </div>
  )
}