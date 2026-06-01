'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CtaSection() {
  const t = useTranslations('landing.cta');
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-[1240px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] p-12 md:p-20 shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
        >
          {/* Sweep highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(800px 400px at 50% -10%, rgba(99,102,241,0.25), transparent 70%), radial-gradient(700px 300px at 100% 110%, rgba(168,85,247,0.15), transparent 60%)',
            }}
          />
          {/* Background noise */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative mx-auto max-w-[720px] text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              Ready when you are
            </span>
            <h2 className="mt-8 text-[clamp(40px,5vw,64px)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              {t('title')}
            </h2>
            <p className="mx-auto mt-6 max-w-[560px] text-[18px] leading-[1.6] text-white/60 font-light">
              {t('subtitle')}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-8 py-4 text-[16px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                <span className="relative z-10">{t('button')}</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            
            <div className="mt-8 flex justify-center text-[13px] text-white/40 gap-4">
              <span>No credit card</span>
              <span>·</span>
              <span>SSO + SCIM included</span>
              <span>·</span>
              <span>Dedicated VPC available</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
