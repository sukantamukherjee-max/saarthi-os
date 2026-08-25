import { useId } from 'react';

const BLADE = 'M50 7 L56 39 L44 39 Z';
const BLADE_ANGLES = [0, 45, 90, 135, 180, 225, 270];

const DOME_STOPS: Record<'light' | 'dark', [string, string][]> = {
  dark: [['0%', '#a795ef'], ['38%', '#6a4fd6'], ['72%', '#432f9e'], ['100%', '#1e1550']],
  light: [['0%', '#faf9ff'], ['35%', '#c9bdf8'], ['68%', '#9583ea'], ['100%', '#6a55cf']],
};
const DOME_DEEP_STOPS: Record<'light' | 'dark', [string, string][]> = {
  dark: [['0%', '#8570dd'], ['45%', '#5138b8'], ['100%', '#180f3f']],
  light: [['0%', '#e4dbfc'], ['55%', '#af9df2'], ['100%', '#7a64d8']],
};
const SAFFRON_STOPS: [string, string][] = [['0%', '#ffe1b0'], ['40%', '#ff9933'], ['100%', '#8a4409']];

/**
 * The Sudarshan Blades mark. `variant="light"` (bright periwinkle) reads best
 * on a dark ground; `variant="dark"` (deep indigo) reads best on a light
 * ground — pick based on the surface it's sitting on, not a fixed default.
 */
export default function SaarthiMark({ variant, size = 32 }: { variant: 'light' | 'dark'; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const domeId = `sm-dome-${uid}`;
  const domeDeepId = `sm-domeDeep-${uid}`;
  const saffronId = `sm-saffron-${uid}`;

  return (
    <svg width={size} height={size} viewBox="-6 -6 112 112" aria-hidden="true" style={{ flex: 'none' }}>
      <defs>
        <radialGradient id={domeId} cx="35%" cy="26%" r="80%">
          {DOME_STOPS[variant].map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </radialGradient>
        <radialGradient id={domeDeepId} cx="35%" cy="26%" r="80%">
          {DOME_DEEP_STOPS[variant].map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </radialGradient>
        <radialGradient id={saffronId} cx="35%" cy="28%" r="80%">
          {SAFFRON_STOPS.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill={`url(#${domeId})`} />
      <ellipse cx="36" cy="30" rx="16" ry="9" fill="#fff" opacity={variant === 'light' ? 0.4 : 0.15} style={{ filter: 'blur(6px)' }} />
      {BLADE_ANGLES.map((deg) => (
        <path key={deg} d={BLADE} fill={`url(#${domeDeepId})`} transform={`rotate(${deg} 50 50)`} />
      ))}
      <path d={BLADE} fill={`url(#${saffronId})`} transform="rotate(315 50 50)" />
      <circle cx="50" cy="50" r="9" fill={`url(#${domeDeepId})`} />
    </svg>
  );
}
