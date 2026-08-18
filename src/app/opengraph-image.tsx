import { ImageResponse } from 'next/og'

export const alt = 'Ternio — cotiza servicios para tu empresa'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 88px',
          background: '#0E1B2C',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <rect x="2.5" y="13" width="7.5" height="16.5" rx="2.6" fill="#FFFFFF" />
            <rect x="12.2" y="4.5" width="7.5" height="25" rx="2.6" fill="#FFAB1A" />
            <rect x="22" y="18.5" width="7.5" height="11" rx="2.6" fill="#FFFFFF" />
          </svg>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            ternio
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 34,
            color: '#F1F4F8',
            letterSpacing: '-0.02em',
          }}
        >
          Cotiza servicios para tu empresa · Chile
        </div>
      </div>
    ),
    { ...size },
  )
}
