'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import HeroCanvas from './hero-canvas';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const t = useTranslations('landing.hero');

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative pt-[160px] pb-[80px]">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <motion.div
          style={{ y: headlineY, opacity: headlineOpacity }}
          className="relative z-10 mx-auto max-w-[900px] text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[13px] font-medium text-white/80 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-80" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            {t('badge')}
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </motion.div>

          <StaggerHeadline title1={t('title1')} title2={t('title2')} />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-8 max-w-[600px] text-[18px] leading-[1.6] text-white/60 font-light"
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10">{t('startTrial')}</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 text-indigo-400" />
              {t('viewDemo')}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-white/40"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              SOC 2 Type II
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>ISO 27001</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>KVKK & GDPR</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>%99.9 Uptime</span>
          </motion.div>
        </motion.div>

        {/* The cinematic canvas */}
        <motion.div
          style={{ scale, y, opacity }}
          className="relative z-0 mx-auto mt-24 max-w-[1200px]"
        >
          {/* Outer glow for the dashboard mockup */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-purple-500/0 blur-2xl opacity-50" />
          <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden ring-1 ring-white/5">
            <HeroCanvas />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StaggerHeadline({ title1, title2 }: { title1: string; title2: string }) {
  const lines = [title1.split(' '), title2.split(' ')];
  let i = 0;
  return (
    <h1 className="font-inter text-[clamp(44px,7vw,84px)] font-bold leading-[1.05] tracking-[-0.04em] text-white">
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((word, wi) => {
            const delay = 0.05 + i * 0.04;
            i += 1;
            const isAccent = li === 1; // Second line is accented
            return (
              <motion.span
                key={`${li}-${wi}`}
                initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 1,
                  delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`inline-block ${
                  isAccent
                    ? 'bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent'
                    : ''
                }`}
              >
                {word}
                {wi < line.length - 1 ? '\u00A0' : ''}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
