import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { env } from 'process';

const isProduction = env.NODE_ENV === 'production' ? true : false;

const fontDisplay = isProduction ? 'optional' : 'swap';

if (!isProduction) {
	// css-transform has not effect with sveltekit in dev, the replacement has to be done in hooks.server.ts
	env.SCE_DEV_FONT_DISPLAY = fontDisplay;
}

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'css-transform',
			transform(src, id) {
				if (id.endsWith('.scss')) {
					return src.replaceAll('__FONT_DISPLAY__', fontDisplay);
				}
			}
		}
	]
});
