import { SectionHeading, SettingRow } from './AppearanceSection'

const APP_VERSION = '1.0.0'
const BUILD_YEAR  = '2026'

export function AboutSection() {
  return (
    <div>
      <SectionHeading
        title="About"
        description="Information about this application."
      />

      {/* App card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        marginBottom: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <img
          src="/Logo.png"
          alt="LLTools"
          style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            LLTools
          </p>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
            Double L Beauty Products
          </p>
        </div>
        <div style={{
          marginLeft: 'auto',
          padding: '5px 12px',
          borderRadius: '99px',
          background: 'var(--page-bg-alt)',
          border: '1px solid var(--border)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--accent-bg)',
        }}>
          v{APP_VERSION}
        </div>
      </div>

      <SettingRow label="Version" description="Current installed version of LLTools.">
        <InfoChip value={`v${APP_VERSION}`} />
      </SettingRow>

      <SettingRow label="Developer" description="Built and maintained by the LLTools team.">
        <InfoChip value="Double L Development" />
      </SettingRow>

      <SettingRow label="Platform" description="Running on Electron + React + Vite.">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Electron', 'React', 'Vite', 'SQLite'].map(p => (
            <InfoChip key={p} value={p} />
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Copyright" description="">
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
          © {BUILD_YEAR} Double L Beauty Products. All rights reserved.
        </p>
      </SettingRow>
    </div>
  )
}

function InfoChip({ value }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '7px 14px',
      borderRadius: '10px',
      background: 'var(--surface-hover)',
      border: '1px solid var(--border)',
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--text-primary)',
    }}>
      {value}
    </div>
  )
}
