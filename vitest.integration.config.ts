import { defineConfig } from "vitest/config"
import path from "path"
import { config } from "dotenv"

// Load .env.test for the test database connection
config({ path: ".env.test" })

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["src/**/*.integration.test.ts"],
        exclude: ["node_modules", ".next"],
        testTimeout: 60_000, // Integration tests need more time
        hookTimeout: 60_000,
        setupFiles: ["./src/lib/__tests__/integration-setup.ts"],
        globalSetup: ["./src/lib/__tests__/integration-global-setup.ts"],
        sequence: {
            // Run integration tests sequentially to avoid DB conflicts
            concurrent: false,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@/lib": path.resolve(__dirname, "./src/lib"),
            "@/components": path.resolve(__dirname, "./src/components"),
            "@/app": path.resolve(__dirname, "./src/app"),
        },
    },
})
