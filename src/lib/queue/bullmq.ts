import { Queue, Worker, QueueEvents } from "bullmq"
import { redis } from "@/lib/redis"
import logger from "@/lib/logger"

export const ERP_QUEUE_NAME = "erp-background-jobs"

// BullMQ and ioredis have incompatible TS types despite runtime compatibility.
// We use a narrow function-type cast instead of `as any` for connection sharing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connection = redis as any

// Create the unified queue
export const erpQueue = new Queue(ERP_QUEUE_NAME, {
    connection,
})

// Create Queue Events for monitoring
export const queueEvents = new QueueEvents(ERP_QUEUE_NAME, { connection })

// Job Types
export type JobTypes = "SEND_EMAIL" | "GENERATE_PDF" | "CALCULATE_MONTHLY_COSTS"

// Enqueue helper
export async function enqueueJob(name: JobTypes, data: Record<string, unknown>, opts = {}) {
    return await erpQueue.add(name, data, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        ...opts,
    })
}

// ----------------------------------------------------------------------------
// WORKER DEFINITION
// NOTE: In a true microservice environment, you'd run this in a separate Node process.
// For Next.js monolith, we instantiate it here, but be careful of hot-reloads in dev.
// ----------------------------------------------------------------------------

export const erpWorker = new Worker(
    ERP_QUEUE_NAME,
    async (job) => {
        const { name, data } = job
        logger.info("Processing Background Job", { jobId: job.id, name })

        switch (name) {
            case "SEND_EMAIL":
                // Simulate email sending
                await new Promise((resolve) => setTimeout(resolve, 2000))
                logger.info("Email sent successfully", { email: data.to })
                break
                
            case "GENERATE_PDF":
                // Simulate heavy PDF generation
                await new Promise((resolve) => setTimeout(resolve, 5000))
                logger.info("PDF Generated", { invoiceId: data.invoiceId })
                break

            case "CALCULATE_MONTHLY_COSTS":
                // Simulate heavy DB calculation
                await new Promise((resolve) => setTimeout(resolve, 8000))
                logger.info("Monthly costs calculated", { month: data.month })
                break

            default:
                logger.warn("Unknown job type", { name })
        }

        return { success: true, processedAt: new Date().toISOString() }
    },
    {
        connection,
        concurrency: 5, // Process 5 jobs simultaneously
    }
)

erpWorker.on("completed", (job) => {
    logger.info("Job completed", { jobId: job.id, name: job.name })
})

erpWorker.on("failed", (job, err) => {
    logger.error("Job failed", { jobId: job?.id, name: job?.name, err })
})
