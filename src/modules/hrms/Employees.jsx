import { useState, useEffect } from "react"
import { Bell, Plus, Search, User, Archive, Loader2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"

// Supabase client — all DB operations go through this
import { supabase } from '../../lib/supabase'

// DEPTS still comes from constants — seedEmployees is no longer needed
import { DEPTS }             from "./employeeConstants"
import { EmployeeCardGrid }  from "./components/EmployeeCardGrid"
import { EmployeeListView }  from "./components/EmployeeListView"
import { EmployeeModal }     from "./components/EmployeeModal"
import { EmployeeDeleteModal }  from "./components/EmployeeDeleteModal"
import { EmployeeArchiveModal } from "./components/EmployeeArchiveModal"

// ─────────────────────────────────────────────────────────────
// transformFromDB(row)
//
// Converts a Supabase row into the shape your components expect.
// Supabase uses: id (uuid), employee_no, department, position
// Components use: id ("EMP-001"), dept, role
//
// Call this on every row that comes FROM Supabase before
// putting it into state.
// ─────────────────────────────────────────────────────────────
function transformFromDB(row) {
  return {
    ...row,
    id:   row.employee_no,   // components use "EMP-001" format as the display id
    _id:  row.id,            // keep the real uuid as _id for DB operations
    dept: row.department,
    role: row.position,
  }
}

// ─────────────────────────────────────────────────────────────
// transformToDB(form)
//
// Converts the form data from EmployeeModal into the shape
// Supabase expects before inserting or updating.
// ─────────────────────────────────────────────────────────────
function transformToDB(form) {
  return {
    employee_no: form.id,          // "EMP-001" stored as employee_no
    name:        form.name,
    department:  form.dept,
    position:    form.role,
    contact:     form.contact  || null,
    status:      form.status   || "Active",
  }
}

function Employees() {

  // ── STATE ──────────────────────────────────────────────────
  const [employees, setEmployees] = useState([])    // active employees from Supabase
  const [archived,  setArchived]  = useState([])    // archived employees from Supabase
  const [loading,   setLoading]   = useState(true)  // shows spinner while fetching
  const [error,     setError]     = useState(null)  // shows error message if fetch fails
  const [view,      setView]      = useState("cards")
  const [search,    setSearch]    = useState("")
  const [dept,      setDept]      = useState("all")
  const [modal,     setModal]     = useState(null)

  // ── LOAD DATA ON MOUNT ────────────────────────────────────
  // useEffect with [] runs once when the component first loads.
  // Fetches active and archived employees separately from Supabase.
  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    setLoading(true)
    setError(null)

    // Fetch active employees (status != 'Archived')
    const { data: activeData, error: activeError } = await supabase
      .from('employees')
      .select('*')
      .neq('status', 'Archived')          // neq = not equal
      .order('created_at', { ascending: false })

    // Fetch archived employees separately
    const { data: archivedData, error: archivedError } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'Archived')           // eq = equals
      .order('created_at', { ascending: false })

    if (activeError || archivedError) {
      console.error('Error loading employees:', activeError || archivedError)
      setError('Failed to load employees. Check your connection.')
      setLoading(false)
      return
    }

    // Transform each row to match the shape components expect
    setEmployees((activeData  || []).map(transformFromDB))
    setArchived ((archivedData || []).map(transformFromDB))
    setLoading(false)
  }

  // ── NEXT ID HELPER ─────────────────────────────────────────
  // Generates the next employee_no based on the highest existing one.
  // Looks at both active and archived to avoid duplicates.
  // e.g. if highest is EMP-006, returns EMP-007
  function nextEmployeeNo() {
    const all  = [...employees, ...archived]
    const nums = all
      .map(e => parseInt((e.id || "EMP-000").split("-")[1]))
      .filter(n => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return `EMP-${String(max + 1).padStart(3, "0")}`
  }

  // ── HANDLE SAVE (Add or Edit) ─────────────────────────────
  // Called when EmployeeModal submits the form.
  // Inserts a new row or updates an existing one in Supabase,
  // then refreshes the local state to show the latest data.
  async function handleSave(form) {
    if (modal.mode === "add") {
      // ── INSERT new employee ──────────────────────────────
      const { data, error } = await supabase
        .from('employees')
        .insert([transformToDB({ ...form, id: nextEmployeeNo() })])
        .select()   // .select() returns the inserted row so we can add it to state

      if (error) {
        console.error('Error adding employee:', error)
        alert('Failed to add employee. Please try again.')
        return
      }

      // Add the new employee to local state immediately (no need to refetch)
      setEmployees(prev => [transformFromDB(data[0]), ...prev])

    } else {
      // ── UPDATE existing employee ─────────────────────────
      // Use _id (the real uuid) for the WHERE clause, not the display id
      const { data, error } = await supabase
        .from('employees')
        .update(transformToDB({ ...form, id: modal.employee.id }))
        .eq('id', modal.employee._id)   // _id is the real Supabase uuid
        .select()

      if (error) {
        console.error('Error updating employee:', error)
        alert('Failed to update employee. Please try again.')
        return
      }

      // Replace the old employee in local state with the updated one
      setEmployees(prev =>
        prev.map(e => e._id === modal.employee._id ? transformFromDB(data[0]) : e)
      )
    }

    setModal(null)
  }

  // ── HANDLE DELETE (Archive) ───────────────────────────────
  // "Delete" in this app means archiving — sets status to 'Archived'
  // so the data is never permanently lost.
  async function handleDelete() {
    const { data, error } = await supabase
      .from('employees')
      .update({ status: 'Archived' })
      .eq('id', modal.employee._id)
      .select()

    if (error) {
      console.error('Error archiving employee:', error)
      alert('Failed to archive employee. Please try again.')
      return
    }

    // Move from active list to archived list in local state
    const archived = transformFromDB(data[0])
    setArchived(prev => [archived, ...prev])
    setEmployees(prev => prev.filter(e => e._id !== modal.employee._id))
    setModal(null)
  }

  // ── HANDLE UNARCHIVE ──────────────────────────────────────
  // Restores an archived employee back to Active status.
  async function handleUnarchive(emp) {
    const { data, error } = await supabase
      .from('employees')
      .update({ status: 'Active' })
      .eq('id', emp._id)
      .select()

    if (error) {
      console.error('Error unarchiving employee:', error)
      alert('Failed to restore employee. Please try again.')
      return
    }

    // Move from archived list back to active list in local state
    const restored = transformFromDB(data[0])
    setEmployees(prev => [restored, ...prev])
    setArchived(prev => prev.filter(e => e._id !== emp._id))
  }

  // ── DERIVED — filtered list ────────────────────────────────
  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchDept   = dept === "all" || e.dept === dept
    return matchSearch && matchDept
  })

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full bg-white">
      <style>{`[role="dialog"]{outline:none!important;box-shadow:0 4px 24px rgba(0,0,0,0.12)!important;}`}</style>

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              className="pl-9 w-56 bg-white border-gray-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-44 bg-white border-gray-200">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Departments</SelectItem>
              {DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
            <button
              onClick={() => setView("cards")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                view === "cards" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                view === "list" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-1"
            onClick={() => setModal({ mode: "archive" })}
          >
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button
            onClick={() => setModal({ mode: "add" })}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-8 pb-8">

        {/* Loading spinner — shown while fetching from Supabase */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading employees...</span>
          </div>
        )}

        {/* Error state — shown if Supabase fetch fails */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <p className="text-lg font-medium">Failed to load employees</p>
            <p className="text-sm mb-4">{error}</p>
            {/* Retry button — calls loadEmployees again */}
            <Button variant="outline" onClick={loadEmployees}>
              Try again
            </Button>
          </div>
        )}

        {/* Employee list — shown when not loading and no error */}
        {!loading && !error && (
          <>
            {view === "cards"
              ? <EmployeeCardGrid
                  employees={filtered}
                  onEdit={e   => setModal({ mode: "edit",   employee: e })}
                  onDelete={e => setModal({ mode: "delete", employee: e })}
                />
              : <EmployeeListView
                  employees={filtered}
                  onEdit={e   => setModal({ mode: "edit",   employee: e })}
                  onDelete={e => setModal({ mode: "delete", employee: e })}
                />
            }

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-lg font-medium">No employees found</p>
                <p className="text-sm">Try adjusting your search or filter</p>
              </div>
            )}
          </>
        )}

      </div>

      {/* MODALS */}
      <EmployeeModal
        open={modal?.mode === "add" || modal?.mode === "edit"}
        mode={modal?.mode}
        employee={modal?.employee}
        onSave={handleSave}
        onClose={() => setModal(null)}
      />
      <EmployeeDeleteModal
        open={modal?.mode === "delete"}
        employee={modal?.employee}
        onConfirm={handleDelete}
        onClose={() => setModal(null)}
      />
      <EmployeeArchiveModal
        open={modal?.mode === "archive"}
        archived={archived}
        onUnarchive={handleUnarchive}
        onClose={() => setModal(null)}
      />

    </div>
  )
}

export default Employees