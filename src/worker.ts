import "dotenv/config"
import { erpWorker } from "./lib/queue/bullmq"
import logger from "./lib/logger"

// This file is the entry point for the standalone background worker process.
// It connects to Redis and processes BullMQ jobs independently from the Next.js server.

logger.info("Starting ERP Background Worker...")

erpWorker.on("ready", () => {
    logger.info("Worker is ready and listening for jobs on queue: erp-background-jobs")
})

erpWorker.on("error", (err) => {
    logger.error("Worker encountered an error", { err })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received. Shutting down worker...")
    await erpWorker.close()
    process.exit(0)
})

process.on("SIGINT", async () => {
    logger.info("SIGINT received. Shutting down worker...")
    await erpWorker.close()
    process.exit(0)
})
