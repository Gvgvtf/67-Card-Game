import React from 'react';

interface Props {
  onBack: () => void;
}

const FONT_SRC = "/fonts/SuperMeatball.ttf";

export const InstructionsScreen: React.FC<Props> = ({ onBack }) => {
  return (
    <div style={{
      height: '100vh',
      background: '#0e1420',
      fontFamily: "SuperMeatball, Arial, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>

      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, #0d2414 0%, transparent 60%)',
      }} />

      {/* Top bar */}
      <div style={{
        flexShrink: 0, position: 'relative', zIndex: 20,
        background: 'rgba(10,16,32,0.95)',
        borderBottom: '1px solid #142840',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
          color: '#22c55e', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#0d2414'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', fontFamily: "SuperMeatball, Arial, sans-serif", textShadow: '0 0 12px rgba(251,191,36,0.4)' }}>6</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', fontFamily: "SuperMeatball, Arial, sans-serif", textShadow: '0 0 12px rgba(251,191,36,0.4)' }}>7</span>
          </div>
          <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', fontFamily: "SuperMeatball, Arial, sans-serif" }}>
            CARD GAME
          </span>
        </div>

        <div style={{ width: '34px' }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 100px', boxSizing: 'border-box' as const }}>

          {/* Page heading */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ color: '#22c55e', fontSize: '11px', fontWeight: '700', letterSpacing: '4px', margin: '0 0 12px', textTransform: 'uppercase' as const }}>
              How to Play
            </p>
            <h1 style={{ color: '#f0fdf4', fontSize: '28px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
              Rules of the Game
            </h1>
            <p style={{ color: '#22c55e', fontSize: '14px', margin: 0, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              Reduce your hand to exactly two cards. Get the 6 on the left and the 7 on the right to win.
            </p>
          </div>

          {/* 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            <Card accent="#fbbf24" label="THE GOAL" icon={<TargetIcon color="#fbbf24" />}>
              <p style={bodyStyle}>
                Be the first player to hold exactly <Chip color="#fbbf24">6 and 7</Chip> as your only two cards. The <b style={{ color: '#f0fdf4' }}>6 must be leftmost</b> and the <b style={{ color: '#f0fdf4' }}>7 must be rightmost</b>.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <WinCard label="6" />
                <WinCard label="7" />
                <div style={{ marginLeft: '4px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px' }}>WIN</div>
                  <div style={{ color: '#22c55e', fontSize: '11px', marginTop: '2px' }}>Left then right</div>
                </div>
              </div>
            </Card>

            <Card accent="#22c55e" label="TAKING A TURN" icon={<ClockIcon color="#22c55e" />}>
              <p style={bodyStyle}>
                Each turn lasts <b style={{ color: '#f0fdf4' }}>30 seconds</b>. Discard a pair of <Chip color="#22c55e">adjacent cards</Chip> whose values combine to 6 or 7 via addition, subtraction, or multiplication. If you pass, draw one card. Hand limit is 9 cards.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                {[
                  { a: '2', b: '4', result: '2 + 4 = 6' },
                  { a: '3', b: '2', result: '3 x 2 = 6' },
                  { a: '8', b: '1', result: '8 - 1 = 7' },
                ].map(({ a, b, result }) => (
                  <div key={result} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#0a1428', border: '1px solid #1e3a58',
                    borderRadius: '8px', padding: '8px 12px',
                  }}>
                    <SmallCard label={a} />
                    <SmallCard label={b} />
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" style={{ margin: '0 2px', flexShrink: 0 }}>
                      <path d="M1 6h14M9 2l5 4-5 4" stroke="#1e3a58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>{result} ok</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card accent="#c084fc" label="SPECIAL CARDS" icon={<StarIcon color="#c084fc" />}>
              <p style={bodyStyle}>
                Instead of a number pair, play one <Chip color="#c084fc">special card</Chip> per turn. These target any card in either hand, yours or your opponent's.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <SpecialRow color="#22c55e" name="Shift" icon="+-">
                  Raises or lowers a card's value by 1. Cannot go below 1 or above 10.
                </SpecialRow>
                <SpecialRow color="#60a5fa" name="Move" icon="<>">
                  Moves a card one slot left or right. Edge cards cannot move past the boundary.
                </SpecialRow>
                <SpecialRow color="#f87171" name="Lock" icon="L">
                  Locks a card as an obstacle for 1 to 3 turns. Duration is set by a timing minigame.
                </SpecialRow>
              </div>
            </Card>

            <Card accent="#f97316" label="EMERGENCY REDRAW" icon={<RefreshIcon color="#f97316" />}>
              <p style={bodyStyle}>
                If your hand reaches a <Chip color="#f97316">deadlock</Chip> with no valid plays, trigger an emergency redraw. Select exactly <b style={{ color: '#f0fdf4' }}>3 cards</b> from your hand to discard and replace with fresh draws.
              </p>
              <div style={{
                marginTop: '20px',
                background: '#0a1428', border: '1px solid #1e3a58',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', flexShrink: 0,
                    background: '#1e3a58', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>!</div>
                  <div>
                    <div style={{ color: '#f97316', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>HOW IT WORKS</div>
                    <div style={{ color: '#22c55e', fontSize: '12px', lineHeight: 1.6 }}>
                      The game detects the deadlock automatically and prompts you to select 3 cards. Confirm your selection to complete the redraw.
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        flexShrink: 0, position: 'relative', zIndex: 20,
        height: '68px',
        background: 'rgba(8,13,28,0.98)',
        borderTop: '1px solid #142840',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        <BottomTab icon={<PlayTabIcon active={false} />} label="PLAY" active={false} onClick={onBack} />
        <BottomTab icon={<CollectionTabIcon active={false} />} label="COLLECTION" active={false} onClick={() => {}} />
        <BottomTab icon={<RulesTabIcon active={true} />} label="RULES" active={true} onClick={() => {}} />
      </div>

      <style>{`
        @font-face {
          font-family: 'SuperMeatball';
          src: url('/fonts/SuperMeatball.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        * { font-family: 'SuperMeatball', Arial, sans-serif !important; }
      `}</style>
    </div>
  );
};

const bodyStyle: React.CSSProperties = {
  color: '#4ade80',
  fontSize: '13px',
  lineHeight: 1.7,
  margin: 0,
};

const Chip: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{ color, fontWeight: '600' }}>{children}</span>
);

const Card: React.FC<{ accent: string; label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ accent, label, icon, children }) => (
  <div style={{
    background: '#111e30',
    border: '1px solid #1e3a58',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '2px', background: `linear-gradient(to right, ${accent}60, transparent)`, borderRadius: '0 0 2px 2px' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <div style={{
        width: '34px', height: '34px', flexShrink: 0,
        background: '#0e1420', border: `1px solid ${accent}30`,
        borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ color: accent, fontSize: '11px', fontWeight: '700', letterSpacing: '2px' }}>{label}</span>
    </div>
    {children}
  </div>
);

const WinCard: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    width: '40px', height: '52px', flexShrink: 0,
    background: 'linear-gradient(160deg, #1a1000, #0d0900)',
    border: '1.5px solid #f59e0b',
    borderRadius: '7px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', fontWeight: '900', color: '#fbbf24',
    fontFamily: "SuperMeatball, Arial, sans-serif",
    boxShadow: '0 0 12px rgba(232,184,0,0.15)',
  }}>
    {label}
  </div>
);

const SmallCard: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    width: '30px', height: '38px', flexShrink: 0,
    background: '#111e30',
    border: '1px solid #1e3a58',
    borderRadius: '5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', color: '#86efac',
    fontFamily: "SuperMeatball, Arial, sans-serif",
  }}>
    {label}
  </div>
);

const SpecialRow: React.FC<{ color: string; name: string; icon: string; children: React.ReactNode }> = ({ color, name, icon, children }) => (
  <div style={{
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    background: '#0a1428', border: '1px solid #1e3a58',
    borderRadius: '10px', padding: '12px 14px',
  }}>
    <div style={{
      width: '32px', height: '32px', flexShrink: 0,
      background: '#111e30', border: `1px solid ${color}25`,
      borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px',
    }}>
      <span style={{ color, fontWeight: '700', fontFamily: "SuperMeatball, Arial, sans-serif" }}>{icon}</span>
    </div>
    <div>
      <div style={{ color, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px' }}>{name}</div>
      <div style={{ color: '#22c55e', fontSize: '12px', lineHeight: 1.55 }}>{children}</div>
    </div>
  </div>
);

const BottomTab: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', opacity: active ? 1 : 0.4 }}>
    {icon}
    <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', color: active ? '#22c55e' : '#1a3555', fontFamily: "SuperMeatball, Arial, sans-serif" }}>{label}</span>
  </div>
);

const TargetIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="1" fill={color}/>
  </svg>
);
const ClockIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3"/>
    <path d="M8 4.5v4l2.5 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const StarIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5l1.6 4.6H14l-3.8 2.8 1.4 4.6L8 10.8l-3.6 2.7 1.4-4.6L2 6.1h4.4z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);
const RefreshIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8a5 5 0 015-5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M13 8a5 5 0 01-5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M1.5 6l1.5 2 2-1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 10l-1.5-2-2 1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PlayTabIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="2" width="11" height="16" rx="2" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6"/>
    <rect x="5" y="5" width="11" height="16" rx="2" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6"/>
  </svg>
);
const CollectionTabIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="5" width="11" height="15" rx="2" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6"/>
    <rect x="5" y="3" width="11" height="15" rx="2" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6"/>
    <rect x="8" y="1" width="11" height="15" rx="2" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6"/>
  </svg>
);
const RulesTabIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="3" width="16" height="16" rx="3" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6"/>
    <path d="M7 8h8M7 11.5h5.5M7 15h4" stroke={active ? '#22c55e' : '#1a3555'} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);