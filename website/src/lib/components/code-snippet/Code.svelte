<svelte:options immutable={true} />

<script lang="ts">
	import './Code.scss';
	import CopyButton from '$lib/components/copy-button/CopyButton.svelte';

	export let source: string;

	let codeEl: HTMLPreElement;
</script>

<div class="Code">
	<pre bind:this={codeEl} class="Code__content language-svelte"><code>{@html source}</code></pre>
	<div class="Code__commands">
		<CopyButton copyFromEl={codeEl} />
	</div>
</div>

<style lang="scss">
	.Code {
		position: relative;

		:global(pre) {
			margin: 0;
		}
	}

	.Code__commands {
		position: absolute;
		top: 0;
		right: 0;

		:global(.CopyButton) {
			color: #ffdfdf;
		}
	}

	.Code__content {
		border-radius: 0 8px 8px 8px;
		overflow: overlay;
		--color--scrollbar-thumb: #ffffff81;
		--color--scrollbar-thumb--hover: #ffffffaf;
	}
</style>
