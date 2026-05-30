import React, { useState } from 'react';
import { GameState } from '../types/game';

const FONT = "KinderChildKawaiiBubble, Arial, sans-serif";

interface Props {
  onBack?: () => void;
  state: GameState;
}

export const LobbyScreen: React.FC<Props> = ({ state, onBack }) => {
  const waiting = !state.opponentName;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(state.roomCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#091d33',
      fontFamily: FONT,
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, #153d5c 0%, transparent 65%)',
      }} />

      {/* 6 / 7 tile pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Ctext x='22' y='36' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E6%3C/text%3E%3Ctext x='68' y='36' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E7%3C/text%3E%3Ctext x='22' y='80' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E7%3C/text%3E%3Ctext x='68' y='80' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E6%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'fixed', top: '16px', left: '16px',
            zIndex: 20,
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding: '8px 14px',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.65)',
            fontSize: '13px', fontWeight: '700',
            fontFamily: FONT, letterSpacing: '0.5px',
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.4)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fbbf24';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      )}

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 580,
        padding: '0 32px 96px', boxSizing: 'border-box' as const,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px',
      }}>



        {/* Room Code */}
        <div style={{
          width: '100%',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.22)',
          borderRadius: '16px',
          padding: '28px 32px 24px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            fontSize: '13px', letterSpacing: '3px', color: 'rgba(245,158,11,0.55)',
            fontFamily: FONT, marginBottom: '16px', textTransform: 'uppercase' as const,
          }}>
            Room Code
          </div>
          {/* Individual character boxes */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '18px' }}>
            {(state.roomCode || '????').split('').map((ch, i) => (
              <div key={i} style={{
                width: '68px', height: '78px',
                background: 'rgba(245,158,11,0.1)',
                border: '1.5px solid rgba(245,158,11,0.4)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '40px', fontWeight: '700', color: '#fbbf24',
                fontFamily: FONT,
                letterSpacing: 0,
              }}>
                {ch}
              </div>
            ))}
          </div>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '8px', padding: '7px 16px',
              cursor: 'pointer', color: '#fbbf24',
              fontSize: '13px', fontWeight: '700',
              fontFamily: FONT, letterSpacing: '1px',
              marginBottom: '14px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#fbbf24" strokeWidth="1.4"/>
              <path d="M1 9V2a1 1 0 011-1h7" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Copy Code
          </button>
          {/* Copied toast */}
          {copied && (
            <div style={{
              fontSize: '13px', color: '#4ade80',
              fontFamily: FONT, letterSpacing: '0.5px',
              marginBottom: '8px',
              animation: 'fadeInOut 2.5s ease forwards',
            }}>
              ✓ Copied to clipboard!
            </div>
          )}
          <div style={{
            fontSize: '15px', color: 'rgba(34,197,94,0.7)',
            fontFamily: FONT, letterSpacing: '0.5px',
          }}>
            Share this code with your opponent
          </div>
        </div>

        {/* Player slots */}
        <div style={{ display: 'flex', gap: '14px', width: '100%', alignItems: 'stretch' }}>
          <PlayerSlot name={state.myName} label="You" connected />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: '17px', fontStyle: 'italic',
            fontFamily: FONT, padding: '0 2px', flexShrink: 0,
          }}>
            vs
          </div>
          <PlayerSlot name={state.opponentName || '???'} label="Opponent" connected={!!state.opponentName} />
        </div>

        {/* Waiting / joined status */}
        {waiting ? (
          <div style={{ textAlign: 'center' }}>
            <PulsingDots />
            <p style={{
              color: 'rgba(255,255,255,0.55)', fontSize: '16px',
              margin: '14px 0 0', letterSpacing: '0.5px', fontFamily: FONT,
            }}>
              Waiting for opponent to join…
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '10px', padding: '14px 24px',
            color: '#4ade80', fontSize: '16px', fontFamily: FONT,
          }}>
            <span style={{ fontSize: '20px' }}>✓</span>
            <span>{state.opponentName} joined — starting game…</span>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '78px',
        background: 'rgba(3,8,18,0.98)',
        borderTop: '1px solid rgba(245,158,11,0.18)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 10, padding: '0 12px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.35), transparent)',
        }} />
        <NavTab label="PLAY" active activeColor="#f59e0b" icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polygon points="5,3 19,11 5,19" fill="#f59e0b" />
          </svg>
        } />

        <NavTab label="RULES" activeColor="#22c55e" icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="3" width="16" height="16" rx="3" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6"/>
            <path d="M7 8h8M7 11.5h5.5M7 15h4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        } />
      </div>

      <style>{`
        @font-face {
          font-family: 'KinderChildKawaiiBubble';
          src: url('/fonts/KinderChildKawaiiBubble-WpnAz.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        @keyframes pulse { 0%,80%,100%{opacity:0.25} 40%{opacity:1} }
        @keyframes fadeInOut { 0%{opacity:0;transform:translateY(-4px)} 15%{opacity:1;transform:translateY(0)} 75%{opacity:1} 100%{opacity:0} }
      `}</style>
    </div>
  );
};

const PlayerSlot: React.FC<{ name: string; label: string; connected: boolean }> = ({ name, label, connected }) => (
  <div style={{
    flex: 1, padding: '22px 16px', borderRadius: '14px', textAlign: 'center',
    background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
  }}>
    {/* "You" / "Opponent" label — now fully visible */}
    <div style={{
      fontSize: '13px', letterSpacing: '2.5px', marginBottom: '10px',
      fontWeight: '700', textTransform: 'uppercase' as const,
      color: connected ? 'rgba(34,197,94,0.85)' : 'rgba(255,255,255,0.45)',
      fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif",
    }}>
      {label}
    </div>
    {/* Player name */}
    <div style={{
      fontSize: '22px', fontWeight: '400', marginBottom: '10px',
      color: connected ? '#ffffff' : 'rgba(255,255,255,0.35)',
      textShadow: 'none',
      fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif",
    }}>
      {connected ? name : '—'}
    </div>
    {/* Status dot */}
    <div style={{
      fontSize: '14px', letterSpacing: '0.5px',
      color: connected ? '#4ade80' : 'rgba(255,255,255,0.35)',
      fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif",
    }}>
      {connected ? '● connected' : '○ waiting'}
    </div>
  </div>
);

const PulsingDots: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: '12px', height: '12px', borderRadius: '50%',
        background: '#22c55e',
        animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
      }} />
    ))}
  </div>
);

const NavTab: React.FC<{ label: string; icon: React.ReactNode; active?: boolean; activeColor: string }> = ({ label, icon, active, activeColor }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    cursor: 'pointer',
    padding: '7px 18px 6px',
    borderRadius: '14px',
    background: active ? `${activeColor}18` : 'transparent',
    border: `1px solid ${active ? `${activeColor}40` : 'transparent'}`,
    minWidth: '80px',
    position: 'relative',
    transition: 'background 0.2s ease',
  }}>
    {active && (
      <div style={{
        position: 'absolute', top: '-1px', left: '18%', right: '18%',
        height: '2px', borderRadius: '0 0 3px 3px',
        background: `linear-gradient(to right, transparent, ${activeColor}, transparent)`,
      }} />
    )}
    {icon}
    <span style={{
      fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
      color: active ? activeColor : 'rgba(255,255,255,0.25)',
      fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif",
    }}>
      {label}
    </span>
  </div>
);