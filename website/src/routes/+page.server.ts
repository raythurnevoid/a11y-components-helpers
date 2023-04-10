import type { PageServerLoad } from './$types.js';
import rawAutocompleteSvelteSrc from '$lib/components/examples/Autocomplete.svelte?raw';
import { highlight } from '$lib/server/prism.js';

export const load: PageServerLoad = () => {
	const highlightedAutocompleteSvelteSrc = highlight(rawAutocompleteSvelteSrc);

	return {
		snippets: {
			'Autocomplete.svelte': highlightedAutocompleteSvelteSrc,
		}
	};
};
