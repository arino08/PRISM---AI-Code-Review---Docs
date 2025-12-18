export default function PrismLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main prism triangle - geometric and sharp */}
      <path
        d="M16 4L6 28H26L16 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Light refraction lines - the prism effect */}
      <path
        d="M16 4L10 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <path
        d="M16 4L22 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      {/* Center vertical for symmetry */}
      <path
        d="M16 4L16 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
    </svg>
  );
}
