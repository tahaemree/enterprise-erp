'use client';

import { motion } from 'motion/react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Layers,
  TrendingUp,
} from 'lucide-react';

/**
 * The cinematic hero canvas — a glassmorphic dashboard that "assembles"
 * itself from thin air on mount, with connecting glowing nodes underneath.
 */
export default function HeroCanvas() {
  return (
    <div className="relative">
      {/* Outer halo */}
      <div
        aria-hidden
        className="absolute -inset-x-12 -inset-y-10 -z-10 opacity-80"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(16,185,129,0.10), transparent 70%), radial-gradient(70% 70% at 80% 30%, rgba(56,189,248,0.10), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Connecting node web */}
      <NodeWeb />

      {/* Dashboard frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/70 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18),0_2px_4px_rgba(15,23,42,0.04)] backdrop-blur-xl"
      >
        {/* Subtle inner border glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 0 0 1px rgba(15,23,42,0.02)',
          }}
        />

        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 bg-neutral-50/70 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            app.deftra.com / operations
          </div>
          <div className="text-[11px] text-neutral-400">FY26 · Q1</div>
        </div>

        {/* Dashboard body */}
        <div className="grid grid-cols-12 gap-3 p-4 sm:p-5">
          {/* Sidebar */}
          <Reveal delay={0.4} className="col-span-2 hidden flex-col gap-1 sm:flex">
            {['Overview', 'Finance', 'Supply', 'People', 'Revenue', 'Reports'].map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] ${
                  i === 0 ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === 0 ? 'bg-emerald-400' : 'bg-neutral-300'
                  }`}
                />
                {label}
              </div>
            ))}
          </Reveal>

          {/* Main */}
          <div className="col-span-12 sm:col-span-10">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard
                delay={0.5}
                label="Net Revenue"
                value="$48.21M"
                delta="+12.4%"
                up
                Icon={CircleDollarSign}
              />
              <KpiCard
                delay={0.58}
                label="Operating Margin"
                value="27.3%"
                delta="+1.8pp"
                up
                Icon={TrendingUp}
              />
              <KpiCard
                delay={0.66}
                label="Fulfillment SLA"
                value="99.71%"
                delta="-0.04%"
                up={false}
                Icon={Activity}
              />
              <KpiCard
                delay={0.74}
                label="WIP Inventory"
                value="$3.92M"
                delta="-4.1%"
                up
                Icon={Layers}
              />
            </div>

            {/* Chart + side */}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Reveal
                delay={0.82}
                className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                      Cash Position
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-[22px] font-semibold tracking-tight text-neutral-900">
                        $128.4M
                      </span>
                      <span className="text-[12px] font-medium text-emerald-600">+6.8% MoM</span>
                    </div>
                  </div>
                  <div className="flex gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 text-[10.5px]">
                    {['1W', '1M', '3M', '1Y'].map((t, i) => (
                      <span
                        key={t}
                        className={`rounded px-1.5 py-0.5 ${
                          i === 1 ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <LiveLineChart />
              </Reveal>

              <Reveal delay={0.95} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                  Top Movers
                </div>
                <div className="mt-3 space-y-2.5">
                  {MOVERS.map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.05 + i * 0.05, duration: 0.5 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700">
                          {m.tag}
                        </span>
                        <span className="text-[12.5px] text-neutral-700">{m.label}</span>
                      </div>
                      <span
                        className={`flex items-center gap-0.5 text-[12px] font-medium ${
                          m.up ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {m.up ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {m.delta}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating mini cards */}
      <FloatingCard delay={1.1} x="-6%" y="22%" className="hidden md:block">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400">Latency · API</div>
        <div className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-900">
          38<span className="text-[11px] text-neutral-500">ms p99</span>
        </div>
        <MiniBars />
      </FloatingCard>

      <FloatingCard delay={1.2} x="92%" y="64%" className="hidden md:block" align="right">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Real-time sync
        </div>
        <div className="mt-1 text-[12.5px] text-neutral-700">14,802 events / sec</div>
        <div className="mt-2 flex items-center gap-1">
          {[...Array(12)].map((_, i) => (
            <motion.span
              key={i}
              animate={{ scaleY: [0.4, 1, 0.6, 1, 0.5] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.08,
                ease: 'easeInOut',
              }}
              className="block h-3 w-[3px] origin-bottom rounded-sm bg-emerald-500/80"
            />
          ))}
        </div>
      </FloatingCard>
    </div>
  );
}

const MOVERS = [
  { tag: 'EU', label: 'EMEA Wholesale', delta: '+18.2%', up: true },
  { tag: 'NA', label: 'NA Direct', delta: '+9.4%', up: true },
  { tag: 'AP', label: 'APAC Retail', delta: '-2.1%', up: false },
  { tag: 'LA', label: 'LATAM B2B', delta: '+4.6%', up: true },
];

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  up,
  delay,
  Icon,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  delay: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Reveal delay={delay} className="rounded-xl border border-neutral-200 bg-white p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-400">{label}</span>
        <Icon className="h-3.5 w-3.5 text-neutral-400" />
      </div>
      <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-neutral-900">
        {value}
      </div>
      <div
        className={`mt-0.5 inline-flex items-center gap-0.5 text-[11.5px] font-medium ${
          up ? 'text-emerald-600' : 'text-rose-500'
        }`}
      >
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {delta}
      </div>
    </Reveal>
  );
}

function LiveLineChart() {
  // A handcrafted SVG line/area chart with animated draw + glowing dot.
  const W = 560;
  const H = 140;
  const points = [
    [0, 95],
    [40, 88],
    [80, 92],
    [120, 75],
    [160, 80],
    [200, 62],
    [240, 70],
    [280, 55],
    [320, 60],
    [360, 42],
    [400, 50],
    [440, 35],
    [480, 40],
    [520, 22],
    [560, 28],
  ];
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];

  return (
    <div className="mt-3 -mb-1 -mr-1 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H + 6}`} className="h-[140px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={H * g}
            y2={H * g}
            stroke="rgba(15,23,42,0.05)"
            strokeWidth={1}
          />
        ))}
        <motion.path
          d={area}
          fill="url(#areaFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.0 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="rgb(16,185,129)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
        />
        <motion.circle
          cx={last![0]}
          cy={last![1]}
          r={4}
          fill="rgb(16,185,129)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.3, duration: 0.4 }}
        />
        <motion.circle
          cx={last![0]}
          cy={last![1]}
          r={10}
          fill="rgb(16,185,129)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2.4 }}
        />
      </svg>
    </div>
  );
}

function MiniBars() {
  const heights = [6, 10, 7, 13, 9, 14, 11, 16];
  return (
    <div className="mt-1.5 flex h-5 items-end gap-[3px]">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 1.3 + i * 0.04 }}
          style={{ height: h }}
          className="block w-[3px] origin-bottom rounded-sm bg-neutral-900"
        />
      ))}
    </div>
  );
}

function FloatingCard({
  children,
  x,
  y,
  delay,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode;
  x: string;
  y: string;
  delay: number;
  className?: string;
  align?: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        left: align === 'left' ? x : undefined,
        right: align === 'right' ? '0%' : undefined,
        top: y,
        transform: align === 'right' ? `translate(0,0)` : undefined,
      }}
      className={`absolute z-20 w-[200px] rounded-xl border border-neutral-200 bg-white/90 p-3 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur ${className}`}
    >
      {children}
    </motion.div>
  );
}

function NodeWeb() {
  // Subtle constellation pulsing behind the dashboard
  const nodes = [
    { x: 8, y: 12 },
    { x: 22, y: 38 },
    { x: 14, y: 70 },
    { x: 42, y: 18 },
    { x: 50, y: 80 },
    { x: 70, y: 30 },
    { x: 82, y: 60 },
    { x: 92, y: 22 },
  ];
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [1, 3],
    [3, 5],
    [4, 2],
    [5, 6],
    [6, 7],
    [3, 6],
    [4, 5],
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70"
    >
      {links.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a]!.x}
          y1={nodes[a]!.y}
          x2={nodes[b]!.x}
          y2={nodes[b]!.y}
          stroke="rgba(16,185,129,0.35)"
          strokeWidth={0.15}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.3 + i * 0.08 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={0.45}
          fill="rgb(16,185,129)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </svg>
  );
}
