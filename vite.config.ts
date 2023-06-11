/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.vitest': 'undefined'
	},
	optimizeDeps: {
		exclude: ['vitest/utils'],
		include: ['@vitest/utils', 'vitest/browser']
	},
	test: {
		includeSource: ['src/**/*.{js,ts}'],
		// browser: {
		// 	enabled: true,
		// 	name: 'chromium',
		// 	provider: 'playwright',
		// 	headless: false
		// },
		benchmark: {
			includeSource: ['src/**/*.{js,ts}']
		}
	}
});
