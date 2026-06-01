'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { SectionHeader } from './bento-features';
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
  {
    eyebrow: '01 · Connect',
    title: 'Unify every system of record.',
    copy: 'Native connectors to NetSuite, SAP S/4HANA, Workday, Snowflake, Salesforce, Stripe, and 500+ more. Deftra reconciles entities across systems on a single canonical graph.',
    chip: 'Live sync',
  },
  {
    eyebrow: '02 · Compose',
    title: 'Model workflows like code.',
    copy: 'A visual builder backed by a typed SDK. Branch, review, and ship business processes the same way your engineers ship features.',
    chip: 'Versioned',
  },
  {
    eyebrow: '03 · Operate',
    title: 'Run the business in one console.',
    copy: 'Every team — finance, supply, people, revenue — operates on the same plane. No more handoffs, no more reconciliation tickets.',
    chip: 'Single source',
  },
];

export default function WorkflowSection() {
  const t = useTranslations('marketing.workflow');
  return (
    <section id="workflows" className="relative py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <SectionHeader
          eyebrow="How it works"
          title="Connect. Compose. Operate."
          description="A three-stage journey that takes you from disparate systems to a single operating layer — in weeks, not multi-year transformation programs."
        />

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
          <StepList />
          <StickyVisual />
        </div>
      </div>
    </section>
  );
}

function StepList() {
  return (
    <div className="space-y-16">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.eyebrow}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
          className="border-l border-neutral-200 pl-6"
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {s.eyebrow}
          </div>
          <h3 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-neutral-900">
            {s.title}
          </h3>
          <p className="mt-3 max-w-[460px] text-[14.5px] leading-[1.6] text-neutral-600">
            {s.copy}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            {s.chip}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function StickyVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <div ref={ref} className="relative">
      <motion.div
        style={{ y }}
        className="sticky top-32 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2 text-[12px] text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            workflow · close-of-month-fy26-q1
          </div>
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10.5px] font-mono text-neutral-500">
            v3.2.1
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <WorkflowRow
            done
            label="Sync sub-ledgers from NetSuite + S/4HANA"
            detail="6.2M rows · 4.1s"
          />
          <WorkflowRow
            done
            label="Reconcile FX positions against treasury feed"
            detail="Bloomberg · 09:00 UTC"
          />
          <WorkflowRow done label="Post intercompany eliminations" detail="42 entities" />
          <WorkflowRow
            active
            label="Generate consolidated P&L (US GAAP)"
            detail="3 of 4 entities"
          />
          <WorkflowRow label="Distribute to Audit Committee dataroom" detail="Pending approval" />
          <WorkflowRow label="Lock period · open FY26 Q2" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Manual steps" value="2" hint="of 14 total" />
          <Stat label="Time to close" value="6.3h" hint="-71% vs. legacy" />
          <Stat label="Error rate" value="0.001%" hint="auto-flagged" />
        </div>
      </motion.div>
    </div>
  );
}

function WorkflowRow({
  label,
  detail,
  done,
  active,
}: {
  label: string;
  detail?: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-50">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : active ? (
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/30" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Circle className="h-4 w-4 text-neutral-300" />
      )}
      <span
        className={`flex-1 text-[13px] ${
          done ? 'text-neutral-500 line-through decoration-neutral-300' : 'text-neutral-800'
        }`}
      >
        {label}
      </span>
      {detail && <span className="text-[11.5px] text-neutral-400">{detail}</span>}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="mt-1 text-[16px] font-semibold tracking-tight text-neutral-900">{value}</div>
      {hint && <div className="mt-0.5 text-[10.5px] text-neutral-500">{hint}</div>}
    </div>
  );
}
