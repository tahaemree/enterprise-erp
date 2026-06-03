"use client"

import { Suspense, useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Link, useRouter } from "@/i18n/navigation"
import { ArrowRight, Mail, Loader2, AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"

import AuthShell from "@/components/landing/auth-shell"
import { TextField, PasswordField, SocialButton } from "@/components/landing/auth-inputs"
import { login } from "@/lib/actions/auth"

function LoginForm() {
    const [mode, setMode] = useState<"password" | "magic">("password")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [magicSent, setMagicSent] = useState(false)
    
    const router = useRouter()
    const t = useTranslations("marketing.auth")

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        if (mode === "magic") {
            // Magic link UI state only
            setLoading(true)
            await new Promise((r) => setTimeout(r, 900))
            setMagicSent(true)
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("email", email)
            formData.append("password", password)
            const locale = document.documentElement.lang || "en"
            formData.append("locale", locale)

            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                router.push(`/${locale}/dashboard`)
            }
        } catch (err) {
            if (err instanceof Error && err.message?.includes("NEXT_REDIRECT")) return
            setError(t("unexpectedError") || "An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            variant="login"
            title={t("loginTitle")}
            subtitle={t("loginSubtitle")}
            footer={
                <>
                    {t("newTo")}{" "}
                    <Link
                        href="/register"
                        className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                    >
                        {t("createAcc")}
                    </Link>
                </>
            }
        >
            <div className="space-y-2.5">
                <SocialButton provider="google" />
                <SocialButton provider="sso" />
            </div>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                <div className="h-px flex-1 bg-neutral-200" />
                {t("orWithEmail")}
                <div className="h-px flex-1 bg-neutral-200" />
            </div>

            {/* Mode toggle */}
            <div className="mb-4 inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-[12px]">
                <button
                    type="button"
                    onClick={() => {
                        setMode("password")
                        setMagicSent(false)
                        setError(null)
                    }}
                    className={`relative rounded-md px-3 py-1.5 font-medium transition-colors ${
                        mode === "password" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                    {mode === "password" && (
                        <motion.span
                            layoutId="auth-mode-pill"
                            className="absolute inset-0 rounded-md bg-white shadow-sm"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                    )}
                    <span className="relative">{t("password")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setMode("magic")
                        setError(null)
                    }}
                    className={`relative rounded-md px-3 py-1.5 font-medium transition-colors ${
                        mode === "magic" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                    {mode === "magic" && (
                        <motion.span
                            layoutId="auth-mode-pill"
                            className="absolute inset-0 rounded-md bg-white shadow-sm"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                    )}
                    <span className="relative">{t("magicLink")}</span>
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <TextField
                    label={t("emailLabel")}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="admin@deftra.com"
                    autoComplete="email"
                    required
                />

                <AnimatePresence mode="wait" initial={false}>
                    {mode === "password" ? (
                        <motion.div
                            key="pw"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                        >
                            <PasswordField
                                label={t("passwordLabel")}
                                value={password}
                                onChange={setPassword}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                rightSlot={
                                    <a
                                        href="#"
                                        className="text-[12px] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                                    >
                                        {t("forgot")}
                                    </a>
                                }
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="magic-info"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3"
                        >
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                            <div className="text-[12.5px] leading-[1.5] text-neutral-600">
                                {t("noPassword")}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700 flex items-center gap-2"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </motion.div>
                    )}
                    {magicSent && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700"
                        >
                            {t("checkInbox")} <strong>{email}</strong>.
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-neutral-900 px-4 py-2.5 text-[14px] font-medium text-white transition-all hover:bg-neutral-800 disabled:opacity-60"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <span>{mode === "magic" ? t("sendMagic") : t("signIn")}</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                    )}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    />
                </button>
            </form>
            
            {process.env.NODE_ENV !== "production" && (
                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                    <p className="text-xs text-slate-500">Demo Login: admin@deftra.com / admin123</p>
                </div>
            )}
        </AuthShell>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
