export default function PrismLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2L2 19H22L12 2Z"
        fill="url(#prism-gradient)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M12 2L12 19"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M12 8L17 19"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
      />
      <path
        d="M12 5L7 19"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
      />
      <circle cx="12" cy="2" r="1.5" fill="white" filter="url(#glow)" />

      <defs>
        <linearGradient id="prism-gradient" x1="12" y1="2" x2="12" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255, 255, 255, 0.2)" />
          <stop offset="1" stopColor="rgba(255, 255, 255, 0.05)" />
        </linearGradient>
        <filter id="glow" x="0" y="0" width="24" height="24" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
