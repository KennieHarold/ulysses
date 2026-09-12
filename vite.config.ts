/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { creTriggerPlugin } from './server/creTriggerPlugin'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')

	return {
		plugins: [react(), creTriggerPlugin(env)],
		server: {
			port: 5173,
		},
		test: {
			globals: true,
			environment: 'jsdom',
			setupFiles: ['./src/test/setup.ts'],
			include: ['src/**/*.test.{ts,tsx}'],
		},
	}
})
