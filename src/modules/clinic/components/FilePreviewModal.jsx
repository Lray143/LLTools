import { useState } from "react"
import { X, Download, FileText, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

function getFileType(att) {
  if (!att) return "unknown"
  const ext = (att.name ?? "").split(".").pop().toLowerCase()
  if (att.type?.startsWith("image/") || ["jpg","jpeg","png","gif","webp","bmp","svg"].includes(ext)) return "image"
  if (att.type === "application/pdf" || ext === "pdf") return "pdf"
  return "other"
}

/**
 * Opens a file for preview. Prefers native Electron shell (att.path),
 * then falls back to an in-app modal using att.dataUrl.
 *
 * Returns: { useModal: true, att } when the in-app modal should be shown,
 *          { useModal: false }     when the native handler was invoked.
 */
export async function resolveAttachment(att) {
  // Prefer native OS handler via Electron (safest for PDFs)
  if (window.electronAPI && att.path) {
    window.electronAPI.openAttachment(att.path)
    return { useModal: false }
  }

  // Legacy: dataUrl stored in DB — save to disk first, then open natively
  if (window.electronAPI && att.dataUrl) {
    try {
      const res    = await fetch(att.dataUrl)
      const buffer = await res.arrayBuffer()
      const result = await window.electronAPI.saveAttachment({
        name: att.name,
        buffer: new Uint8Array(buffer),
      })
      window.electronAPI.openAttachment(result.path)
      return { useModal: false }
    } catch (_) {
      // Fall through to in-app modal below
    }
  }

  // Last resort: in-app preview using dataUrl
  if (att.dataUrl) {
    return { useModal: true, att }
  }

  return { useModal: false }
}

export default function FilePreviewModal({ att, onClose }) {
  const [imgZoom,   setImgZoom]   = useState(1)
  const [imgRotate, setImgRotate] = useState(0)

  if (!att) return null

  const type = getFileType(att)
  const src  = att.dataUrl

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10, 10, 10, 0.88)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1,
      }}>
        {/* File info */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {type === "image"
            ? <ImageIcon size={16} color="var(--theme-400)" />
            : <FileText  size={16} color="var(--theme-400)" />
          }
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: "#f3f4f6", maxWidth: "360px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {att.name}
          </span>
          {att.size && (
            <span style={{ fontSize: "11px", color: 'var(--text-secondary)' }}>
              {att.size < 1024 * 1024
                ? `${(att.size / 1024).toFixed(0)} KB`
                : `${(att.size / 1024 / 1024).toFixed(1)} MB`}
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {type === "image" && (
            <>
              <ToolBtn onClick={() => setImgZoom(z => Math.max(0.25, z - 0.25))} title="Zoom out">
                <ZoomOut size={15} />
              </ToolBtn>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", minWidth: "36px", textAlign: "center" }}>
                {Math.round(imgZoom * 100)}%
              </span>
              <ToolBtn onClick={() => setImgZoom(z => Math.min(4, z + 0.25))} title="Zoom in">
                <ZoomIn size={15} />
              </ToolBtn>
              <ToolBtn onClick={() => setImgRotate(r => (r + 90) % 360)} title="Rotate">
                <RotateCw size={15} />
              </ToolBtn>
              <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
            </>
          )}
          {src && (
            <a
              href={src}
              download={att.name}
              title="Download"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "32px", height: "32px", borderRadius: "8px",
                color: "var(--text-secondary)", textDecoration: "none",
                transition: "background 100ms, color 100ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f3f4f6" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
            >
              <Download size={15} />
            </a>
          )}
          <ToolBtn onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </ToolBtn>
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          marginTop: "52px",
          flex: 1, width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "auto",
          padding: "24px",
        }}
        onClick={handleBackdropClick}
      >
        {type === "image" && src && (
          <img
            src={src}
            alt={att.name}
            draggable={false}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(100vh - 100px)",
              objectFit: "contain",
              transform: `scale(${imgZoom}) rotate(${imgRotate}deg)`,
              transition: "transform 200ms ease",
              borderRadius: imgZoom === 1 ? "8px" : "0",
              boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
              userSelect: "none",
            }}
          />
        )}

        {type === "pdf" && src && (
          <embed
            src={src}
            type="application/pdf"
            style={{
              width: "min(860px, calc(100vw - 48px))",
              height: "calc(100vh - 100px)",
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
              background: 'var(--surface)',
            }}
          />
        )}

        {type === "other" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
            color: "var(--text-secondary)", textAlign: "center",
          }}>
            <FileText size={48} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: "14px" }}>This file type cannot be previewed inline.</p>
            {src && (
              <a
                href={src}
                download={att.name}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px", borderRadius: "10px",
                  background: "var(--theme-500)", color: "#fff",
                  fontSize: "13px", fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Download size={14} />
                Download {att.name}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ToolBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px", borderRadius: "8px",
        background: "transparent", border: "none",
        color: "var(--text-secondary)", cursor: "pointer",
        transition: "background 100ms, color 100ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f3f4f6" }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
    >
      {children}
    </button>
  )
}
