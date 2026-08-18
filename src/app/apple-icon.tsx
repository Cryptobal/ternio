import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E1B2C',
          borderRadius: 40,
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <rect x="2.5" y="13" width="7.5" height="16.5" rx="2.6" fill="#FFFFFF" />
          <rect x="12.2" y="4.5" width="7.5" height="25" rx="2.6" fill="#FFAB1A" />
          <rect x="22" y="18.5" width="7.5" height="11" rx="2.6" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
