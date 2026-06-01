/**
 * Global setup for integration tests.
 * Runs ONCE before all test files.
 *
 * - Pushes the Prisma schema to the test database
 * - Ensures the database is ready for tests
 */

import { execSync } from "child_process"

export async function setup(): Promise<void> {
    console.log("🔄 Running Prisma schema push on test database...")
    try {
        execSync("npx prisma db push --accept-data-loss --skip-generate", {
            env: {
                ...process.env,
                DATABASE_URL: process.env.DATABASE_URL!,
            },
            stdio: "pipe",
            timeout: 30_000,
        })
        console.log("✅ Test database schema is up to date")
    } catch (error) {
        console.error("❌ Failed to push schema to test database:", error)
        throw error
    }
}

export async function teardown(): Promise<void> {
    // Optional: clean up the test database after all tests
    // We skip cleanup here to allow debugging test data after failures
    console.log("ℹ️  Integration tests complete. Test database preserved for inspection.")
}
