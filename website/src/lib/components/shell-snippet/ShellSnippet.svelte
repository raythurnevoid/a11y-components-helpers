<script lang="ts">
	import CodeActions from '../code-actions/CodeActions.svelte';

	let snippetEl: HTMLPreElement;
</script>

<div class="ShellSnippet">
	<pre bind:this={snippetEl} class="ShellSnippet__snippet"><code><slot /></code></pre>
	<CodeActions targetEl={snippetEl} />
</div>

<style lang="scss">
	.ShellSnippet {
		--ShellSnippet__snippet--padding: 16px;

		position: relative;
		margin-block: 1rem;
		border: 1px solid var(--color--snippet-border);
		border-radius: 8px;

		:global(.CodeActions) {
			top: calc(var(--ShellSnippet__snippet--padding) / 4);
			right: calc(-1 * (48px + 8px));
		}
	}

	.ShellSnippet__snippet {
		margin-block: 0;
		overflow: overlay;

		padding: var(--ShellSnippet__snippet--padding);
	}
</style>
