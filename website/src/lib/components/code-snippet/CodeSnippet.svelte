<script lang="ts">
	import CodeActions from '../code-actions/CodeActions.svelte';
	import TextButton from '../text-button/TextButton.svelte';
	import Code from './Code.svelte';
	import { onMount } from 'svelte';
	import FullSourceModal from './FullSourceModal.svelte';

	export let source: Code['$$prop_def']['source'];
	export let fileName: string;
	export let showFullSourceButton: boolean = false;

	let codeComp: Code;
	let codeEl: HTMLElement;

	let canShowSourceModalLoad: boolean = false;
	let isShowSourceModalOpen: boolean = false;

	onMount(() => {
		codeEl = codeComp.getCodeElement();
	});

	function handleShowSourceButtonClick() {
		canShowSourceModalLoad = true;
		isShowSourceModalOpen = true;
	}
</script>

<div class="CodeSnippet">
	<div
		class="CodeSnipper__code-container"
		class:CodeSnippet__container--with-full-source-code={showFullSourceButton}
	>
		<code class="CodeSnippet__filename">{fileName}</code>
		<Code bind:this={codeComp} {source} />
		{#if showFullSourceButton}
			<div class="CodeSnippet__full-source-code-button-layer">
				<div class="CodeSnippet__full-source-code-button-layer__content">
					<TextButton on:click={handleShowSourceButtonClick}>Show Source</TextButton>
					{#if canShowSourceModalLoad}
						<FullSourceModal bind:open={isShowSourceModalOpen} {source} />
					{/if}
				</div>
			</div>
		{/if}
	</div>
	<CodeActions targetEl={codeEl} />
</div>

<style lang="scss">
	.CodeSnippet {
		position: relative;
		margin-block: 1em;
		--CodeSnippet__filename--block-start-padding: 12px;
		--CodeSnippet__filename--block-end-padding: 4px;
		--CodeSnippet__filename--block-padding--sum: calc(
			var(--CodeSnippet__filename--block-start-padding) +
				var(--CodeSnippet__filename--block-end-padding)
		);

		:global(.CodeActions) {
			top: calc(
				/* filename's line-height */ 1.5rem + var(--CodeSnippet__filename--block-padding--sum)
			);
			right: calc(-1 * (48px + 8px));
		}
	}

	.CodeSnippet__container--with-full-source-code {
		height: 50vb;
		contain: paint;
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

	.CodeSnippet__full-source-code-button-layer__content {
		pointer-events: auto;
	}

	.CodeSnippet__filename {
		background: var(--color--code-snippet-background);
		color: #fff1a3;
		padding: var(--CodeSnippet__filename--block-start-padding) 1em
			var(--CodeSnippet__filename--block-end-padding);
		display: inline-block;
		font-size: 1em;
		border-radius: 8px 8px 0 0;
	}
</style>
