interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#26a69a" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a2332" />
          <stop offset="100%" stopColor="#0d1117" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="url(#bgGradient)" stroke="url(#chartGradient)" strokeWidth="2" />

      {/* Candlestick 1 (red/down) */}
      <rect x="14" y="28" width="6" height="16" rx="1" fill="#ef5350" opacity="0.8" />
      <line x1="17" y1="24" x2="17" y2="28" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="44" x2="17" y2="48" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" />

      {/* Candlestick 2 (green/up) */}
      <rect x="24" y="22" width="6" height="14" rx="1" fill="url(#chartGradient)" />
      <line x1="27" y1="18" x2="27" y2="22" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      <line x1="27" y1="36" x2="27" y2="42" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />

      {/* Candlestick 3 (green/up - taller) */}
      <rect x="34" y="16" width="6" height="18" rx="1" fill="url(#chartGradient)" />
      <line x1="37" y1="12" x2="37" y2="16" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="34" x2="37" y2="40" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />

      {/* Candlestick 4 (green/up - tallest) */}
      <rect x="44" y="12" width="6" height="20" rx="1" fill="url(#chartGradient)" />
      <line x1="47" y1="8" x2="47" y2="12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <line x1="47" y1="32" x2="47" y2="38" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />

      {/* Upward trend line */}
      <path
        d="M12 46 L22 38 L32 30 L42 22 L52 14"
        stroke="url(#chartGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />

      {/* Arrow head */}
      <path
        d="M48 12 L52 14 L50 18"
        stroke="url(#chartGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
