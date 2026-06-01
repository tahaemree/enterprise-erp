'use client';

import { motion } from 'motion/react';
import { ShieldCheck, Activity, Lock, Globe2 } from 'lucide-react';

/**
 * Looping hypnotic visual — orbiting rings of nodes around a central
 * "secure core" pulse. Reflects Security + Performance.
 */
export default function AuthVisual({ variant }: { variant: 'login' | 'register' }) {
  const headline =
    variant === 'login'
      ? 'Welcome back to your operating layer.'
      : 'The operating layer your enterprise deserves.';
  const subtitle =
    variant === 'login'
      ? 'Pick up exactly where you left off — your dashboards, workflows, and approvals are waiting.'
      : 'Set up a tenant in under two minutes. Bring your team, your data, and your favorite systems.';

  return (
    <div className="relative h-full w-full">
      {/* glow backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 50%, rgba(16,185,129,0.20), transparent 70%), radial-gradient(70% 60% at 80% 80%, rgba(56,189,248,0.16), transparent 70%)',
        }}
      />
      {/* fine grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(60% 60% at 50% 50%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 50%, black, transparent 80%)',
        }}
      />

      {/* Orbiting rings */}
      <div className="absolute inset-0 grid place-items-center">
        <OrbitalSystem />
      </div>

      {/* Floating callouts */}
      <FloatingCallout
        x="8%"
        y="14%"
        delay={0.4}
        icon={<Lock className="h-3.5 w-3.5 text-emerald-300" />}
        title="Zero-trust auth"
        sub="Hardware-backed keys · 2FA"
      />
      <FloatingCallout
        x="68%"
        y="20%"
        delay={0.6}
        icon={<Globe2 className="h-3.5 w-3.5 text-emerald-300" />}
        title="14 regions"
        sub="38ms p99 globally"
        align="right"
      />
      <FloatingCallout
        x="12%"
        y="68%"
        delay={0.8}
        icon={<Activity className="h-3.5 w-3.5 text-emerald-300" />}
        title="99.99% uptime"
        sub="Active-active failover"
      />
      <FloatingCallout
        x="72%"
        y="74%"
        delay={1.0}
        icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />}
        title="SOC 2 · ISO 27001"
        sub="Continuously audited"
        align="right"
      />

      {/* Bottom copy */}
      <div className="absolute inset-x-0 bottom-0 px-14 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[440px]"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/70 backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Secure by default
          </div>
          <h2 className="mt-4 text-[26px] font-semibold leading-[1.15] tracking-[-0.022em] text-white">
            {headline}
          </h2>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-white/55">{subtitle}</p>
        </motion.div>
      </div>
    </div>
  );
}

function OrbitalSystem() {
  // Three concentric orbits with nodes
  const rings = [
    { size: 180, count: 4, dur: 22, color: 'rgba(16,185,129,0.85)' },
    { size: 300, count: 6, dur: 34, color: 'rgba(56,189,248,0.75)' },
    { size: 440, count: 8, dur: 48, color: 'rgba(255,255,255,0.7)' },
  ];

  return (
    <div className="relative h-[520px] w-[520px]">
      {/* Center pulse */}
      <div className="absolute inset-0 grid place-items-center">
        <CenterPulse />
      </div>

      {rings.map((r, idx) => (
        <motion.div
          key={idx}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: r.size,
            height: r.size,
            marginLeft: -r.size / 2,
            marginTop: -r.size / 2,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: r.dur, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: r.count }).map((_, i) => {
            const angle = (i / r.count) * 360;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `rotate(${angle}deg) translateX(${r.size / 2}px)`,
                }}
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2 + idx * 0.3,
                  }}
                  className="block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: r.color,
                    boxShadow: `0 0 12px ${r.color}`,
                  }}
                />
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

function CenterPulse() {
  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.4), transparent 70%)',
        }}
      />
      <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl">
        <motion.div
          className="absolute inset-2 rounded-xl"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{
            boxShadow: '0 0 0 1px rgba(16,185,129,0.5), inset 0 0 24px rgba(16,185,129,0.18)',
          }}
        />
        <svg viewBox="0 0 24 24" className="relative h-9 w-9 text-emerald-300" fill="none">
          <path d="M5 5h7a7 7 0 0 1 0 14H5V5Z" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="14" cy="12" r="1.6" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function FloatingCallout({
  x,
  y,
  delay,
  icon,
  title,
  sub,
  align = 'left',
}: {
  x: string;
  y: string;
  delay: number;
  icon: React.ReactNode;
  title: string;
  sub: string;
  align?: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ left: x, top: y }}
      className={`absolute z-10 ${align === 'right' ? 'text-right' : ''}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay, ease: 'easeInOut' }}
        className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 backdrop-blur"
      >
        <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
          {icon}
          <span className="text-[12px] font-semibold text-white">{title}</span>
        </div>
        <div className="mt-0.5 text-[10.5px] text-white/50">{sub}</div>
      </motion.div>
    </motion.div>
  );
}
