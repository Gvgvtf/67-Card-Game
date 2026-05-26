import React from 'react';
import { GameState } from '../types/game';

interface Props {
  state: GameState;
}

export const LobbyScreen: React.FC<Props> = ({ state }) => {
  const waiting = !state.opponentName;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0e1420',
      fontFamily: "SuperMeatball, Arial, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, #0f2e44 0%, transparent 65%)',
      }} />

      {/* Suit grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Ctext x='18' y='32' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A0%3C/text%3E%3Ctext x='63' y='32' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A6%3C/text%3E%3Ctext x='18' y='76' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A3%3C/text%3E%3Ctext x='63' y='76' font-size='18' fill='%23142840' font-family='Arial' text-anchor='middle'%3E%E2%99%A5%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 480,
        padding: '0 24px 88px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
      }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#fbbf24', fontFamily: "SuperMeatball, Arial, sans-serif" }}>7</span>
            <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', fontFamily: "SuperMeatball, Arial, sans-serif",
            lineHeight: 1,
            marginBottom: '12px',
          }}>
            {state.roomCode}
          </span>
          </div>
          <p style={{ color: '#22c55e', fontSize: '12px', margin: 0, letterSpacing: '0.5px' }}>
            Share this code with your opponent
          </p>
        </div>

        {/* Player slots */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
          <PlayerSlot name={state.myName} label="You" connected />
          <div style={{ color: '#1a3555', fontSize: '16px', fontStyle: 'italic', fontFamily: "SuperMeatball, Arial, sans-serif" }}>vs</div>
          <PlayerSlot name={state.opponentName || '???'} label="Opponent" connected={!!state.opponentName} />
        </div>

        {/* Status */}
        {waiting ? (
          <div style={{ textAlign: 'center' }}>
            <PulsingDots />
            <p style={{ color: '#1a3555', fontSize: '13px', margin: '10px 0 0', letterSpacing: '0.5px' }}>
              Waiting for opponent to join
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#22c55e', fontSize: '14px', fontWeight: '600',
          }}>
            <span style={{ fontSize: '18px' }}>✓</span>
            <span>{state.opponentName} joined — starting game...</span>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '68px',
        background: 'rgba(8,13,28,0.98)',
        borderTop: '1px solid #142840',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 10,
      }}>
        <NavTab label="PLAY" active icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="2" width="11" height="16" rx="2" stroke="#22c55e" strokeWidth="1.6"/>
            <rect x="5" y="5" width="11" height="16" rx="2" stroke="#22c55e" strokeWidth="1.6"/>
          </svg>
        } />
        <NavTab label="COLLECTION" icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="5" width="11" height="15" rx="2" stroke="#1a3555" strokeWidth="1.6"/>
            <rect x="5" y="3" width="11" height="15" rx="2" stroke="#1a3555" strokeWidth="1.6"/>
            <rect x="8" y="1" width="11" height="15" rx="2" stroke="#1a3555" strokeWidth="1.6"/>
          </svg>
        } />
        <NavTab label="RULES" icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="3" width="16" height="16" rx="3" stroke="#1a3555" strokeWidth="1.6"/>
            <path d="M7 8h8M7 11.5h5.5M7 15h4" stroke="#1a3555" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        } />
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
@keyframes pulse { 0%,80%,100%{opacity:0.25} 40%{opacity:1} }`}</style>
    </div>
  );
};

const PlayerSlot: React.FC<{ name: string; label: string; connected: boolean }> = ({ name, label, connected }) => (
  <div style={{
    flex: 1, padding: '16px 12px', borderRadius: '12px', textAlign: 'center',
    background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${connected ? 'rgba(34,197,94,0.25)' : '#1e3a58'}`,
  }}>
    <div style={{ fontSize: '10px', color: '#1a3555', letterSpacing: '2px', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '15px', color: connected ? '#f0fdf4' : '#1a3555', fontWeight: '700', marginBottom: '6px' }}>
      {connected ? name : '—'}
    </div>
    <div style={{ fontSize: '10px', color: connected ? '#22c55e' : '#1a3555', letterSpacing: '0.5px' }}>
      {connected ? '● connected' : '○ waiting'}
    </div>
  </div>
);

const PulsingDots: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '7px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: '#22c55e',
        animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
      }} />
    ))}
  </div>
);

const NavTab: React.FC<{ label: string; icon: React.ReactNode; active?: boolean }> = ({ label, icon, active }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', opacity: active ? 1 : 0.4 }}>
    {icon}
    <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', color: active ? '#22c55e' : '#1a3555', fontFamily: "SuperMeatball, Arial, sans-serif" }}>{label}</span>
  </div>
);