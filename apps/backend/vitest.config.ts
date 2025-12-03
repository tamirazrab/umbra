import path from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		root: "./",
		alias: [
			{ find: "@/test", replacement: path.resolve(__dirname, "./test") },
			{ find: "@", replacement: path.resolve(__dirname, "./src") },
		],
		environment: "node",
		setupFiles: ["./test/initialization.ts"],
		include: ["**/*.spec.ts"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/ported/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"test/",
				"**/*.spec.ts",
				"**/*.config.ts",
				"**/dist/**",
				"**/migrations/**",
				"**/*.d.ts",
			],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
		},
		testTimeout: 30000,
		// Increased timeout for e2e tests that start Docker containers
		// Container startup can take 60-120s depending on system resources and image pulls
		hookTimeout: 120000, // 2 minutes for container startup
		teardownTimeout: 60000, // 1 minute for container cleanup
		isolate: true,
	},
	plugins: [
		// This is required to build the test files with SWC
		swc.vite({
			// Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
			module: { type: "es6" },
		}),
	],
});
