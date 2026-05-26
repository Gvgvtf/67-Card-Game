import React, { useRef, useEffect, useCallback, useState } from 'react';

interface Props {
  timeLeft: number;
  onFire: (turns: number) => void;
  onCancel: () => void;
}

export const TimingBar: React.FC<Props> = ({ timeLeft, onFire, onCancel }) => {
  const [markerPct, setMarkerPct] = useState(0);
  const [fired, setFired] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const dirRef = useRef(1);
  const posRef = useRef(0);
  const animRef = useRef<number>();

  useEffect(() => {
    const speed = 0.015;
    const tick = () => {
      posRef.current += dirRef.current * speed;
      if (posRef.current >= 1) { posRef.current = 1; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
      setMarkerPct(posRef.current * 100);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, []);

  const fire = useCallback(() => {
    if (fired) return;
    cancelAnimationFrame(animRef.current!);
    setFired(true);
    const pos = posRef.current;
    const dist = Math.abs(pos - 0.5) / 0.5;
    const s = dist <= 0.14 ? 3 : dist <= 0.60 ? 2 : 1;
    setScore(s);
    setTimeout(() => onFire(s), 600);
  }, [fired, onFire]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') fire();
      if (e.code === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fire, onCancel]);

  const scoreColors = ['', '#ef4444', '#f59e0b', '#22c55e'];
  const scoreLabels = ['', '1 turn', '2 turns', '3 turns'];

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', zIndex: 100, fontFamily: 'Georgia, serif',
    }} onClick={fire}>
      {/* Turn timer badge */}
      <div style={{
        position: 'absolute', top: 18, right: 18,
        width: 48, height: 48, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: timeLeft <= 8 ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.1)',
        border: `2px solid ${timeLeft <= 8 ? '#ef4444' : '#4ade80'}`,
        fontSize: '20px', fontWeight: '700',
        color: timeLeft <= 8 ? '#ef4444' : '#4ade80',
        animation: timeLeft <= 8 ? 'pulse 0.7s infinite' : 'none',
        fontFamily: 'Georgia, serif',
        zIndex: 101,
      }} onClick={e => e.stopPropagation()}>
        {timeLeft}
      </div>
      <div style={{
        background: '#0d1f0d', border: '1px solid rgba(240,192,64,0.3)', borderRadius: '12px',
        padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center',
      }}>
        <div style={{ fontSize: '11px', color: '#8a7040', letterSpacing: '3px', marginBottom: '0.5rem' }}>OBSTACLE TIMING</div>
        <div style={{ fontSize: '14px', color: '#6b8c6b', marginBottom: '1.5rem' }}>
          Click or press SPACE when the bar lands in the center
        </div>

        {/* Zones legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '0.75rem', fontSize: '11px' }}>
          {[['#ef4444', '1 turn'], ['#f59e0b', '2 turns'], ['#22c55e', '3 turns']].map(([c, l]) => (
            <span key={l} style={{ color: c as string }}>● {l}</span>
          ))}
        </div>

        {/* Timing bar */}
        <div style={{ position: 'relative', height: 40, borderRadius: 6, overflow: 'hidden', background: '#ef4444' }}>
          {/* Yellow zone: 20%–80% */}
          <div style={{ position: 'absolute', left: '20%', width: '60%', top: 0, height: '100%', background: '#f59e0b' }} />
          {/* Green zone: 43%–57% */}
          <div style={{ position: 'absolute', left: '43%', width: '14%', top: 0, height: '100%', background: '#22c55e' }} />

          {/* Marker */}
          <div style={{
            position: 'absolute', left: `${markerPct}%`, top: -4, bottom: -4,
            width: 6, background: 'white', borderRadius: 3,
            transform: 'translateX(-50%)',
            boxShadow: fired && score ? `0 0 12px ${scoreColors[score]}` : 'none',
            transition: fired ? 'box-shadow 0.3s' : 'none',
          }} />
        </div>

        {fired && score ? (
          <div style={{ marginTop: '1rem', fontSize: '20px', color: scoreColors[score], fontWeight: '700' }}>
            {scoreLabels[score]} obstacle!
          </div>
        ) : (
          <div style={{ marginTop: '1rem', fontSize: '11px', color: '#444' }}>ESC to cancel</div>
        )}
      </div>
    </div>
  );
};