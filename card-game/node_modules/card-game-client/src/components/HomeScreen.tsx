import React, { useState } from 'react';
import { InstructionsScreen } from './InstructionsScreen';

const HAND_LEFT = "/images/hand-left.png";
const HAND_RIGHT = "/images/hand-right.png";

interface Props {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
}

export const HomeScreen: React.FC<Props> = ({ onCreateRoom, onJoinRoom }) => {
  const [screen, setScreen] = useState<'home' | 'instructions'>('home');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [error, setError] = useState('');

  if (screen === 'instructions') {
    return <InstructionsScreen onBack={() => setScreen('home')} />;
  }

  const handleCreate = () => {
    if (!name.trim()) { setError('Enter your name first.'); return; }
    onCreateRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim()) { setError('Enter your name first.'); return; }
    if (mode === 'idle') { setMode('join'); return; }
    if (!roomCode.trim()) { setError('Enter a room code.'); return; }
    onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0e1420',
      fontFamily: "SuperMeatball, Arial, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, #0f2e44 0%, transparent 65%)',
      }} />

      {/* Subtle grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Ctext x='18' y='32' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A0%3C/text%3E%3Ctext x='63' y='32' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A6%3C/text%3E%3Ctext x='18' y='76' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A3%3C/text%3E%3Ctext x='63' y='76' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A5%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />

      {/* ── Hero: animated hands with floating cards ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        gap: '16px', marginBottom: '36px',
        height: '240px',
      }}>

        {/* Left hand + 6 card */}
        <div style={{ position: 'relative', animation: 'handBobLeft 2.4s ease-in-out infinite' }}>
          {/* Floating 6 card */}
          <div style={{
            position: 'absolute', top: '-48px', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            animation: 'cardFloat 2.4s ease-in-out infinite',
            filter: 'drop-shadow(0 12px 28px rgba(232,184,0,0.65))',
          }}>
            <GameCard value="6" />
          </div>
          {/* Hand image */}
          <img
            src={HAND_LEFT}
            alt="left hand"
            style={{
              width: '160px',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 12px 32px rgba(232,184,0,0.25))',
            }}
          />
        </div>

        {/* Right hand + 7 card */}
        <div style={{ position: 'relative', animation: 'handBobRight 2.4s ease-in-out infinite' }}>
          {/* Floating 7 card */}
          <div style={{
            position: 'absolute', top: '-48px', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            animation: 'cardFloat 2.4s ease-in-out infinite 1.2s',
            filter: 'drop-shadow(0 12px 28px rgba(232,184,0,0.65))',
          }}>
            <GameCard value="7" />
          </div>
          {/* Hand image */}
          <img
            src={HAND_RIGHT}
            alt="right hand"
            style={{
              width: '160px',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 12px 32px rgba(232,184,0,0.25))',
            }}
          />
        </div>
      </div>

      {/* ── Title text ── */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          fontSize: '11px', letterSpacing: '6px', color: '#1e3a58',
          fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase',
        }}>
          Card Game
        </div>
        <div style={{
          fontSize: '13px', letterSpacing: '3px', color: '#2a4a30',
          fontWeight: '500',
        }}>
          arrange [6, 7] to win
        </div>
      </div>

      {/* ── Form panel ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400, padding: '0 24px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>

        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="Your name"
          maxLength={20}
          style={{
            width: '100%', padding: '15px 18px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #1e3a58',
            borderRadius: '12px', color: '#f0fdf4', fontSize: '15px',
            fontFamily: "SuperMeatball, Arial, sans-serif",
            textAlign: 'center',
            transition: 'border-color 0.2s, background 0.2s',
            letterSpacing: '0.3px',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(232,184,0,0.4)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
          onBlur={e => { e.target.style.borderColor = '#1e3a58'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        />

        {/* Room code input */}
        {mode === 'join' && (
          <input
            type="text"
            value={roomCode}
            onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder="ROOM CODE"
            maxLength={4}
            autoFocus
            style={{
              width: '100%', padding: '15px 18px', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(232,184,0,0.3)',
              borderRadius: '12px', color: '#fbbf24', fontSize: '20px',
              fontFamily: "SuperMeatball, Arial, sans-serif",
              textAlign: 'center', letterSpacing: '10px',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(232,184,0,0.6)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(232,184,0,0.3)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
          />
        )}

        {/* CREATE ROOM */}
        {mode === 'idle' && (
          <button
            onClick={handleCreate}
            style={{
              width: '100%', padding: '15px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
              backgroundSize: '200% 100%',
              border: 'none', borderRadius: '12px',
              color: '#1a0e00', fontSize: '13px', fontWeight: '900',
              fontFamily: "SuperMeatball, Arial, sans-serif",
              letterSpacing: '3px', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(232,184,0,0.2)',
              transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(232,184,0,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(232,184,0,0.2)'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            CREATE ROOM
          </button>
        )}

        {/* JOIN ROOM / CONFIRM JOIN */}
        <button
          onClick={handleJoin}
          style={{
            width: '100%', padding: '15px',
            background: 'transparent',
            border: `1px solid ${mode === 'join' ? 'rgba(232,184,0,0.35)' : '#1e3a58'}`,
            borderRadius: '12px',
            color: mode === 'join' ? '#fbbf24' : '#22c55e',
            fontSize: '13px', fontWeight: '900',
            fontFamily: "SuperMeatball, Arial, sans-serif",
            letterSpacing: '3px', cursor: 'pointer',
            transition: 'opacity 0.15s, transform 0.1s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {mode === 'join' ? 'CONFIRM JOIN' : 'JOIN ROOM'}
        </button>

        {/* Back */}
        {mode === 'join' && (
          <button
            onClick={() => { setMode('idle'); setRoomCode(''); setError(''); }}
            style={{
              background: 'none', border: 'none', color: '#1e3a58',
              cursor: 'pointer', fontSize: '12px', letterSpacing: '1px',
              fontFamily: "SuperMeatball, Arial, sans-serif"
            }}
          >
            back
          </button>
        )}

        {error && (
          <div style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', letterSpacing: '0.3px' }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '68px',
        background: 'rgba(2,11,4,0.97)',
        borderTop: '1px solid #142840',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 10,
      }}>
        
        <NavTab
          icon={<PlayIcon active />}
          label="PLAY" active
          onClick={() => {}}
        />
        <NavTab
          icon={<CollectionIcon />}
          label="COLLECTION" active={false}
          onClick={() => {}}
        />
        <NavTab
          icon={<RulesIcon />}
          label="RULES" active={false}
          onClick={() => setScreen('instructions')}
        />
      </div>

      <style>{`
        @font-face {
  font-family: 'SuperMeatball';
  src: url('/fonts/SuperMeatball.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
        * { font-family: 'SuperMeatball', Arial, sans-serif !important; }
        
        @font-face {
  font-family: 'SuperMeatball';
  src: url('/fonts/SuperMeatball.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

        @keyframes handBobLeft {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(14px); }
        }
        @keyframes handBobRight {
          0%, 100% { transform: translateY(14px); }
          50%       { transform: translateY(0px); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px);   }
          50%       { transform: translateX(-50%) translateY(-10px); }
        }
        input::placeholder { color: #1e3a58; }
      `}</style>
    </div>
  );
};

/* ── In-game styled card ── */
const GameCard: React.FC<{ value: string }> = ({ value }) => (
  <div style={{
    width: '62px', height: '88px',
    background: 'linear-gradient(160deg, #1a1000, #0e0c00)',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    boxShadow: '0 0 18px rgba(232,184,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  }}>
    {/* Corner label top-left */}
    <div style={{
      position: 'absolute', top: '5px', left: '7px',
      fontSize: '11px', fontWeight: '700', color: '#fbbf24', fontFamily: "SuperMeatball, Arial, sans-serif"
    }}>{value}</div>
    {/* Center value */}
    <div style={{
      fontSize: '36px', fontWeight: '900', color: '#fbbf24',
      fontFamily: "SuperMeatball, Arial, sans-serif",
      textShadow: '0 0 8px rgba(240,192,64,0.5)',
    }}>{value}</div>
    {/* Corner label bottom-right */}
    <div style={{
      position: 'absolute', bottom: '5px', right: '7px',
      fontSize: '11px', fontWeight: '700', color: '#fbbf24', fontFamily: "SuperMeatball, Arial, sans-serif"
    }}>{value}</div>
    {/* Inner border accent */}
    <div style={{
      position: 'absolute', inset: '3px',
      border: '0.5px solid rgba(240,192,64,0.2)',
      borderRadius: '5px', pointerEvents: 'none',
    }} />
  </div>
);

/* ── Nav tab ── */
const NavTab: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', opacity: active ? 1 : 0.4 }}>
    {icon}
    <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', color: active ? '#22c55e' : '#1a3555', fontFamily: "SuperMeatball, Arial, sans-serif" }}>
      {label}
    </span>
  </div>
);
const CollectionIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="5" width="11" height="15" rx="2" stroke="#1a3555" strokeWidth="1.6"/>
    <rect x="5" y="3" width="11" height="15" rx="2" stroke="#1a3555" strokeWidth="1.6"/>
    <rect x="8" y="1" width="11" height="15" rx="2" stroke="#1a3555" strokeWidth="1.6"/>
  </svg>
);
const RulesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="3" width="16" height="16" rx="3" stroke="#1a3555" strokeWidth="1.6"/>
    <path d="M7 8h8M7 11.5h5.5M7 15h4" stroke="#1a3555" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const PlayIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <polygon points="6,4 18,11 6,18" fill={active ? '#22c55e' : '#1a3555'} />
  </svg>
);