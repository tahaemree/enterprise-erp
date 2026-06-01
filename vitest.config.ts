import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        exclude: [
            "node_modules/",
            "e2e/",
            "**/*.config.*",
            "**/types.ts",
            "**/*.d.ts",
            ".next/",
        ],
        coverage: {
            provider: "v8",
            // Coverage thresholds
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            }
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
})
