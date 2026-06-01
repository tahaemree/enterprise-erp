'use client';

import { motion } from 'motion/react';

const COMPANIES = [
  'NORTHWIND',
  'AXIOM⌖LABS',
  'HELIOS',
  'CONTINENTAL',
  'KINETIC',
  'ATLAS & CO',
  'OBSIDIAN',
  'MERIDIAN',
  'AURORA',
  'VANGUARD',
  'POLARIS',
  'CIPHER',
];

export default function LogosMarquee() {
  return (
    <section className="relative border-y border-neutral-200/80 bg-white/60 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-[1240px] px-6">
        <p className="mb-6 text-center text-[11.5px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Trusted by operators at 600+ enterprises in 47 countries
        </p>
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          <motion.div
            className="flex w-max gap-14 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
          >
            {[...COMPANIES, ...COMPANIES].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="text-[15px] font-semibold tracking-[0.18em] text-neutral-400 transition-colors hover:text-neutral-700"
              >
                {c}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
