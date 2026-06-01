'use client';

import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { SectionHeader } from './bento-features';

const METRICS = [
  { value: 99.99, suffix: '%', label: 'Platform uptime', detail: 'Multi-region active-active' },
  { value: 38, suffix: 'ms', label: 'p99 API latency', detail: 'Across 14 global edges' },
  { value: 600, suffix: '+', label: 'Enterprise customers', detail: 'In 47 countries' },
  {
    value: 4.2,
    suffix: 'B',
    prefix: '$',
    label: 'Processed monthly',
    detail: 'In transactions & payroll',
  },
];

export default function MetricsSection() {
  const t = useTranslations('marketing.metrics');
  return (
    <section id="metrics" className="relative py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <SectionHeader
          eyebrow="{t('title')}"
          title="Numbers that hold up under audit."
          description="Deftra runs the operations of public companies, sovereign agencies, and the world's largest private operators."
        />

        <div className="mt-14 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-10 md:grid-cols-4 md:gap-10">
          {METRICS.map((m, i) => (
            <MetricCell key={m.label} metric={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCell({ metric, index }: { metric: (typeof METRICS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (latest) => {
    const v = metric.value;
    const decimals = v % 1 !== 0 ? 2 : 0;
    return `${metric.prefix ?? ''}${latest.toFixed(decimals)}${metric.suffix ?? ''}`;
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, metric.value, {
      duration: 1.6,
      delay: 0.05 * index,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [inView, metric.value, mv, index]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.7, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.div className="text-[clamp(34px,4.4vw,56px)] font-semibold leading-[1] tracking-[-0.035em] text-neutral-900 tabular-nums">
        {display}
      </motion.div>
      <div className="mt-3 text-[14px] font-medium text-neutral-700">{metric.label}</div>
      <div className="mt-1 text-[12.5px] text-neutral-500">{metric.detail}</div>
    </motion.div>
  );
}
