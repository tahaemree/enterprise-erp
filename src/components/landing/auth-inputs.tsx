'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export function TextField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  rightSlot,
  error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
  error?: string | null;
}) {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;

  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-neutral-700">{label}</span>
        {rightSlot}
      </div>
      <div
        className={`relative flex items-center rounded-lg border bg-white transition-all ${
          error
            ? 'border-rose-300 ring-2 ring-rose-100'
            : focused
              ? 'border-neutral-900 ring-2 ring-neutral-100'
              : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent px-3.5 py-2.5 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        {/* Filled indicator */}
        <AnimatePresence>
          {filled && !error && (
            <motion.span
              key="filled"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              className="pr-3 text-emerald-500"
            >
              <Check className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="mt-1.5 flex items-center gap-1 text-[12px] text-rose-600"
          >
            <X className="h-3 w-3" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </label>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  showStrength,
  rightSlot,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  showStrength?: boolean;
  rightSlot?: React.ReactNode;
  error?: string | null;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const strength = computeStrength(value);

  return (
    <div>
      <label className="block">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-neutral-700">{label}</span>
          {rightSlot}
        </div>
        <div
          className={`relative flex items-center rounded-lg border bg-white transition-all ${
            error
              ? 'border-rose-300 ring-2 ring-rose-100'
              : focused
                ? 'border-neutral-900 ring-2 ring-neutral-100'
                : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required}
            className="w-full bg-transparent px-3.5 py-2.5 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="pr-3 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {showStrength && <PasswordStrength strength={strength} hasValue={value.length > 0} />}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="mt-1.5 flex items-center gap-1 text-[12px] text-rose-600"
          >
            <X className="h-3 w-3" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Strength = {
  score: number; // 0-4
  label: string;
  color: string;
  checks: { label: string; ok: boolean }[];
};

function computeStrength(pw: string): Strength {
  const checks = [
    { label: '8+ characters', ok: pw.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(pw) },
    { label: 'Number', ok: /\d/.test(pw) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const colors = [
    'rgb(244,63,94)',
    'rgb(244,63,94)',
    'rgb(245,158,11)',
    'rgb(16,185,129)',
    'rgb(16,185,129)',
  ];
  return { score, label: labels[score] || 'Unknown', color: colors[score] || '#000', checks };
}

function PasswordStrength({ strength, hasValue }: { strength: Strength; hasValue: boolean }) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => {
          const active = hasValue && i < Math.max(strength.score, 0);
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                backgroundColor: active ? strength.color : 'rgb(229,231,235)',
              }}
              transition={{ duration: 0.3 }}
              className="h-1 flex-1 rounded-full"
            />
          );
        })}
      </div>
      <AnimatePresence>
        {hasValue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11.5px] font-medium" style={{ color: strength.color }}>
                {strength.label}
              </span>
              <span className="text-[10.5px] text-neutral-400">
                {strength.score}/4 criteria met
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {strength.checks.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-1.5 text-[11px] text-neutral-500"
                >
                  <motion.span
                    initial={false}
                    animate={{
                      backgroundColor: c.ok ? 'rgb(16,185,129)' : 'rgb(229,231,235)',
                      scale: c.ok ? 1 : 0.9,
                    }}
                    className="grid h-3 w-3 place-items-center rounded-full"
                  >
                    {c.ok && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                  </motion.span>
                  <span className={c.ok ? 'text-neutral-700' : ''}>{c.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SocialButton({
  provider,
  onClick,
  disabled,
}: {
  provider: 'google' | 'github' | 'sso';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cfg = {
    google: {
      label: 'Continue with Google',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2 0-3.4 2.7-6.2 6-6.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.8 2.2 2.5 6.4 2.5 12s4.3 9.8 9.5 9.8c5.5 0 9.1-3.8 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
          />
        </svg>
      ),
    },
    github: {
      label: 'Continue with GitHub',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-900">
          <path
            fill="currentColor"
            d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
          />
        </svg>
      ),
    },
    sso: {
      label: 'Continue with SSO (SAML)',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-700" fill="none">
          <path
            d="M12 2 4 6v6c0 4 3.4 8 8 10 4.6-2 8-6 8-10V6l-8-4Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      ),
    },
  }[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-[13.5px] font-medium text-neutral-800 transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}
