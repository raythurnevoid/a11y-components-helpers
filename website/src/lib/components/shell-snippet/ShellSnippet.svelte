<script lang="ts">
	import CopyButton from '$lib/components/copy-button/CopyButton.svelte';

	let snippetEl: HTMLPreElement;
</script>

<div class="ShellSnippet">
	<CopyButton copyFromEl={snippetEl} />
	<pre bind:this={snippetEl} class="ShellSnippet__snippet"><code><slot /></code></pre>
</div>

<style lang="scss">
	.ShellSnippet {
		position: relative;
		margin-block: 1rem;
		border: 1px solid var(--color--snippet-border);
		border-radius: 8px;

		@media (prefers-color-scheme: dark) {
			:global(.CopyButton .mdc-icon-button) {
				background: var(--color--code-snippet-background);
			}
		}
	}

	.ShellSnippet__snippet {
		margin-block: 0;
		overflow: overlay;

		padding-inline: 16px;
		// The padding makes the content aligned with the copy button that has a margin of 8px
		padding-block: calc(16px + 8px);
	}
</style>
