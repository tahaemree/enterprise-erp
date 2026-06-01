import { describe, it, expect, beforeEach, vi } from "vitest"
import { createLogger } from "@/lib/logger"

describe("logger", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllEnvs()
        vi.stubEnv("LOG_LEVEL", "debug")
        vi.stubEnv("NODE_ENV", "development")
    })

    describe("createLogger", () => {
        it("should create a logger with trace, debug, info, warn, error, fatal methods", () => {
            const logger = createLogger("test")
            expect(logger).toHaveProperty("trace")
            expect(logger).toHaveProperty("debug")
            expect(logger).toHaveProperty("info")
            expect(logger).toHaveProperty("warn")
            expect(logger).toHaveProperty("error")
            expect(logger).toHaveProperty("fatal")
        })

        it("should format messages correctly using pino", () => {
            const logger = createLogger("my-module")
            const pinoSpy = vi.spyOn(logger.pino, "info")

            logger.info("test message")

            expect(pinoSpy).toHaveBeenCalledWith("test message")
        })

        it("should include metadata in output", () => {
            const logger = createLogger("meta-test")
            const pinoSpy = vi.spyOn(logger.pino, "info")

            logger.info("user action", { userId: "user-1", tenantId: "tenant-1" })

            expect(pinoSpy).toHaveBeenCalledWith({ userId: "user-1", tenantId: "tenant-1" }, "user action")
        })
    })
})
