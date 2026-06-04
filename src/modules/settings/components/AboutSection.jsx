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
        background: 'linear-gradient(135deg, #fff5ee 0%, #fff 60%)',
        border: '1px solid rgba(249,115,22,0.15)',
        marginBottom: '8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <img
          src="/Logo.png"
          alt="LLTools"
          style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#1c1410', margin: 0 }}>
            LLTools
          </p>
          <p style={{ fontSize: '12.5px', color: '#9ca3af', margin: '3px 0 0' }}>
            Double L Beauty Products
          </p>
        </div>
        <div style={{
          marginLeft: 'auto',
          padding: '5px 12px',
          borderRadius: '99px',
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.2)',
          fontSize: '12px',
          fontWeight: 600,
          color: '#f97316',
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
        <p style={{ fontSize: '12.5px', color: '#9ca3af', margin: 0 }}>
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
      background: '#f9f8f7',
      border: '1px solid rgba(0,0,0,0.07)',
      fontSize: '13px',
      fontWeight: 500,
      color: '#4b3a2a',
    }}>
      {value}
    </div>
  )
}
