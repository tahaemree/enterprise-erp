'use client';

import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

export default function TestimonialSection() {
  return (
    <section id="customers" className="relative py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-10 md:p-14"
        >
          {/* Soft gradient backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.18), transparent 60%)',
              filter: 'blur(10px)',
            }}
          />

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-[1fr_280px] md:gap-16">
            <div>
              <Quote className="h-5 w-5 text-emerald-600" />
              <p className="mt-5 text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.32] tracking-[-0.018em] text-neutral-900">
                “We retired eleven systems in nine months. Our month-end close went from 23 days to
                under one. Deftra is the first piece of enterprise software in a decade that our
                finance and engineering teams both genuinely{' '}
                <em className="not-italic text-emerald-700">love</em>.”
              </p>
              <div className="mt-7 flex items-center gap-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-900 text-[12px] font-medium text-white">
                  ER
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-neutral-900">Elena Reyes</div>
                  <div className="text-[12.5px] text-neutral-500">
                    Chief Financial Officer · Northwind Industries (NYSE: NWI)
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <StatBlock value="23 → 0.9" label="Days to close" />
              <StatBlock value="$4.1M" label="Annual savings" />
              <StatBlock value="11" label="Systems retired" />
              <StatBlock value="9 mo" label="To full rollout" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <div className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-900 tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[11.5px] uppercase tracking-wider text-neutral-500">{label}</div>
    </div>
  );
}
