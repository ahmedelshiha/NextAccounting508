import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          borderRadius: 12,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto',
          }}
        >
          AF
        </span>
      </div>
    ),
    size
  )
}
