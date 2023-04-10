import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event, {
		transformPageChunk: (input) => {
			if (dev) {
				// css-transform has not effect with sveltekit in dev, the replacement has to be done here
				return input.html.replaceAll('__FONT_DISPLAY__', env.A11YCH_DEV_FONT_DISPLAY);
			}

			return input.html;
		}
	});
};
