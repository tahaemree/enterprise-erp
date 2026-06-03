import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

    // Sample 10% of transactions in production to control cost/volume; full
    // sampling in development. Override via SENTRY_TRACES_SAMPLE_RATE if needed.
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : process.env.NODE_ENV === "production"
          ? 0.1
          : 1,

    // KVKK: never attach user IP / cookies / request headers automatically.
    sendDefaultPii: false,

    debug: false,
})
