import { SectionHeading, SettingRow } from './AppearanceSection'

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
        <InfoChip value={currentUser?.username ?? '—'} highlight />
      </SettingRow>

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
        <SettingRow label="Wipe Test Data" description="Delete all records (employees, products, chats, etc.) to prepare for production use.">
          <button
            onClick={async () => {
              if (window.confirm('Are you absolutely sure you want to completely WIPE all data? This will clear the entire database. It cannot be undone.')) {
                await window.electronAPI.wipeAllData()
                alert('Database completely wiped! Reloading app...')
                window.location.reload()
              }
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
