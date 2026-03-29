import { useId } from "react";

interface Props {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Premium shield badge icon for Serious Badge members.
 * Uses a gold gradient, inner highlight border, drop shadow, and a white
 * checkmark — visually consistent with the pricing card's Shield language.
 */
export function SeriousBadgeIcon({ size = 40, className = "", title = "Serious Badge" }: Props) {
  const uid = useId().replace(/:/g, "sb");
  const gradId   = `${uid}-grad`;
  const shadowId = `${uid}-shadow`;

  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        {/* Gold gradient — light topaz → warm amber */}
        <linearGradient id={gradId} x1="20" y1="3" x2="20" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FCEAA0" />
          <stop offset="45%"  stopColor="#F0B429" />
          <stop offset="100%" stopColor="#B07018" />
        </linearGradient>
        {/* Soft drop shadow */}
        <filter id={shadowId} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#92500A" floodOpacity="0.38" />
        </filter>
      </defs>

      {/* Shield body */}
      <path
        d="M20 3L36 10V24C36 34.5 28.5 42 20 45C11.5 42 4 34.5 4 24V10Z"
        fill={`url(#${gradId})`}
        filter={`url(#${shadowId})`}
      />

      {/* Inner highlight ring — creates depth / inner-glow feel */}
      <path
        d="M20 6.5L33 12.5V23.5C33 31.5 27 38 20 41C13 38 7 31.5 7 23.5V12.5Z"
        fill="none"
        stroke="rgba(255,252,210,0.5)"
        strokeWidth="1.25"
      />

      {/* White checkmark */}
      <path
        d="M13.5 25.5L18 30L26.5 20"
        stroke="rgba(255,255,255,0.96)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
