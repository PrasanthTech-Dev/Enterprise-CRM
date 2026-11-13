import type { SVGProps } from 'react';

/**
 * Enterprise CRM official growth chart logo icon with 4 rising bars and sweeping upward zig-zag arrow.
 * Matches Image 2 reference specifications.
 */
export function EnterpriseCrmIcon({ className = 'w-9 h-8', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 50 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="ecrm-bar-color" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ba3f8" />
        </linearGradient>
        <linearGradient id="ecrm-arrow-color" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ba3f8" />
        </linearGradient>
        <filter id="ecrm-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0ba3f8" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* 4 Stepped Rising Bars */}
      <rect x="5" y="27" width="7" height="15" rx="2" fill="url(#ecrm-bar-color)" />
      <rect x="16" y="21" width="7" height="21" rx="2" fill="url(#ecrm-bar-color)" />
      <rect x="27" y="15" width="7" height="27" rx="2" fill="url(#ecrm-bar-color)" />
      <rect x="38" y="9" width="7" height="33" rx="2" fill="url(#ecrm-bar-color)" />

      {/* Upward Zig-Zag Trend Line with Arrow */}
      <path
        d="M5 25L18 12L25 19L41 3.5"
        stroke="url(#ecrm-arrow-color)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#ecrm-glow)"
      />
      {/* Arrowhead pointing top-right */}
      <path
        d="M32 3.5H41.5V13"
        stroke="url(#ecrm-arrow-color)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#ecrm-glow)"
      />
    </svg>
  );
}

/**
 * Authentic 4-color Google G icon
 */
export function GoogleIcon({ className = 'w-5 h-5', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

/**
 * Stylized Rocket icon with body, fin, window, and flame thrust matching reference image
 */
export function RocketIcon({ className = 'w-6 h-6', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="rocket-fuselage" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="rocket-thrust" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      {/* Flame thrust */}
      <path d="M11 37C9 41 7 45 13 43C16 42 19 39 17 35L11 37Z" fill="url(#rocket-thrust)" />
      {/* Fuselage */}
      <path
        d="M20 9C25 5 36 3 40 4C41 8 39 19 35 24L21 34C19 32 17 30 15 24L20 9Z"
        fill="url(#rocket-fuselage)"
      />
      {/* Fins */}
      <path d="M15 24L7 28C7 32 11 34 15 34L15 24Z" fill="#0284c7" />
      <path d="M35 24L39 32C43 32 45 28 41 24L35 24Z" fill="#0284c7" />
      {/* Cockpit Window */}
      <circle cx="28" cy="15" r="3.5" fill="#ffffff" />
      <circle cx="28" cy="15" r="2" fill="#38bdf8" />
    </svg>
  );
}
