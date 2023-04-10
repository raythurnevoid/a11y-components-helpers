<!-- Init svelte component -->

<script lang="ts">
	import { MDCTooltip } from '@material/tooltip';
	import { onDestroy, onMount } from 'svelte';

	export let id: string;
	export let text: string;

	let el: HTMLElement;
	let tooltip: MDCTooltip;

	onMount(async () => {
		await import('./Tooltip.scss');
		tooltip = new MDCTooltip(el);
	});

	onDestroy(() => {
		tooltip?.destroy();
	});
</script>

<div bind:this={el} {id} class="mdc-tooltip" role="tooltip" aria-hidden="true">
	<div class="mdc-tooltip__surface mdc-tooltip__surface-animation">
		<span class="mdc-tooltip__label">{text}</span>
	</div>
</div>
