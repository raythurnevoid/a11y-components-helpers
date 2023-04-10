import prism from 'prismjs';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-bash.js';
import 'prism-svelte';

const grammar = prism.languages['svelte'];

export function highlight(code: string) {
	return prism.highlight(code, grammar, 'svelte');
}
