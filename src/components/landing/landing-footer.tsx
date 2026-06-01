'use client';

import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Product',
    links: ['Finance', 'Supply Chain', 'People', 'Revenue', 'Reporting', 'Integrations'],
  },
  {
    title: 'Solutions',
    links: [
      'Public Companies',
      'Mid-Market',
      'Global Operations',
      'Manufacturing',
      'Professional Services',
    ],
  },
  {
    title: 'Resources',
    links: [
      'Documentation',
      'Changelog',
      'API Reference',
      'Trust Center',
      'Status',
      'Customer Stories',
    ],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Partners', 'Contact', 'Legal'],
  },
];

import { useTranslations } from 'next-intl';
export default function LandingFooter() {
  const t = useTranslations('marketing.footer');
  return (
    <footer className="relative z-10 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1240px] px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                  <path d="M5 5h7a7 7 0 0 1 0 14H5V5Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="14" cy="12" r="1.6" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold tracking-[-0.01em]">Deftra</span>
            </div>
            <p className="mt-4 max-w-[280px] text-[13px] leading-[1.55] text-neutral-500">
              The operating layer for the modern enterprise. Built in San Francisco, Berlin, and
              Singapore.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {c.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[13px] text-neutral-700 transition-colors hover:text-neutral-900"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 md:flex-row md:items-center">
          <div className="text-[12px] text-neutral-500">
            © 2026 Deftra Systems, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[12px] text-neutral-500">
            <Link href="#" className="hover:text-neutral-900">
              Privacy
            </Link>
            <Link href="#" className="hover:text-neutral-900">
              Terms
            </Link>
            <Link href="#" className="hover:text-neutral-900">
              Cookies
            </Link>
            <Link href="#" className="hover:text-neutral-900">
              DPA
            </Link>
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span>SOC 2 · ISO 27001 · GDPR</span>
          </div>
        </div>
      </div>

      {/* Massive watermark */}
      <div
        aria-hidden
        className="pointer-events-none flex select-none items-end justify-center overflow-hidden pb-2"
      >
        <span className="bg-gradient-to-b from-neutral-200 to-transparent bg-clip-text text-[clamp(80px,16vw,200px)] font-semibold leading-[0.85] tracking-[-0.05em] text-transparent">
          deftra
        </span>
      </div>
    </footer>
  );
}
