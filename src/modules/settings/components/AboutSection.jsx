import { useState, useEffect } from 'react'
import { SectionHeading, SettingRow } from './AppearanceSection'
const BUILD_YEAR  = '2026'

export function AboutSection() {
  const [appVersion, setAppVersion] = useState('1.0.0')

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(setAppVersion)
    }
  }, [])
  const [updateState, setUpdateState] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!window.electronAPI?.updater) return
    const { updater } = window.electronAPI

    const unsubs = [
      updater.onChecking(() => setUpdateState('checking')),
      updater.onUpdateAvailable(() => setUpdateState('available')),
      updater.onUpdateNotAvailable(() => setUpdateState('idle')),
      updater.onDownloadProgress((p) => {
        setUpdateState('downloading')
        setProgress(Math.round(p.percent))
      }),
      updater.onUpdateDownloaded(() => setUpdateState('downloaded')),
      updater.onError((err) => {
        setUpdateState('error')
        setErrorMsg(err)
      })
    ]

    return () => unsubs.forEach(fn => fn())
  }, [])

  const handleUpdateAction = () => {
    if (!window.electronAPI?.updater) return
    const { updater } = window.electronAPI
    if (updateState === 'idle' || updateState === 'error') {
      updater.check()
    } else if (updateState === 'available') {
      updater.download()
    } else if (updateState === 'downloaded') {
      updater.install()
    }
  }

  const getUpdateButtonText = () => {
    switch (updateState) {
      case 'idle': return 'Check for Updates'
      case 'checking': return 'Checking...'
      case 'available': return 'Download Update'
      case 'downloading': return `Downloading (${progress}%)`
      case 'downloaded': return 'Restart & Install'
      case 'error': return 'Retry Update'
      default: return 'Check for Updates'
    }
  }

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
          src="./Logo.png"
          alt="LLTools"
          style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div>
          <p style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)' }}>LLTools v{appVersion}</p>
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

      <SettingRow label="Software Update" description="Check for and install the latest version over-the-air.">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleUpdateAction}
            disabled={updateState === 'checking' || updateState === 'downloading'}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--accent-bg)',
              color: 'var(--accent-text)',
              border: 'none',
              fontWeight: 500,
              cursor: (updateState === 'checking' || updateState === 'downloading') ? 'not-allowed' : 'pointer',
              opacity: (updateState === 'checking' || updateState === 'downloading') ? 0.7 : 1
            }}
          >
            {getUpdateButtonText()}
          </button>
          {updateState === 'error' && (
            <span style={{ color: 'var(--error)', fontSize: '13px', maxWidth: '300px' }}>
              Error: {errorMsg}
            </span>
          )}
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
