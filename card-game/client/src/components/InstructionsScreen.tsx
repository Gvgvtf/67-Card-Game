import React from 'react';

const DISPLAY_FONT = "SuperCartoon, Arial, sans-serif";
const BODY_FONT = "KinderChildKawaiiBubble, Arial, sans-serif";

interface Props {
  onBack: () => void;
}

export const InstructionsScreen: React.FC<Props> = ({ onBack }) => {
  return (
    <div style={{
      height: '100vh',
      background: '#091d33',
      fontFamily: BODY_FONT,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>

      {/* Radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 30%, #153d5c 0%, transparent 65%)',
      }} />

      {/* 6 / 7 tile pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Ctext x='22' y='36' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E6%3C/text%3E%3Ctext x='68' y='36' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E7%3C/text%3E%3Ctext x='22' y='80' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E7%3C/text%3E%3Ctext x='68' y='80' font-size='22' font-weight='700' fill='%231e3d5f' font-family='Arial' text-anchor='middle'%3E6%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
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
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', fontFamily: DISPLAY_FONT, textShadow: '0 0 12px rgba(251,191,36,0.4)' }}>6</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', fontFamily: DISPLAY_FONT, textShadow: '0 0 12px rgba(251,191,36,0.4)' }}>7</span>
          </div>
          <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '14px', letterSpacing: '2px', fontFamily: DISPLAY_FONT }}>
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
            <p style={{ color: '#22c55e', fontSize: '12px', fontWeight: '700', letterSpacing: '4px', margin: '0 0 12px', textTransform: 'uppercase' as const, fontFamily: BODY_FONT }}>
              How to Play
            </p>
            <h1 style={{ color: '#fbbf24', fontSize: '32px', fontWeight: '400', margin: '0 0 12px', letterSpacing: '-0.5px', fontFamily: DISPLAY_FONT }}>
              Rules of the Game
            </h1>

          </div>

          {/* 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            <Card accent="#fbbf24" label="THE GOAL" icon={<TargetIcon color="#fbbf24" />}>
              <p style={bodyStyle}>
                Be the first player to hold exactly <Chip color="#fbbf24">6 and 7</Chip> as your only two cards. The <b style={{ color: '#fbbf24' }}>6 must be on the left</b> while <b style={{ color: '#fbbf24' }}>7 must be on the right</b>.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <WinCard label="6" />
                <WinCard label="7" />
                <div style={{ marginLeft: '4px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px', fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif" }}>WIN</div>
                  <div style={{ color: '#22c55e', fontSize: '12px', marginTop: '2px', fontFamily: BODY_FONT }}>6 on the left and 7 on the right</div>
                </div>
              </div>
            </Card>

            <Card accent="#22c55e" label="TAKING A TURN" icon={<ClockIcon color="#22c55e" />}>
              <p style={bodyStyle}>
                Each turn lasts <b style={{ color: '#fbbf24' }}>30 seconds</b>. Discard a pair of <Chip color="#22c55e">adjacent cards</Chip> whose values combine to 6 or 7 via addition, subtraction, or multiplication. 6 and 7 cards may also be played by themselves or in combination. If you pass, draw one card. Hand limit is 9 cards.
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
                    <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: '600', fontFamily: BODY_FONT }}>{result} ✓</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card accent="#c084fc" label="SPECIAL CARDS" icon={<StarIcon color="#c084fc" />}>
              <p style={bodyStyle}>
                Instead of a number pair, you may play one <Chip color="#c084fc">special card</Chip> per turn. These target any card in either hand, yours or your opponent's.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <SpecialRow color="#22c55e" name="Shift" icon="+-">
                  Raises or lowers a card's value by 1. Cannot go below 1 or above 10.
                </SpecialRow>
                <SpecialRow color="#60a5fa" name="Move" icon="<>">
                  Moves a card one slot left or right. Cards on the edges cannot move past the boundary.
                </SpecialRow>
                <SpecialRow color="#f87171" name="Lock" icon="L">
                  Locks a card as an obstacle for 1 to 3 turns. As an obstacle, they are unplayable, untargetable, and will block other cards from being moved across them.
                </SpecialRow>
              </div>
            </Card>

            <Card accent="#f97316" label="EMERGENCY REDRAW" icon={<RefreshIcon color="#f97316" />}>
              <p style={bodyStyle}>
                If a player reaches a <Chip color="#f97316">deadlock</Chip> with no valid plays available, a redraw will be triggered. They will select exactly <b style={{ color: '#fbbf24' }}>3 cards</b> from their hand to discard and replace with random ones.
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
                    fontSize: '16px', fontFamily: BODY_FONT,
                  }}>!</div>
                  <div>
                    <div style={{ color: '#f97316', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px', fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif" }}>HOW IT WORKS</div>
                    <div style={{ color: '#22c55e', fontSize: '13px', lineHeight: 1.6, fontFamily: BODY_FONT }}>
                      This is detected automatically and prompts the player to select 3 cards. They must confirm their selection to complete the redraw.
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
        height: '78px',
        background: 'rgba(3,8,18,0.98)',
        borderTop: '1px solid rgba(34,197,94,0.18)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 12px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.35), transparent)',
        }} />
        <BottomTab icon={<PlayTabIcon active={false} />} label="PLAY" active={false} activeColor="#f59e0b" onClick={onBack} />
        <BottomTab icon={<RulesTabIcon active={true} />} label="RULES" active={true} activeColor="#22c55e" onClick={() => {}} />
      </div>

      <style>{`
        @font-face {
          font-family: 'SuperCartoon';
          src: url('/fonts/SuperCartoon-6R791.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'KinderChildKawaiiBubble';
          src: url('/fonts/KinderChildKawaiiBubble-WpnAz.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

const bodyStyle: React.CSSProperties = {
  color: '#4ade80',
  fontSize: '14px',
  lineHeight: 1.7,
  margin: 0,
  fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif",
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
      <span style={{ color: accent, fontSize: '13px', fontWeight: '700', letterSpacing: '2px', fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif" }}>{label}</span>
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
    fontFamily: "SuperCartoon, Arial, sans-serif",
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
    fontFamily: "SuperCartoon, Arial, sans-serif",
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
      <span style={{ color, fontWeight: '700', fontFamily: "SuperCartoon, Arial, sans-serif" }}>{icon}</span>
    </div>
    <div>
      <div style={{ color, fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px', fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif" }}>{name}</div>
      <div style={{ color: '#22c55e', fontSize: '13px', lineHeight: 1.55, fontFamily: "KinderChildKawaiiBubble, Arial, sans-serif" }}>{children}</div>
    </div>
  </div>
);

const BottomTab: React.FC<{ icon: React.ReactNode; label: string; active: boolean; activeColor: string; onClick: () => void }> = ({ icon, label, active, activeColor, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      cursor: 'pointer',
      padding: '7px 18px 6px',
      borderRadius: '14px',
      background: active ? `${activeColor}18` : 'transparent',
      border: `1px solid ${active ? `${activeColor}40` : 'transparent'}`,
      minWidth: '80px',
      position: 'relative',
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}
  >
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
      transition: 'color 0.2s ease',
    }}>{label}</span>
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
    <polygon points="5,3 19,11 5,19" fill={active ? '#f59e0b' : 'rgba(255,255,255,0.25)'} />
  </svg>
);
const RulesTabIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="3" width="16" height="16" rx="3" stroke={active ? '#22c55e' : 'rgba(255,255,255,0.25)'} strokeWidth="1.6"/>
    <path d="M7 8h8M7 11.5h5.5M7 15h4" stroke={active ? '#22c55e' : 'rgba(255,255,255,0.25)'} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);