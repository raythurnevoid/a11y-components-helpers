import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		vitePreprocess({
			style: {
				css: {
					preprocessorOptions: {
						scss: {}
					}
				}
			}
		})
	],

	kit: {
		adapter: adapter({
			precompress: true
		})
	}
};

export default config;
