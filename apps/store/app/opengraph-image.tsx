import { ImageResponse } from 'next/og'

export const alt = 'Agent Store — skills, MCP servers & providers for Claude Code / Codex'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Branded social preview card, generated at build/request time (no static asset).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'radial-gradient(120% 120% at 50% -10%, #191430 0%, #0c0b13 55%, #08070c 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#7c82ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Agent Store</div>
        </div>

        <div style={{ marginTop: 40, fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
          One entry, every agent capability.
        </div>

        <div style={{ marginTop: 28, fontSize: 30, color: '#a9a9bd', maxWidth: 880 }}>
          Discover & install skills, MCP servers, and providers for Claude Code / Codex.
        </div>

        <div style={{ marginTop: 44, display: 'flex', gap: 16 }}>
          {['Skills', 'MCP servers', 'Providers'].map((chip) => (
            <div
              key={chip}
              style={{
                fontSize: 26,
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(124,130,255,0.4)',
                background: 'rgba(124,130,255,0.12)',
                color: '#c9ccff',
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
