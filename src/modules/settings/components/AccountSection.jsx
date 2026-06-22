import { useState } from 'react'
import { SectionHeading, SettingRow } from './AppearanceSection'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

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

  const [credModalOpen, setCredModalOpen] = useState(false)
  const [newUsername, setNewUsername] = useState(currentUser?.username || '')
  const [newPassword, setNewPassword] = useState('')
  const [credError, setCredError] = useState('')
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false)

  async function handleUpdateCreds() {
    setCredError('')
    if (!newUsername.trim()) {
      setCredError('Username cannot be empty.')
      return
    }
    setIsUpdatingCreds(true)
    try {
      const res = await window.electronAPI.updateUserCredentials(currentUser.id, newUsername.trim(), newPassword)
      if (!res.success) {
        setCredError(res.message || 'Failed to update credentials.')
        setIsUpdatingCreds(false)
        return
      }
      alert('Credentials updated successfully. Please note your new credentials for your next login.')
      setCredModalOpen(false)
    } catch (err) {
      setCredError('An error occurred.')
    } finally {
      setIsUpdatingCreds(false)
    }
  }

  async function handleWipe() {
    setWipeError('')
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

      await window.electronAPI.wipeAllData()
      alert('Database completely wiped! Reloading app...')
      window.location.reload()
    } catch (err) {
      setWipeError('An error occurred.')
      setIsWiping(false)
    }
  }

  return (
    <div>
      <SectionHeading
        title="Account"
        description="Your account information as configured by your administrator."
      />

      {/* Avatar + name row */}
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
        <InfoChip value={currentUser?.employeeId ?? '—'} highlight />
      </SettingRow>

      <SettingRow label="Username" description="Your login username.">
        <InfoChip value={currentUser?.username ?? '—'} highlight />
      </SettingRow>

      <SettingRow label="Account Credentials" description="Update your login username or password.">
        <button
          onClick={() => {
            setNewUsername(currentUser?.username || '')
            setNewPassword('')
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
                className="text-sm h-10 mt-1"
                style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>New Password</label>
              <Input
                type="password"
                placeholder="Leave blank to keep current"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="text-sm h-10 mt-1"
                style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
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

      <SettingRow label="System Role" description="Your technical access level in LLTools.">
        <InfoChip value={roleLabel} />
      </SettingRow>

      {currentUser?.username === 'admin@doublel.com' && (
        <>
          <SettingRow label="Wipe Test Data" description="Delete all records (employees, products, chats, etc.) to prepare for production use.">
            <button
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

          <Dialog open={wipeModalOpen} onOpenChange={setWipeModalOpen}>
            <DialogContent className="p-6 max-w-[400px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <DialogHeader>
                <DialogTitle className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Wipe Database</DialogTitle>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Are you absolutely sure you want to completely WIPE all data? This will clear the entire database. <strong className="text-red-500">It cannot be undone.</strong>
                </p>
              </DialogHeader>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={wipePassword}
                  onChange={e => setWipePassword(e.target.value)}
                  className="text-sm h-10 mt-1"
                  style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                {wipeError && <p className="text-xs text-red-500 mt-1 font-medium">{wipeError}</p>}
              </div>

              <DialogFooter className="mt-6 gap-2">
                <Button variant="outline" onClick={() => setWipeModalOpen(false)} disabled={isWiping} style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </Button>
                <Button onClick={handleWipe} disabled={isWiping} className="bg-red-500 hover:bg-red-600 text-white font-medium border-none">
                  {isWiping ? 'Wiping...' : 'Wipe All Data'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
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
