'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function LandingNav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ['rgba(5,5,5,0)', 'rgba(10,10,10,0.6)']);
  const border = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)']);

  const t = useTranslations('landing.nav');

  const links = [
    { label: t('features'), href: '#features' },
    { label: t('customers'), href: '#customers' },
    { label: t('pricing'), href: '#pricing' },
  ];

  return (
    <motion.header
      style={{
        backgroundColor: bg,
        borderBottomColor: border,
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
      className="fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500"
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <DeftraMark />
          <span className="text-[16px] font-bold tracking-tight text-white">
            Deftra
          </span>
          <span className="ml-1 hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:inline-block">
            2.0
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-4 py-2 text-[14px] font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="mr-2">
            <LanguageSwitcher />
          </div>
          <Link
            href="/login"
            className="hidden rounded-md px-4 py-2 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:inline-block"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[14px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {t('signup')}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function DeftraMark() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner ring-1 ring-white/20">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white drop-shadow-md" fill="none">
        <path
          d="M5 5h7a7 7 0 0 1 0 14H5V5Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="12" r="1.6" fill="currentColor" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.3), transparent 60%)',
        }}
      />
    </div>
  );
}
