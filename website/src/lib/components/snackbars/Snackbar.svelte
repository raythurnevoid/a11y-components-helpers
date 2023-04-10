<svelte:options immutable={true} />

<script lang="ts">
	import { MDCSnackbar } from '@material/snackbar';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import IconButton from '../icon-button/IconButton.svelte';
	import closeSvg from './close.svg?raw';

	export let content: string = '';

	const dispatch = createEventDispatcher<{ closed: void }>();

	let el: HTMLElement;
	let snackbar: MDCSnackbar;

	onMount(async () => {
		await import('./Snackbar.scss');
		const snackbar = new MDCSnackbar(el);
		snackbar.timeoutMs = 4000;

		snackbar.open();

		snackbar.listen('MDCSnackbar:closed', () => {
			dispatch('closed');
		});
	});

	onDestroy(() => {
		snackbar?.destroy();
	});
</script>

<div bind:this={el} class="Snackbar mdc-snackbar mdc-snackbar--leading">
	<div class="mdc-snackbar__surface" role="status" aria-relevant="additions">
		<div class="mdc-snackbar__label" aria-atomic="false">{content}</div>
		<div class="mdc-snackbar__actions">
			<IconButton class="mdc-snackbar__dismiss" title="Dismiss" notIstantiate>
				{@html closeSvg}
			</IconButton>
		</div>
	</div>
</div>

<style lang="scss">
	.Snackbar {
		bottom: calc(var(--Snackbar-position) * 64px);
		transition: bottom 0.1s ease-in-out;

		:global(.mdc-icon-button) {
			color: white;
		}
	}
</style>
