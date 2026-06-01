'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import AuthVisual from './auth-visual';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  variant,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  variant: 'login' | 'register';
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white font-inter text-neutral-900">
      {/* Premium ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:w-1/2">
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-emerald-400/10 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-blue-400/10 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] left-[20%] h-[40%] w-[40%] rounded-full bg-violet-400/10 blur-[100px]"
        />
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left — form */}
        <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to home
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                  <path d="M5 5h7a7 7 0 0 1 0 14H5V5Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="14" cy="12" r="1.6" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[14px] font-semibold tracking-[-0.01em]">Deftra</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[420px] py-12"
            >
              {/* Glass card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -top-px h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent)',
                  }}
                />
                <h1 className="text-[24px] font-semibold tracking-[-0.018em] text-neutral-900">
                  {title}
                </h1>
                <p className="mt-1.5 text-[13.5px] text-neutral-500">{subtitle}</p>

                <div className="mt-6">{children}</div>
              </div>

              <div className="mt-6 text-center text-[13px] text-neutral-500">{footer}</div>

              <div className="mt-8 flex items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  SOC 2 Type II
                </span>
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                <span>ISO 27001</span>
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                <span>GDPR</span>
              </div>
            </motion.div>
          </div>

          <div className="mt-auto pt-6 text-[12px] text-neutral-400">
            © 2026 Deftra Systems, Inc.
          </div>
        </div>

        {/* Right — animated visual */}
        <div className="relative hidden overflow-hidden border-l border-neutral-200 bg-neutral-950 lg:block">
          <AuthVisual variant={variant} />
        </div>
      </div>
    </div>
  );
}
