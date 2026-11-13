import type { ReactNode } from 'react';
import {
  BarChart3,
  CheckCircle,
  Handshake,
  Users,
} from 'lucide-react';
import { EnterpriseCrmIcon, RocketIcon } from '@/components/ui/Icons';

export const HERO_FEATURES = [
  {
    id: 'track-leads',
    title: 'Track',
    subtitle: 'Leads',
    icon: BarChart3,
  },
  {
    id: 'manage-customers',
    title: 'Manage',
    subtitle: 'Customers',
    icon: Users,
  },
  {
    id: 'close-deals',
    title: 'Close',
    subtitle: 'Deals',
    icon: Handshake,
  },
  {
    id: 'boost-performance',
    title: 'Boost',
    subtitle: 'Performance',
    icon: CheckCircle,
  },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  showHeroFeatures?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  showHeroFeatures = true,
}: AuthLayoutProps) {
  return (
    <div className="relative h-screen w-screen overflow-y-auto overflow-x-hidden font-sans bg-[#020b1c] text-white selection:bg-blue-600 selection:text-white">
      {/* High-Resolution Hero Background Image Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* The Exact Inside Image: Smiling Businessman at Laptop + Neon Holographic Chart */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90 saturate-[1.1] transition-all duration-500"
          style={{ backgroundImage: `url('/images/auth-hero-bg.jpg')` }}
        />

        {/* Sophisticated Vignette Overlays that keep the central businessman crystal-clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020816]/95 via-[#020b1c]/50 to-transparent lg:w-[48%]" />
        <div className="absolute inset-0 left-auto right-0 bg-gradient-to-l from-[#020816]/90 via-[#030e22]/50 to-transparent lg:w-[45%]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#020816]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020816]/90 to-transparent" />
        {/* Ambient Electric Blue Glows matching reference image */}
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-1/3 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl pointer-events-none" />
      </div>

      {/* FIXED TOP HEADER */}
      <header className="relative z-30 w-full px-6 py-6 sm:px-10 lg:px-14 flex items-center justify-between">
        {/* Brand Logo: Enterprise CRM (matching Image 2) */}
        <div className="flex items-center gap-2.5">
          <EnterpriseCrmIcon className="h-9 w-auto text-blue-500 drop-shadow-[0_0_12px_rgba(11,163,248,0.6)]" />

          <div className="leading-tight">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Enterprise <span className="text-blue-500">CRM</span>
            </h1>
            <p className="text-xs font-medium tracking-wide text-gray-400">
              Connect · Manage · Grow
            </p>
          </div>
        </div>
      </header>

      {/* TWO-COLUMN GRID LAYOUT */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pb-12 pt-2 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* LEFT COLUMN: HERO HEADLINE, 4 FEATURE CARDS, & ROCKET PRIORITY BADGE */}
        <section className="lg:col-span-7 flex flex-col justify-between py-2 space-y-8 lg:space-y-10">
          <div>
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-bold leading-tight tracking-tight text-white">
              Welcome{' '}
              <span className="text-blue-500 drop-shadow-[0_2px_15px_rgba(59,130,246,0.5)]">
                Back!
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-base sm:text-lg leading-relaxed text-gray-300">
              Sign in to your CRM account and continue managing your sales journey.
            </p>
          </div>

          {/* 4 Feature Cards with Exact Icons & Text matching Reference Image */}
          {showHeroFeatures && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg">
              {HERO_FEATURES.map(({ id, title: featureTitle, subtitle: featureSub, icon: Icon }) => (
                <div
                  key={id}
                  className="group rounded-2xl border border-blue-400/20 bg-blue-950/40 hover:border-blue-400/60 hover:bg-blue-900/50 p-3.5 text-center backdrop-blur-md transition-all duration-300 shadow-lg shadow-blue-950/40 hover:-translate-y-1.5 hover:shadow-cyan-500/20 active:scale-95 cursor-pointer"
                >
                  {/* Glowing Icon Container */}
                  <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-400/30 text-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-600/30 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.45)] transition-all duration-300">
                    <Icon size={22} />
                  </div>

                  {/* Title & Subtitle */}
                  <p className="text-xs font-semibold leading-tight text-white group-hover:text-blue-300 transition-colors">
                    {featureTitle}
                  </p>
                  <p className="text-[11px] font-medium mt-0.5 leading-tight text-gray-400 group-hover:text-gray-300 transition-colors">
                    {featureSub}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Message: Rocket & "Your Success is Our Priority" */}
          <div className="pt-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] cursor-pointer">
                <RocketIcon className="h-6 w-6 text-blue-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
              </div>

              <div className="leading-tight">
                <p className="text-sm text-gray-400">
                  Your Success
                </p>
                <p className="text-sm sm:text-base font-semibold">
                  <span className="text-gray-300">is </span>
                  <span className="relative text-blue-400">
                    Our Priority
                    <svg
                      className="absolute -bottom-1 left-0 w-full h-1 text-blue-400/80 overflow-visible"
                      viewBox="0 0 100 4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0 2C30 4 70 4 100 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-8 text-xs text-gray-500">
              &copy; 2026 Enterprise CRM. All rights reserved.
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN: FLOATING GLASSMORPHIC SIGN-IN CARD */}
        <section className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="relative w-full max-w-[440px] rounded-3xl p-7 sm:p-10 border border-blue-400/30 bg-slate-900/75 shadow-[0_0_50px_rgba(30,64,175,0.4),0_20px_50px_rgba(0,0,0,0.85)] hover:border-blue-400/50 hover:shadow-[0_0_60px_rgba(30,64,175,0.55)] transition-all duration-500 backdrop-blur-2xl overflow-hidden animate-fade-in">
            {/* Top ambient highlight line */}
            <div
              className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
              aria-hidden="true"
            />

            {/* Card Header with Centered Enterprise CRM Icon */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-1 flex items-center justify-center">
                <EnterpriseCrmIcon className="h-14 w-auto text-blue-500 drop-shadow-[0_0_16px_rgba(11,163,248,0.7)]" />
              </div>

              <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
                {title}
              </h3>
              <p className="mt-1.5 text-sm max-w-xs text-gray-400">
                {subtitle}
              </p>
            </div>

            {/* Form Content / Interactive Body */}
            <div className="mt-6">{children}</div>

            {/* Card Footer */}
            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
