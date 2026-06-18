// src/modules/products/components/ProductsTable.jsx
import { useState, useMemo, useEffect, Fragment, useRef } from 'react'
import { Archive } from 'lucide-react'
import { INITIAL_GROUPS } from '../productData'
import {
  logModuleActivity,
  logFieldEditDebounced,
  buildActivityDetails,
  snapshotFromFields,
  emptyDisplay,
  PRODUCT_ROW_FIELDS,
} from '../../../lib/activityLog'

const PRODUCT_CELL_LABELS = {
  productNo: 'No#',
  caseBarcode: 'Case barcode',
  itemBarcode: 'Item barcode',
  description: 'Description',
  qty: 'QTY / case',
  size: 'Item size',
  price: 'Price',
}

import ProductsToolbar        from './ProductsToolbar'
import GroupHeaderRow         from './GroupHeaderRow'
import ProductRow             from './ProductRow'
import AddGroupModal          from './AddGroupModal'
import ArchivedProductsDrawer from './ArchivedProductsDrawer'

const COLUMNS = [
  { label: '',                 width: '32px'                     },
  { label: 'No#',              width: '80px',  align: 'left'     },
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
  productNo: '', caseBarcode: '', itemBarcode: '', description: '',
  qty: '', size: '', price: '',
})

const matchesSearch = (row, term) => {
  const t = term.toLowerCase()
  return (
    row.productNo?.toLowerCase().includes(t) ||
    row.description?.toLowerCase().includes(t) ||
    row.caseBarcode?.toLowerCase().includes(t)  ||
    row.itemBarcode?.toLowerCase().includes(t)
  )
}

export default function ProductsTable({ search = '', onSearchChange, refreshKey = 0, currentUser = null }) {
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
  const newRowIdsRef = useRef(new Set())

  useEffect(() => {
    window.electronAPI.getProductGroups()
      .then((data) => {
        const newGroups = data?.length ? data : INITIAL_GROUPS
        setGroups(prev => JSON.stringify(prev) === JSON.stringify(newGroups) ? prev : newGroups)
      })
      .catch(() => setGroups(INITIAL_GROUPS))
      .finally(() => setLoading(false))
  }, [refreshKey])

  useEffect(() => {
    window.electronAPI.getOutlets()
      .then((data) => setOutlets(data ?? []))
      .catch(() => setOutlets([]))
  }, [refreshKey])

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
    const ids = [...selectedRows]
    ids.forEach((id) => window.electronAPI.archiveProduct(id))
    removeFromGroups(ids)
    if (currentUser) {
      const names = ids.map(id => {
        const row = groups.flatMap(g => g.rows).find(r => r.id === id)
        return row?.description?.trim() || id
      })
      logModuleActivity(currentUser, 'products', 'archive', `${ids.length} product${ids.length !== 1 ? 's' : ''}`, null, buildActivityDetails({
        recordType: 'Product',
        table: 'products',
        note: `Bulk archive: ${names.join(', ')}`,
      }))
    }
  }

  const handleAddGroup = (name) => {
    const newGroup = { id: crypto.randomUUID(), name, rows: [] }
    window.electronAPI.upsertProductGroup({ id: newGroup.id, name, sortOrder: groups.length })
    setGroups((prev) => [...prev, newGroup])
    if (currentUser) {
      logModuleActivity(currentUser, 'products', 'add', `Group: ${name}`, newGroup.id, buildActivityDetails({
        recordType: 'Product group',
        recordId: newGroup.id,
        table: 'product_groups',
        snapshot: { 'Group name': name },
      }))
    }
  }

  const handleRenameGroup = (groupId, newName) => {
    const idx = groups.findIndex((g) => g.id === groupId)
    const oldName = groups[idx]?.name ?? '—'
    window.electronAPI.upsertProductGroup({ id: groupId, name: newName, sortOrder: idx })
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: newName } : g))
    if (currentUser) {
      logModuleActivity(currentUser, 'products', 'edit', `Group: ${newName}`, groupId, buildActivityDetails({
        recordType: 'Product group',
        recordId: groupId,
        table: 'product_groups',
        changes: [{ field: 'name', label: 'Group name', before: oldName, after: newName }],
      }))
    }
  }

  const handleDeleteGroup = (groupId) => {
    if (!window.confirm('Archive this entire group and all its rows? You can restore individual rows from the Archive.')) return
    const group = groups.find(g => g.id === groupId)
    window.electronAPI.deleteProductGroup(groupId)
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    if (currentUser) {
      const rowNames = (group?.rows ?? []).map(r => r.description?.trim() || r.id).join(', ')
      logModuleActivity(currentUser, 'products', 'archive', `Group: ${group?.name ?? 'Unknown'}`, groupId, buildActivityDetails({
        recordType: 'Product group',
        recordId: groupId,
        table: 'product_groups',
        removedSnapshot: {
          'Group name': group?.name ?? '—',
          'Products in group': rowNames || 'None',
        },
        note: 'Archived group and all active rows inside it',
      }))
    }
  }

  const handleToggleCollapse = (groupId) =>
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }))

  const handleAddRow = (groupId) => {
    const newRow = makeBlankRow()
    newRowIdsRef.current.add(newRow.id)
    window.electronAPI.upsertProduct({ ...newRow, groupId, sortOrder: 9999 })
    setGroups((prev) =>
      prev.map((g) => g.id === groupId ? { ...g, rows: [...g.rows, newRow] } : g)
    )
    setCollapsed((prev) => ({ ...prev, [groupId]: false }))
  }

  const handleUpdateCell = (groupId, rowId, field, value) => {
    const group = groups.find(g => g.id === groupId)
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g
        return {
          ...g,
          rows: g.rows.map((r, i) => {
            if (r.id !== rowId) return r
            const beforeVal = r[field]
            const updated = { ...r, [field]: value }
            window.electronAPI.upsertProduct({ ...updated, groupId, sortOrder: i })

            const isNewRow = newRowIdsRef.current.has(rowId)
            const descriptionFilled = field === 'description' && String(value).trim() !== ''
            if (currentUser && isNewRow && descriptionFilled) {
              const label = updated.description?.trim() || updated.itemBarcode?.trim() || 'Product'
              logModuleActivity(currentUser, 'products', 'add', label, rowId, buildActivityDetails({
                recordType: 'Product',
                recordId: rowId,
                table: 'products',
                snapshot: snapshotFromFields(updated, PRODUCT_ROW_FIELDS),
                note: group ? `Group: ${group.name}` : null,
              }))
              newRowIdsRef.current.delete(rowId)
            } else if (currentUser && !isNewRow) {
              const label = updated.description?.trim() || updated.itemBarcode?.trim() || 'Product'
              logFieldEditDebounced(currentUser, 'products', label, rowId, {
                field,
                label: PRODUCT_CELL_LABELS[field] || field,
                before: emptyDisplay(beforeVal),
                after: emptyDisplay(value),
              }, {
                recordType: 'Product',
                table: 'products',
                note: group ? `Group: ${group.name}` : null,
              })
            }

            return updated
          }),
        }
      })
    )
  }

  const handleArchiveRow = (groupId, rowId) => {
    const group = groups.find(g => g.id === groupId)
    const row = group?.rows.find(r => r.id === rowId)
    window.electronAPI.archiveProduct(rowId)
    removeFromGroups([rowId])
    if (currentUser && row) {
      logModuleActivity(currentUser, 'products', 'archive', row.description?.trim() || 'Product', rowId, buildActivityDetails({
        recordType: 'Product',
        recordId: rowId,
        table: 'products',
        removedSnapshot: snapshotFromFields(row, PRODUCT_ROW_FIELDS),
        note: group ? `Group: ${group.name}` : null,
      }))
    }
  }

  const handleUpdateOutletPrice = (productId, price) => {
    const outlet = outlets.find(o => o.id === selectedOutletId)
    const row = groups.flatMap(g => g.rows).find(r => r.id === productId)
    const beforePrice = outletPrices[productId] ?? row?.price ?? '—'
    window.electronAPI.upsertOutletProductPrice(selectedOutletId, productId, price)
    setOutletPrices((prev) => ({ ...prev, [productId]: price }))
    if (currentUser) {
      const label = row?.description?.trim() || 'Product'
      logFieldEditDebounced(currentUser, 'products', label, productId, {
        field: 'outletPrice',
        label: `Outlet price (${outlet?.name ?? 'outlet'})`,
        before: emptyDisplay(beforePrice),
        after: emptyDisplay(price),
      }, {
        recordType: 'Product',
        table: 'outlet_product_prices',
        note: `Default price: ${emptyDisplay(row?.price)}`,
      })
    }
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
    const row = archivedRows.find(r => r.id === id)
    window.electronAPI.permanentDeleteProduct(id)
    setArchivedRows((prev) => prev.filter((r) => r.id !== id))
    if (currentUser && row) {
      logModuleActivity(currentUser, 'products', 'permanent_delete', row.description?.trim() || 'Product', id, buildActivityDetails({
        recordType: 'Product',
        recordId: id,
        table: 'products',
        removedSnapshot: {
          Description: row.description ?? '—',
          'Case barcode': row.caseBarcode ?? '—',
          'Item barcode': row.itemBarcode ?? '—',
          'QTY / case': row.qty ?? '—',
          'Item size': row.size ?? '—',
          Price: row.price ?? '—',
          Group: row.groupName ?? '—',
        },
        note: 'Permanently deleted from archive',
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Loading products…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">

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
        <div className="mx-8 mt-3 flex items-center justify-between rounded-lg px-4 py-2" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-bg) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent-bg) 30%, var(--border))' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--accent-bg)' }}>
            {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-xs text-gray-500 bg-transparent border-none cursor-pointer px-2.5 py-1.5 rounded-md transition-colors hover:bg-white"
            >
              Clear selection
            </button>
            <button
              onClick={handleBulkArchive}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white border-none rounded-md px-3 py-1.5 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-bg)'}
            >
              <Archive size={12} />
              Archive selected
            </button>
          </div>
        </div>
      )}

      {/* ── Table area (mirrors BiometricTable container) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 pt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm border-collapse">

            {/* ── Header ── */}
            <thead className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <tr>
                {/* Checkbox th */}
                <th className="px-3 py-3 w-8">
                  {editMode && !isOutletMode && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="cursor-pointer"
                      style={{ accentColor: 'var(--accent-bg)' }}
                    />
                  )}
                </th>
                {COLUMNS.slice(1).map((col, i) => (
                  <th
                    key={i}
                    className={`px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide
                                ${col.align === 'right'  ? 'text-right'  : ''}
                                ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                    style={{ width: col.width }}
                  >
                    {col.label}
                    {col.label === 'Price / Piece' && isOutletMode && (
                      <span className="ml-1 font-normal normal-case tracking-normal" style={{ color: 'var(--accent-bg)', opacity: 0.8 }}>
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
                  <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
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
        <p className="text-xs text-gray-400 mt-3 text-center">
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