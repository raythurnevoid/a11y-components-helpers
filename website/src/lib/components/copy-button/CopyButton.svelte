<svelte:options immutable={true} />

<script lang="ts">
	import IconButton from '$lib/components/icon-button/IconButton.svelte';
	import { openSnackbar } from '$lib/components/snackbars/Snackbars.svelte';
	import contentCopySvg from './content-copy.svg?raw';

	export let copyFromEl: HTMLElement;

	async function handleClick() {
		await navigator.clipboard.writeText(copyFromEl.innerText);
		openSnackbar('Copied to clipboard');
	}
</script>

<div class="CopyButton">
	<IconButton title="Copy" on:click={handleClick}>
		{@html contentCopySvg}
	</IconButton>
</div>

<style lang="scss">
	.CopyButton {
		position: absolute;
		inset: 8px 8px auto auto;

		:global(.mdc-icon-button) {
			background: var(--color--background);
			border-radius: 50%;
			transition: opacity 0.1s ease-in-out;
		}

		:global(.mdc-icon-button:not(:hover)) {
			opacity: 0.2;
		}

		:global(.mdc-icon-button:hover),
		:global(.mdc-icon-button:focus) {
			opacity: 1;
		}

		:global(.mdc-icon-button__ripple:before),
		:global(.mdc-icon-button__ripple:after) {
			background: currentColor;
		}
	}
</style>
