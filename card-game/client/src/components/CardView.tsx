import React, { useRef, useEffect } from 'react';
import { CardData, isSpecial } from '../types/game';

interface CardProps {
  card: CardData;
  faceDown?: boolean;
  selected?: boolean;
  hovered?: boolean;
  targeted?: boolean;
  obstructed?: boolean;
  glowing?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  '1': '♠', '2': '♦', '3': '♥', '4': '♣', '5': '♠',
  '6': '★', '7': '★', '8': '♦', '9': '♥', '10': '♣',
};

function getCardColors(card: CardData, faceDown: boolean, selected: boolean, targeted: boolean): {
  bg: string; border: string; text: string; accent: string; corner: string;
} {
  if (faceDown) return { bg: '#1a0a3d', border: '#4a3575', text: '#c9b8ff', accent: '#7b5ea7', corner: '#3d2a6e' };
  if (targeted) return { bg: '#3d0f0f', border: '#e05c3a', text: '#ffd4c0', accent: '#e05c3a', corner: '#5a1a10' };
  if (selected) return { bg: '#0f2d1a', border: '#4ade80', text: '#d4fce4', accent: '#4ade80', corner: '#1a4d2d' };
  if (card.value === 6 || card.value === 7) return { bg: '#1a1200', border: '#d4a017', text: '#fff3c0', accent: '#f0c040', corner: '#2d2000' };
  if (card.type === 'VALUE_SHIFT') return { bg: '#0d1a2e', border: '#3b82f6', text: '#bfdbfe', accent: '#60a5fa', corner: '#1e3a5f' };
  if (card.type === 'MOVE_CARD') return { bg: '#1a0d2e', border: '#a855f7', text: '#e9d5ff', accent: '#c084fc', corner: '#2d1a4d' };
  if (card.type === 'OBSTACLE') return { bg: '#1a0d0d', border: '#ef4444', text: '#fecaca', accent: '#f87171', corner: '#3d1111' };
  return { bg: '#f5f0e8', border: '#8b7355', text: '#1a1200', accent: '#5a3e28', corner: '#e8dcc8' };
}

export const CardView: React.FC<CardProps> = ({
  card, faceDown = false, selected, hovered, targeted, obstructed, glowing,
  style, className, onClick, onMouseEnter, onMouseLeave,
}) => {
  const W = 80, H = 115;
  const colors = getCardColors(card, faceDown, !!selected, !!targeted);
  const suitSymbol = !faceDown && !isSpecial(card) ? (SUIT_SYMBOLS[card.name] ?? '◆') : '';
  const isWinCard = !faceDown && !isSpecial(card) && (card.value === 6 || card.value === 7);

  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, filter 0.15s ease',
        transform: hovered ? 'translateY(-10px) scale(1.05)' : selected ? 'translateY(-14px)' : 'none',
        filter: glowing ? `drop-shadow(0 0 8px ${colors.border})` : obstructed ? 'saturate(0.5) brightness(0.7)' : 'none',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {isWinCard && (
            <filter id={`glow-${card.id}`}>
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Card shadow */}
        <rect x="3" y="4" width={W} height={H} rx="8" fill="rgba(0,0,0,0.4)" />

        {/* Card body */}
        <rect x="0" y="0" width={W} height={H} rx="7"
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth={selected || targeted || isWinCard ? 2 : 1}
        />

        {/* Corner texture */}
        <rect x="0" y="0" width={W} height={H} rx="7"
          fill="none"
          stroke={colors.corner}
          strokeWidth="6"
          opacity="0.3"
        />

        {faceDown ? (
          <FaceDownPattern W={W} H={H} colors={colors} />
        ) : isSpecial(card) ? (
          <SpecialCardFace card={card} W={W} H={H} colors={colors} />
        ) : (
          <StandardCardFace card={card} W={W} H={H} colors={colors} suitSymbol={suitSymbol} isWinCard={isWinCard} />
        )}

        {/* Obstacle overlay */}
        {obstructed && card.obstacleturnsLeft > 0 && (
          <ObstacleOverlay W={W} H={H} turns={card.obstacleturnsLeft} />
        )}

        {/* Win glow ring */}
        {isWinCard && (
          <rect x="-2" y="-2" width={W + 4} height={H + 4} rx="9"
            fill="none"
            stroke={colors.accent}
            strokeWidth="1.5"
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  );
};

function FaceDownPattern({ W, H, colors }: { W: number; H: number; colors: ReturnType<typeof getCardColors> }) {
  return (
    <>
      {/* Diamond pattern */}
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => {
          const x = col * 18 + (row % 2 === 0 ? 4 : 13);
          const y = row * 14 + 8;
          return x > 2 && x < W - 8 && y < H - 8 ? (
            <text key={`${row}-${col}`} x={x} y={y} fontSize="10" fill={colors.accent} opacity="0.4" textAnchor="middle">♦</text>
          ) : null;
        })
      )}
      {/* Center symbol */}
      <text x={W / 2} y={H / 2 + 8} fontSize="28" fill={colors.text} opacity="0.6" textAnchor="middle" dominantBaseline="middle">⚜</text>
    </>
  );
}

function StandardCardFace({ card, W, H, colors, suitSymbol, isWinCard }: {
  card: CardData; W: number; H: number; colors: ReturnType<typeof getCardColors>; suitSymbol: string; isWinCard: boolean;
}) {
  return (
    <>
      {/* Subtle inner border for depth */}
      <rect x="4" y="4" width={W - 8} height={H - 8} rx="5"
        fill="none" stroke={colors.accent} strokeWidth="0.5" opacity="0.25" />

      {/* ── Top-left index ── */}
      <text x="9" y="18" fontSize="13" fontWeight="700" fill={colors.text}
        fontFamily="Georgia, serif">{card.name}</text>
      <text x="10" y="28" fontSize="9" fill={colors.accent} opacity="0.8"
        fontFamily="Georgia, serif">{suitSymbol}</text>

      {/* ── Bottom-right index — directly positioned, NOT rotated ──
           Rotation was flipping 6 → looks like 9 and vice versa */}
      <text x={W - 9} y={H - 15} fontSize="13" fontWeight="700" fill={colors.text}
        fontFamily="Georgia, serif" textAnchor="end">{card.name}</text>
      <text x={W - 10} y={H - 5} fontSize="9" fill={colors.accent} opacity="0.8"
        fontFamily="Georgia, serif" textAnchor="end">{suitSymbol}</text>

      {/* ── Thin rules framing the centre zone ── */}
      <line x1="7" y1="34" x2={W - 7} y2="34" stroke={colors.accent} strokeWidth="0.5" opacity="0.18" />
      <line x1="7" y1={H - 34} x2={W - 7} y2={H - 34} stroke={colors.accent} strokeWidth="0.5" opacity="0.18" />

      {/* ── Large centre number ── */}
      <text
        x={W / 2} y={H / 2}
        fontSize={isWinCard ? "42" : "36"}
        fontWeight="700"
        fill={isWinCard ? colors.accent : colors.text}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Georgia, serif"
        opacity="0.95"
      >{card.name}</text>

      {/* ── Flanking suit pips beside the centre number ── */}
      <text x={W / 2 - 22} y={H / 2} fontSize="8" fill={colors.accent}
        textAnchor="middle" dominantBaseline="middle" opacity="0.3"
        fontFamily="Georgia, serif">{suitSymbol}</text>
      <text x={W / 2 + 22} y={H / 2} fontSize="8" fill={colors.accent}
        textAnchor="middle" dominantBaseline="middle" opacity="0.3"
        fontFamily="Georgia, serif">{suitSymbol}</text>
    </>
  );
}

function SpecialCardFace({ card, W, H, colors }: { card: CardData; W: number; H: number; colors: ReturnType<typeof getCardColors> }) {
  const icons: Record<string, string> = { VALUE_SHIFT: '±', MOVE_CARD: '↔', OBSTACLE: '🔒' };
  const shortNames: Record<string, string> = { VALUE_SHIFT: 'SHIFT', MOVE_CARD: 'MOVE', OBSTACLE: 'LOCK' };
  const icon = icons[card.type] ?? '?';
  const short = shortNames[card.type] ?? card.type;

  return (
    <>
      {/* Badge top */}
      <rect x="4" y="4" width={W - 8} height="16" rx="3" fill={colors.accent} opacity="0.2" />
      <text x={W / 2} y="15" fontSize="8" fill={colors.accent} textAnchor="middle" fontWeight="700" letterSpacing="1.5">{short}</text>

      {/* Center icon */}
      <text x={W / 2} y={H / 2 + 4} fontSize="32" fill={colors.accent} textAnchor="middle" dominantBaseline="middle">
        {icon}
      </text>

      {/* Decorative lines */}
      <line x1="10" y1={H / 2 - 20} x2={W - 10} y2={H / 2 - 20} stroke={colors.accent} strokeWidth="0.5" opacity="0.3" />
      <line x1="10" y1={H / 2 + 28} x2={W - 10} y2={H / 2 + 28} stroke={colors.accent} strokeWidth="0.5" opacity="0.3" />

      {/* Badge bottom (rotated) */}
      <g transform={`rotate(180, ${W / 2}, ${H / 2})`}>
        <rect x="4" y="4" width={W - 8} height="16" rx="3" fill={colors.accent} opacity="0.2" />
        <text x={W / 2} y="15" fontSize="8" fill={colors.accent} textAnchor="middle" fontWeight="700" letterSpacing="1.5">{short}</text>
      </g>
    </>
  );
}

function ObstacleOverlay({ W, H, turns }: { W: number; H: number; turns: number }) {
  return (
    <>
      <rect x="0" y="0" width={W} height={H} rx="7" fill="rgba(150,20,20,0.35)" />
      <rect x="0" y="0" width={W} height={H} rx="7" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" />
      <rect x={W - 20} y={H - 20} width="18" height="18" rx="9" fill="#ef4444" />
      <text x={W - 11} y={H - 8} fontSize="11" fill="white" textAnchor="middle" fontWeight="700">{turns}</text>
      <text x={W / 2} y={H - 8} fontSize="8" fill="#ef4444" textAnchor="middle" fontWeight="700" letterSpacing="1">LOCKED</text>
    </>
  );
}