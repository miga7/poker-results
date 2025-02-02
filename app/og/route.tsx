import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1F2937',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <div style={{ color: '#E5E7EB', marginBottom: 24 }}>Poker Tournament Results</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ color: '#FCD34D', marginBottom: 16 }}>🏆 1st & 2nd: Erez and Scott</div>
          <div style={{ color: '#60A5FA', marginBottom: 16 }}>🥉 3rd: Alon</div>
          <div style={{ color: '#9CA3AF' }}>4th: Mish</div>
        </div>
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex' }}>
          {'♠️♥️♣️♦️'.split('').map((suit, i) => (
            <div key={i} style={{ marginLeft: 8, fontSize: 48 }}>{suit}</div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

