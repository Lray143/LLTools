import { useState, useEffect } from 'react'
import { Eye, EyeOff, Database, Cloud, Activity, Server, Users, Fingerprint, Megaphone, HeartPulse, Package, Store, ShoppingCart, FileText, MessageSquare, CalendarOff, ScrollText, AlertTriangle, Trash2 } from 'lucide-react'
import { SectionHeading, SettingRow } from './AppearanceSection'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { NotificationModal } from '../../../components/ui/NotificationModal'

const ROLE_LABELS = {
  admin:     'Administrator',
  hr:        'HR Department',
  clinic:    'Clinic Staff',
  inventory: 'Inventory',
  outlets:   'Outlets',
}

export function AccountSection({ currentUser }) {
  const roleLabel = ROLE_LABELS[currentUser?.role] ?? currentUser?.role ?? '—'
  const displayName = String(currentUser?.employeeName || currentUser?.username || '—')
  const initials  = displayName.slice(0, 2).toUpperCase()

  const [wipeModalOpen, setWipeModalOpen] = useState(false)
  const [wipePassword, setWipePassword] = useState('')
  const [wipeError, setWipeError] = useState('')
  const [isWiping, setIsWiping] = useState(false)
  const [selectedScopes, setSelectedScopes] = useState([])

  const [credModalOpen, setCredModalOpen] = useState(false)
  const [newUsername, setNewUsername] = useState(currentUser?.username || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [credError, setCredError] = useState('')
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false)
  const [notificationState, setNotificationState] = useState({ open: false, title: '', message: '', type: 'info' })
  const [systemUsage, setSystemUsage] = useState(null)

  useEffect(() => {
    if (currentUser?.username === 'admin@doublel.com') {
      window.electronAPI.getSystemUsage().then(setSystemUsage).catch(console.error)
      const timer = setInterval(() => {
        window.electronAPI.getSystemUsage().then(setSystemUsage).catch(console.error)
      }, 30000)
      return () => clearInterval(timer)
    }
  }, [currentUser?.username])

  async function handleUpdateCreds() {
    setCredError('')
    if (!newUsername.trim()) {
      setCredError('Username cannot be empty.')
      return
    }
    if (!oldPassword) {
      setCredError('Current password is required to make changes.')
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      setCredError('New passwords do not match.')
      return
    }

    setIsUpdatingCreds(true)
    try {
      const res = await window.electronAPI.updateUserCredentials(currentUser.id, newUsername.trim(), oldPassword, newPassword)
      if (!res.success) {
        setCredError(res.message || 'Failed to update credentials.')
        setIsUpdatingCreds(false)
        return
      }
      setCredModalOpen(false)
      setNotificationState({
        open: true,
        title: 'Credentials Updated',
        message: 'Credentials updated successfully. Please note your new credentials for your next login.',
        type: 'success'
      })
    } catch (err) {
      setCredError('An error occurred.')
    } finally {
      setIsUpdatingCreds(false)
    }
  }

  const WIPE_MODULES = [
    { key: 'all',          label: 'Everything',     desc: 'All records, users & files',        icon: Trash2,        danger: true  },
    { key: 'employees',    label: 'Employees',      desc: 'Employee records & attendance',     icon: Users,         danger: false },
    { key: 'biometrics',   label: 'Biometrics',     desc: 'Attendance logs only',              icon: Fingerprint,   danger: false },
    { key: 'announcements',label: 'Announcements',  desc: 'Posts, comments & reads',           icon: Megaphone,     danger: false },
    { key: 'clinic',       label: 'Clinic Log',     desc: 'All clinic visit records',          icon: HeartPulse,    danger: false },
    { key: 'products',     label: 'Products',       desc: 'Products, groups & outlet pricing', icon: Package,       danger: false },
    { key: 'outlets',      label: 'Outlets',        desc: 'Outlet records & product pricing',  icon: Store,         danger: false },
    { key: 'orders',       label: 'Orders',         desc: 'Saved & vanselling orders',         icon: ShoppingCart,  danger: false },
    { key: 'reports',      label: 'Reports',        desc: 'Reports, comments & status logs',   icon: FileText,      danger: false },
    { key: 'chats',        label: 'Chats',          desc: 'Messages & file attachments',       icon: MessageSquare, danger: false },
    { key: 'leave',        label: 'Leave Requests', desc: 'All leave request records',         icon: CalendarOff,   danger: false },
    { key: 'activity_logs',label: 'Activity Logs',  desc: 'Module audit history',              icon: ScrollText,    danger: false },
  ]

  const isAllSelected = selectedScopes.includes('all')
  const toggleScope = (key) => {
    if (key === 'all') {
      setSelectedScopes(isAllSelected ? [] : ['all'])
    } else {
      setSelectedScopes(prev => {
        const filtered = prev.filter(k => k !== 'all')
        return filtered.includes(key) ? filtered.filter(k => k !== key) : [...filtered, key]
      })
    }
  }

  async function handleWipe() {
    setWipeError('')
    if (selectedScopes.length === 0) {
      setWipeError('Please select at least one module to wipe.')
      return
    }
    if (!wipePassword) {
      setWipeError('Password is required.')
      return
    }
    setIsWiping(true)
    try {
      const res = await window.electronAPI.login({
        username: currentUser.username,
        password: wipePassword
      })
      if (!res.success) {
        setWipeError('Incorrect password.')
        setIsWiping(false)
        return
      }

      await window.electronAPI.wipeModuleData(selectedScopes)
      const isAll = selectedScopes.includes('all')
      setNotificationState({
        open: true,
        title: isAll ? 'Database Wiped' : 'Module Data Wiped',
        message: isAll
          ? 'Database completely wiped! Reloading app...'
          : `Selected data cleared successfully. Reloading app...`,
        type: 'info'
      })
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      console.error('[Wipe] Error:', err)
      setWipeError(err?.message || 'An unexpected error occurred. Check the console for details.')
      setIsWiping(false)
    }
  }

  return (
    <div>
      <SectionHeading
        title="Account"
        description="Your account information as configured by your administrator."
      />

      <div id="tour-settings-account-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        borderRadius: '14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        marginBottom: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--theme-500) 0%, var(--theme-600) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {displayName}
          </p>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {currentUser?.department ?? roleLabel}
          </p>
        </div>
        <div style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '99px',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 500 }}>Active</span>
        </div>
      </div>

      <SettingRow label="Employee Name" description="Your registered full name.">
        <InfoChip value={currentUser?.employeeName ?? '—'} />
      </SettingRow>

      <SettingRow label="Employee ID" description="Your unique company identification number.">
        <InfoChip value={currentUser?.employeeNo ?? currentUser?.employeeId ?? '—'} highlight />
      </SettingRow>

      <SettingRow label="Username" description="Your login username.">
        <InfoChip value={currentUser?.username ?? '—'} highlight />
      </SettingRow>

      <SettingRow label="Account Credentials" description="Update your login username or password.">
        <button
          id="tour-settings-creds"
          onClick={() => {
            setNewUsername(currentUser?.username || '')
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setCredError('')
            setCredModalOpen(true)
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--theme-500)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Change Credentials
        </button>
      </SettingRow>

      <Dialog open={credModalOpen} onOpenChange={setCredModalOpen}>
        <DialogContent className="p-6 max-w-[400px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <DialogHeader>
            <DialogTitle className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Update Credentials</DialogTitle>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Change your username or password. Leave password blank if you only want to change your username.
            </p>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>New Username</label>
              <Input
                placeholder="Enter new username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                onBlur={() => setNewUsername(u => u.trim())}
                className="text-sm h-10 mt-1"
                style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
              <div className="relative">
                <Input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Enter current password (required)"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="text-sm h-10 mt-1 pr-10"
                  style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none mt-0.5"
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Leave blank to keep current"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="text-sm h-10 mt-1 pr-10"
                  style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none mt-0.5"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="text-sm h-10 mt-1 pr-10"
                  style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none mt-0.5"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {credError && <p className="text-xs text-red-500 mt-1 font-medium">{credError}</p>}
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setCredModalOpen(false)} disabled={isUpdatingCreds} style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCreds} disabled={isUpdatingCreds} style={{ background: 'var(--theme-500)', color: '#fff' }} className="hover:opacity-90 font-medium border-none">
              {isUpdatingCreds ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingRow label="Department" description="Your designated department.">
        <InfoChip value={currentUser?.department ?? '—'} />
      </SettingRow>

      <SettingRow label="Position" description="Your current job title.">
        <InfoChip value={currentUser?.position ?? '—'} />
      </SettingRow>

      {currentUser?.username === 'admin@doublel.com' && (
        <>
          <SettingRow label="Wipe Test Data" description="Delete all records (employees, products, chats, etc.) to prepare for production use.">
            <button
              id="tour-settings-wipe"
              onClick={() => {
                setWipePassword('')
                setWipeError('')
                setWipeModalOpen(true)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Wipe Database
            </button>
          </SettingRow>

          <Dialog open={wipeModalOpen} onOpenChange={open => { setWipeModalOpen(open); if (!open) { setSelectedScopes([]); setWipePassword(''); setWipeError('') } }}>
            <DialogContent className="p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', maxWidth: 520, width: '95vw' }}>
              <DialogHeader>
                <DialogTitle className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Selective Data Wipe</DialogTitle>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Select the modules you want to clear. This <strong className="text-red-500">cannot be undone.</strong>
                </p>
              </DialogHeader>

              {/* Module grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {WIPE_MODULES.map(mod => {
                  const checked  = isAllSelected ? mod.key === 'all' : selectedScopes.includes(mod.key)
                  const disabled = isAllSelected && mod.key !== 'all'
                  const activeColor = mod.danger ? '#ef4444' : 'var(--theme-500)'
                  const ModIcon = mod.icon
                  return (
                    <button
                      key={mod.key}
                      onClick={() => toggleScope(mod.key)}
                      disabled={disabled}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${checked ? activeColor : 'var(--border)'}`,
                        background: checked
                          ? mod.danger ? 'rgba(239,68,68,0.06)' : 'var(--theme-50, rgba(var(--theme-500-rgb,245,158,11),0.06))'
                          : 'var(--page-bg-alt)',
                        cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                        opacity: disabled ? 0.4 : 1, transition: 'all 150ms',
                        gridColumn: mod.key === 'all' ? '1 / -1' : undefined,
                      }}
                    >
                      {/* Custom checkbox */}
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
                        border: `2px solid ${checked ? activeColor : 'var(--text-secondary)'}`,
                        background: checked ? activeColor : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms',
                      }}>
                        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      {/* Icon + text */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                        <ModIcon size={14} style={{ color: checked ? activeColor : 'var(--text-secondary)', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: checked ? activeColor : 'var(--text-primary)' }}>{mod.label}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{mod.desc}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Warning banner */}
              {selectedScopes.length > 0 && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: isAllSelected ? 'rgba(239,68,68,0.07)' : 'rgba(var(--theme-500-rgb,245,158,11),0.07)',
                  border: `1px solid ${isAllSelected ? 'rgba(239,68,68,0.25)' : 'var(--theme-200, rgba(245,158,11,0.3))'}`,
                  fontSize: 12.5,
                  color: isAllSelected ? '#dc2626' : 'var(--theme-600, #b45309)',
                  fontWeight: 500,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    {isAllSelected
                      ? 'This will wipe the entire database including all users and files.'
                      : `This will permanently delete data for: ${selectedScopes.map(k => WIPE_MODULES.find(m => m.key === k)?.label).join(', ')}.`
                    }
                  </span>
                </div>
              )}

              {/* Password */}
              <div className="mt-3 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={wipePassword}
                  onChange={e => setWipePassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleWipe()}
                  className="text-sm h-10 mt-1"
                  style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                {wipeError && <p className="text-xs text-red-500 mt-1 font-medium">{wipeError}</p>}
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button variant="outline" onClick={() => setWipeModalOpen(false)} disabled={isWiping} style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleWipe}
                  disabled={isWiping || selectedScopes.length === 0}
                  className="text-white font-medium border-none"
                  style={{ background: isAllSelected ? '#ef4444' : 'var(--theme-500)' }}
                >
                  {isWiping ? 'Wiping...' : isAllSelected ? 'Wipe Everything' : `Wipe ${selectedScopes.length} Module${selectedScopes.length > 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </>
      )}

      <NotificationModal 
        open={notificationState.open}
        title={notificationState.title}
        message={notificationState.message}
        type={notificationState.type}
        onClose={() => setNotificationState(prev => ({ ...prev, open: false }))}
      />
      </div>

        {currentUser?.username === 'admin@doublel.com' && (
          <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 16 }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
              padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Server size={16} style={{ color: 'var(--theme-500)' }} /> System Usage
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Database size={14} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Turso Database</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', paddingLeft: 20 }}>
                    {systemUsage ? systemUsage.turso.label : 'Loading...'}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Cloud size={14} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Cloudflare R2 Storage</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', paddingLeft: 20 }}>
                    {systemUsage ? systemUsage.r2.label : 'Loading...'}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Activity size={14} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Pusher Sockets</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', paddingLeft: 20 }}>
                    {systemUsage ? systemUsage.pusher.label : 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoChip({ value, highlight }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '7px 14px',
      borderRadius: '10px',
      background: highlight ? 'var(--page-bg-alt)' : 'var(--surface-hover)',
      border: `1px solid var(--border)`,
      fontSize: '13px',
      fontWeight: 500,
      color: highlight ? 'var(--accent-bg)' : 'var(--text-primary)',
    }}>
      {value}
    </div>
  )
}
