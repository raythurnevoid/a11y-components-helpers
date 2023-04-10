<svelte:options immutable={true} />

<script lang="ts">
	import TextButton from '../text-button/TextButton.svelte';
	import Code from './Code.svelte';

	export let source: Code['$$prop_def']['source'];
	export let fileName: string;
	export let showFullSourceButton: boolean = false;
</script>

<div class="CodeSnippet" class:CodeSnippet--with-full-source-code={showFullSourceButton}>
	<code class="CodeSnippet__filename">{fileName}</code>
	<Code {source} />
	{#if showFullSourceButton}
		<div class="CodeSnippet__full-source-code-button-layer">
			<TextButton>Show Source</TextButton>
		</div>
	{/if}
</div>

<style>
	.CodeSnippet {
		margin-block: 1em;
	}

	.CodeSnippet--with-full-source-code {
		height: 50vb;
		contain: paint;
		position: relative;
	}

	.CodeSnippet__full-source-code-button-layer {
		pointer-events: none;
		position: absolute;
		inset: 0;
		background: linear-gradient(
			transparent calc(100% - calc(16px * 10)),
			var(--color--background) calc(100% - calc(16px * 0.5))
		);
		display: grid;
		place-items: flex-end;
		padding: 16px;
	}

	.CodeSnippet__filename {
		background: var(--color--code-snippet-background);
		color: #fff1a3;
		padding: 0.8em 1em 0.2em;
		display: inline-block;
		font-size: 1em;
		border-radius: 8px 8px 0 0;
	}
</style>
