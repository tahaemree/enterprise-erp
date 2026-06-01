'use client';

import { motion, useInView } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Boxes, GitBranch, Lock, ScanSearch, Users, Workflow } from 'lucide-react';

export default function BentoFeatures() {
  const t = useTranslations('landing.features');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  return (
    <section id="features" ref={ref} className="relative py-28">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <SectionHeader
          eyebrow={t('title')}
          title={t('subtitle')}
        />

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-[300px_300px]">
          <BentoCard inView={inView} delay={0.05} className="md:col-span-4 md:row-span-2">
            <FinanceTile />
          </BentoCard>

          <BentoCard inView={inView} delay={0.15} className="md:col-span-2">
            <FeatureTile
              icon={<Lock className="h-5 w-5" />}
              title={t('security.title')}
              copy={t('security.description')}
            />
          </BentoCard>

          <BentoCard inView={inView} delay={0.25} className="md:col-span-2">
            <FeatureTile
              icon={<GitBranch className="h-5 w-5" />}
              title={t('analytics.title')}
              copy={t('analytics.description')}
            />
          </BentoCard>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SmallFeatureCard
            inView={inView}
            delay={0.35}
            icon={<Workflow className="h-4 w-4" />}
            title={t('crm.title')}
            copy={t('crm.description')}
          />
          <SmallFeatureCard
            inView={inView}
            delay={0.45}
            icon={<ScanSearch className="h-4 w-4" />}
            title={t('inventory.title')}
            copy={t('inventory.description')}
          />
          <SmallFeatureCard
            inView={inView}
            delay={0.55}
            icon={<Users className="h-4 w-4" />}
            title={t('hr.title')}
            copy={t('hr.description')}
          />
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-[720px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-400"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 text-[clamp(32px,4vw,52px)] font-bold leading-[1.05] tracking-[-0.03em] text-white"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-[600px] text-[16px] leading-[1.6] text-white/60 font-light"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

function BentoCard({
  children,
  className = '',
  inView,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  inView: boolean;
  delay: number;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 transition-colors hover:border-white/20 ${className}`}
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      
      {/* Static Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60"
        style={{
          background:
            'radial-gradient(400px 250px at top right, rgba(99,102,241,0.08), transparent 60%)',
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

function FeatureTile({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-indigo-400 shadow-inner">
        {icon}
      </div>
      <h3 className="mt-8 text-[20px] font-semibold tracking-[-0.01em] text-white">
        {title}
      </h3>
      <p className="mt-3 max-w-[280px] text-[15px] leading-[1.6] text-white/50">{copy}</p>
    </div>
  );
}

function SmallFeatureCard({
  icon,
  title,
  copy,
  inView,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 transition-all hover:border-white/20 hover:bg-white/[0.02]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all group-hover:border-indigo-500/30 group-hover:text-indigo-400">
        {icon}
      </div>
      <div>
        <h4 className="text-[16px] font-semibold tracking-[-0.005em] text-white">{title}</h4>
        <p className="mt-1.5 text-[14px] leading-[1.6] text-white/50">{copy}</p>
      </div>
    </motion.div>
  );
}

/* -------------------- Tiles -------------------- */

function FinanceTile() {
  const t = useTranslations('landing.features.finance');
  
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            Live Sync
          </div>
          <h3 className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-white">
            {t('title')}
          </h3>
          <p className="mt-2 max-w-[420px] text-[16px] leading-[1.6] text-white/50">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Ledger preview */}
      <div className="relative mt-10 flex-1">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[12px] uppercase tracking-wider text-white/40 font-semibold">
            <span>General Ledger</span>
            <span>FY26 · Period 03</span>
          </div>
          <div className="mt-4 space-y-2">
            {LEDGER_ROWS.map((r, i) => (
              <motion.div
                key={r.acct}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-12 items-center gap-3 rounded-lg bg-white/5 px-4 py-3 text-[13px] border border-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="col-span-2 font-mono text-[12px] text-white/40">{r.acct}</span>
                <span className="col-span-5 text-white/90 font-medium">{r.label}</span>
                <span className="col-span-2 text-right text-white/40">{r.dept}</span>
                <span
                  className={`col-span-3 text-right font-semibold tabular-nums ${
                    r.amount.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {r.amount}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute -right-4 -top-4 rotate-3 rounded-xl border border-white/10 bg-[#111] px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Variance</div>
          <div className="mt-0.5 text-[16px] font-bold tabular-nums text-indigo-400">+0.04%</div>
        </div>
      </div>
    </div>
  );
}

const LEDGER_ROWS = [
  { acct: '4000-01', label: 'Recurring Revenue', dept: 'NA', amount: '$ 12,408,221' },
  { acct: '4100-02', label: 'Professional Services', dept: 'EMEA', amount: '$ 3,902,118' },
  { acct: '5200-04', label: 'Cost of Goods Sold', dept: 'APAC', amount: '-$ 4,118,920' },
  { acct: '6100-11', label: 'R&D — Platform', dept: 'NA', amount: '-$ 2,201,344' },
];
