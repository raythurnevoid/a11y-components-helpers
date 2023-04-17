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
	@use '$lib/styles/material-theme.scss';

	.CopyButton {
		:global(.mdc-icon-button) {
			// hint text color
			background: var(--color--tertiary);
			// background: var(--color--background);
			border-radius: 50%;
			transition: opacity 0.1s ease-in-out;
		}

		:global(.mdc-icon-button:not(:hover)) {
			opacity: 0.8;
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
