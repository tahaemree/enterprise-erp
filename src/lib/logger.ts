import pino from "pino"

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal" | "trace"

export interface LogEntry {
    module?: string
    requestId?: string
    userId?: string
    tenantId?: string
    duration?: number
    error?: unknown
    [key: string]: unknown
}

const isDev = process.env.NODE_ENV !== "production"

// Create the base Pino logger
const baseLogger = pino({
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    transport: isDev
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
              },
          }
        : undefined, // JSON output for production
    formatters: {
        level: (label) => {
            return { level: label }
        },
    },
})

export function createLogger(moduleName?: string) {
    const childLogger = moduleName ? baseLogger.child({ module: moduleName }) : baseLogger

    // Maintain the same signature for backwards compatibility
    function log(level: LogLevel, message: string, meta?: Partial<LogEntry>) {
        if (meta) {
            childLogger[level](meta, message)
        } else {
            childLogger[level](message)
        }
    }

    return {
        trace: (message: string, meta?: Partial<LogEntry>) => log("trace", message, meta),
        debug: (message: string, meta?: Partial<LogEntry>) => log("debug", message, meta),
        info: (message: string, meta?: Partial<LogEntry>) => log("info", message, meta),
        warn: (message: string, meta?: Partial<LogEntry>) => log("warn", message, meta),
        error: (message: string, meta?: Partial<LogEntry>) => log("error", message, meta),
        fatal: (message: string, meta?: Partial<LogEntry>) => log("fatal", message, meta),
        // For direct access to pino instance if needed
        pino: childLogger,
    }
}

const defaultLogger = createLogger("app")

export default defaultLogger
