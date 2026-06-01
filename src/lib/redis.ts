import Redis from "ioredis"

// We ensure there's only one Redis instance across hot reloads in development
const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined
}

export const redis =
    globalForRedis.redis ??
    new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
    })

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis
}
