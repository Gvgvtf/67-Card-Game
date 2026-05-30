import React, { useState } from 'react';
import { InstructionsScreen } from './InstructionsScreen';

// ── Type shared with useCpuGame / App ─────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

const HAND_LEFT = "/images/hand-left.png";
const HAND_RIGHT = "/images/hand-right.png";
const DISPLAY_FONT = "SuperCartoon, Arial, sans-serif";
const BODY_FONT = "KinderChildKawaiiBubble, Arial, sans-serif";

interface Props {
  onCreateRoom:  (name: string) => void;
  onJoinRoom:    (name: string, code: string) => void;
  onPlayVsCPU:   (name: string, difficulty: Difficulty) => void;   // ← new
}

type Mode = 'idle' | 'join' | 'cpu';

export const HomeScreen: React.FC<Props> = ({ onCreateRoom, onJoinRoom, onPlayVsCPU }) => {
  const [screen,     setScreen]     = useState<'home' | 'instructions'>('home');
  const [name,       setName]       = useState('');
  const [roomCode,   setRoomCode]   = useState('');
  const [mode,       setMode]       = useState<Mode>('idle');
  const [cpuDiff,    setCpuDiff]    = useState<Difficulty>('medium');
  const [error,      setError]      = useState('');

  if (screen === 'instructions') {
    return <InstructionsScreen onBack={() => setScreen('home')} />;
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

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

  const handleCpuPlay = () => {
    if (!name.trim()) { setError('Enter your name first.'); return; }
    onPlayVsCPU(name.trim(), cpuDiff);
  };

  const handleBack = () => { setMode('idle'); setRoomCode(''); setError(''); };

  // ── Difficulty button style helper ───────────────────────────────────────────

  const diffColor: Record<Difficulty, string> = {
    easy:   '#4ade80',
    medium: '#f59e0b',
    hard:   '#ef4444',
  };
  const diffLabel: Record<Difficulty, string> = {
    easy:   'EASY',
    medium: 'MEDIUM',
    hard:   'HARD',
  };

  const DiffBtn = ({ d }: { d: Difficulty }) => {
    const active  = cpuDiff === d;
    const color   = diffColor[d];
    return (
      <button
        onClick={() => { setCpuDiff(d); setError(''); }}
        style={{
          flex: 1, padding: '14px 0',
          background: active ? `${color}22` : 'transparent',
          border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '10px',
          color: active ? color : 'rgba(255,255,255,0.35)',
          fontSize: '14px', fontWeight: '900',
          fontFamily: BODY_FONT,
          letterSpacing: '1.5px', cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: active ? `0 0 12px ${color}33` : 'none',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${color}60`; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      >
        {diffLabel[d]}
      </button>
    );
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: '78px',
      boxSizing: 'border-box' as const,
      background: '#091d33',
      fontFamily: BODY_FONT,
      position: 'relative',
      overflow: 'hidden',
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

      {/* ── Hero ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        gap: '8px', marginBottom: '36px',
        paddingTop: '60px',
      }}>

        {/* Left hand + 6 card */}
        <div style={{ position: 'relative', animation: 'handBobLeft 2.4s ease-in-out infinite', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', top: '-48px', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            animation: 'cardFloat 2.4s ease-in-out infinite',
            filter: 'drop-shadow(0 12px 28px rgba(232,184,0,0.65))',
          }}>
            <GameCard value="6" />
          </div>
          <img src={HAND_LEFT} alt="left hand" style={{
            width: '130px', objectFit: 'contain', display: 'block',
            filter: 'drop-shadow(0 12px 32px rgba(232,184,0,0.25))',
          }} />
        </div>

        {/* Center title */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '14px',
          flexShrink: 0,
          gap: '6px',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '5px', color: 'rgba(240,192,64,0.35)', fontFamily: DISPLAY_FONT }}>✦ ✦ ✦</div>
          <div style={{
            fontSize: '42px', letterSpacing: '6px', color: '#f59e0b',
            textTransform: 'uppercase' as const,
            fontFamily: DISPLAY_FONT,
            textShadow: '0 0 28px rgba(240,192,64,0.35)',
            lineHeight: 1.1,
            textAlign: 'center' as const,
          }}>
            CARD<br/>GAME
          </div>
          <div style={{
            fontSize: '12px', letterSpacing: '2px', color: '#4ade80',
            textAlign: 'center' as const, marginTop: '2px',
            fontFamily: BODY_FONT,
          }}>
            SIX SEVEEEEN
          </div>
        </div>

        {/* Right hand + 7 card */}
        <div style={{ position: 'relative', animation: 'handBobRight 2.4s ease-in-out infinite', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', top: '-48px', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            animation: 'cardFloat 2.4s ease-in-out infinite 1.2s',
            filter: 'drop-shadow(0 12px 28px rgba(232,184,0,0.65))',
          }}>
            <GameCard value="7" />
          </div>
          <img src={HAND_RIGHT} alt="right hand" style={{
            width: '130px', objectFit: 'contain', display: 'block',
            filter: 'drop-shadow(0 12px 32px rgba(232,184,0,0.25))',
          }} />
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
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid #3a6a9a',
            borderRadius: '12px', color: '#4ade80', fontSize: '19px',
            fontFamily: BODY_FONT,
            textAlign: 'center',
            transition: 'border-color 0.2s, background 0.2s',
            letterSpacing: '0.3px',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(232,184,0,0.5)'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = '#3a6a9a'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
        />

        {/* ── JOIN mode: room code input ── */}
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
              fontFamily: DISPLAY_FONT,
              textAlign: 'center', letterSpacing: '10px',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(232,184,0,0.6)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(232,184,0,0.3)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
          />
        )}

        {/* ── CPU mode: difficulty selector ── */}
        {mode === 'cpu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Section label */}
            <div style={{
              textAlign: 'center', fontSize: '11px', letterSpacing: '3px',
              color: 'rgba(255,255,255,0.3)', fontFamily: BODY_FONT,
              paddingTop: '2px',
            }}>
              DIFFICULTY
            </div>
            {/* Three difficulty buttons side by side */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <DiffBtn d="easy" />
              <DiffBtn d="medium" />
              <DiffBtn d="hard" />
            </div>
            {/* Small descriptor */}
            <div style={{
              textAlign: 'center', fontSize: '12px',
              color: diffColor[cpuDiff], fontFamily: BODY_FONT,
              letterSpacing: '0.5px', minHeight: '18px',
              transition: 'color 0.2s',
            }}>
              {cpuDiff === 'easy'   && 'Plays randomly — great for learning'}
              {cpuDiff === 'medium' && 'Pursues wins and disrupts when close'}
              {cpuDiff === 'hard'   && 'Aggressive — targets your best cards'}
            </div>
          </div>
        )}

        {/* ── CREATE ROOM (idle only) ── */}
        {mode === 'idle' && (
          <button
            onClick={handleCreate}
            style={{
              width: '100%', padding: '18px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
              backgroundSize: '200% 100%',
              border: 'none', borderRadius: '12px',
              color: '#1a0e00', fontSize: '18px', fontWeight: '900',
              fontFamily: BODY_FONT,
              letterSpacing: '2px', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(232,184,0,0.2)',
              transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(232,184,0,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.boxShadow = '0 4px 24px rgba(232,184,0,0.2)'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            CREATE ROOM
          </button>
        )}

        {/* ── JOIN ROOM / CONFIRM JOIN ── */}
        {mode !== 'cpu' && (
          <button
            onClick={handleJoin}
            style={{
              width: '100%', padding: '18px',
              background: 'transparent',
              border: `1px solid ${mode === 'join' ? 'rgba(232,184,0,0.35)' : '#1e3a58'}`,
              borderRadius: '12px',
              color: mode === 'join' ? '#fbbf24' : '#22c55e',
              fontSize: '18px', fontWeight: '900',
              fontFamily: BODY_FONT,
              letterSpacing: '2px', cursor: 'pointer',
              transition: 'opacity 0.15s, transform 0.1s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {mode === 'join' ? 'CONFIRM JOIN' : 'JOIN ROOM'}
          </button>
        )}

        {/* ── VS CPU button (idle) / PLAY VS CPU confirm (cpu mode) ── */}
        {mode === 'idle' && (
          <button
            onClick={() => { setMode('cpu'); setError(''); }}
            style={{
              width: '100%', padding: '18px',
              background: 'transparent',
              border: '1px solid rgba(168,85,247,0.35)',
              borderRadius: '12px',
              color: '#c084fc',
              fontSize: '18px', fontWeight: '900',
              fontFamily: BODY_FONT,
              letterSpacing: '2px', cursor: 'pointer',
              transition: 'opacity 0.15s, transform 0.1s, border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.65)';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(168,85,247,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.35)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            VS CPU
          </button>
        )}

        {mode === 'cpu' && (
          <button
            onClick={handleCpuPlay}
            style={{
              width: '100%', padding: '18px',
              background: `linear-gradient(135deg, ${diffColor[cpuDiff]}33 0%, ${diffColor[cpuDiff]}55 50%, ${diffColor[cpuDiff]}33 100%)`,
              border: `1.5px solid ${diffColor[cpuDiff]}80`,
              borderRadius: '12px',
              color: diffColor[cpuDiff],
              fontSize: '18px', fontWeight: '900',
              fontFamily: BODY_FONT,
              letterSpacing: '2px', cursor: 'pointer',
              boxShadow: `0 4px 20px ${diffColor[cpuDiff]}22`,
              transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            PLAY VS CPU ▶
          </button>
        )}

        {/* Back button (join or cpu mode) */}
        {(mode === 'join' || mode === 'cpu') && (
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', color: '#4ade80',
              cursor: 'pointer', fontSize: '13px', letterSpacing: '1px',
              fontFamily: BODY_FONT,
            }}
          >
            back
          </button>
        )}

        {error && (
          <div style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', letterSpacing: '0.3px', fontFamily: BODY_FONT }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '78px',
        background: 'rgba(3,8,18,0.98)',
        borderTop: '1px solid rgba(245,158,11,0.18)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 10,
        padding: '0 12px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.35), transparent)',
        }} />
        <NavTab icon={<PlayIcon active />} label="PLAY" active activeColor="#f59e0b" onClick={() => {}} />
        <NavTab icon={<RulesIcon active={false} />} label="RULES" active={false} activeColor="#22c55e" onClick={() => setScreen('instructions')} />
      </div>

      <style>{`
        @font-face {
          font-family: 'SuperCartoon';
          src: url('/fonts/SuperCartoon-6R791.ttf') format('truetype');
          font-weight: normal; font-style: normal;
        }
        @font-face {
          font-family: 'KinderChildKawaiiBubble';
          src: url('/fonts/KinderChildKawaiiBubble-WpnAz.otf') format('opentype');
          font-weight: normal; font-style: normal;
        }
        @keyframes handBobLeft  { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(14px)} }
        @keyframes handBobRight { 0%,100%{transform:translateY(14px)} 50%{transform:translateY(0px)}  }
        @keyframes cardFloat    { 0%,100%{transform:translateX(-50%) translateY(0px)}   50%{transform:translateX(-50%) translateY(-10px)} }
        input::placeholder { color: #4a7aa0; font-family: 'KinderChildKawaiiBubble', Arial, sans-serif; }
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
    <div style={{ position:'absolute', top:'5px', left:'7px', fontSize:'11px', fontWeight:'700', color:'#fbbf24', fontFamily:"SuperCartoon, Arial, sans-serif" }}>{value}</div>
    <div style={{ fontSize:'36px', fontWeight:'900', color:'#fbbf24', fontFamily:"SuperCartoon, Arial, sans-serif", textShadow:'0 0 8px rgba(240,192,64,0.5)' }}>{value}</div>
    <div style={{ position:'absolute', bottom:'5px', right:'7px', fontSize:'11px', fontWeight:'700', color:'#fbbf24', fontFamily:"SuperCartoon, Arial, sans-serif" }}>{value}</div>
    <div style={{ position:'absolute', inset:'3px', border:'0.5px solid rgba(240,192,64,0.2)', borderRadius:'5px', pointerEvents:'none' }} />
  </div>
);

/* ── Nav tab ── */
const NavTab: React.FC<{ icon: React.ReactNode; label: string; active: boolean; activeColor: string; onClick: () => void }> = ({ icon, label, active, activeColor, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
      cursor:'pointer', padding:'7px 18px 6px', borderRadius:'14px',
      background: active ? `${activeColor}18` : 'transparent',
      border: `1px solid ${active ? `${activeColor}40` : 'transparent'}`,
      minWidth:'80px', position:'relative',
      transition:'background 0.2s ease, border-color 0.2s ease',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {active && (
      <div style={{
        position:'absolute', top:'-1px', left:'18%', right:'18%',
        height:'2px', borderRadius:'0 0 3px 3px',
        background:`linear-gradient(to right, transparent, ${activeColor}, transparent)`,
      }} />
    )}
    {icon}
    <span style={{
      fontSize:'10px', fontWeight:'700', letterSpacing:'1.5px',
      color: active ? activeColor : 'rgba(255,255,255,0.25)',
      fontFamily:"KinderChildKawaiiBubble, Arial, sans-serif",
      transition:'color 0.2s ease',
    }}>
      {label}
    </span>
  </div>
);

const RulesIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="3" width="16" height="16" rx="3" stroke={active ? '#22c55e' : 'rgba(255,255,255,0.25)'} strokeWidth="1.6"/>
    <path d="M7 8h8M7 11.5h5.5M7 15h4" stroke={active ? '#22c55e' : 'rgba(255,255,255,0.25)'} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const PlayIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <polygon points="5,3 19,11 5,19" fill={active ? '#f59e0b' : 'rgba(255,255,255,0.25)'} />
  </svg>
);