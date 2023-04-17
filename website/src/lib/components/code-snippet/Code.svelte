<script lang="ts">
	import './Code.scss';

	export let source: string;

	let codeEl: HTMLPreElement;

	export function getCodeElement() {
		return codeEl;
	}
</script>

<div class="Code">
	<pre bind:this={codeEl} class="Code__content language-svelte"><code>{@html source}</code></pre>
</div>

<style lang="scss">
	.Code {
		position: relative;

		:global(pre) {
			margin: 0;
		}
	}

	.Code__content {
		border-radius: 0 8px 8px 8px;
		overflow: overlay;
		--color--scrollbar-thumb: #ffffff81;
		--color--scrollbar-thumb--hover: #ffffffaf;
	}
</style>
