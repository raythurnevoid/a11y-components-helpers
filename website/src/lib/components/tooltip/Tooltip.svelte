<script lang="ts" context="module">
	export function handleDynamicImportOnMouseEnter(triggerEl: HTMLElement) {
		triggerEl.addEventListener('mouseenter', handleMouseEnter);
		triggerEl.addEventListener('mouseleave', handleMouseLeave);

		let shouldTooltipTrigger: boolean = true;

		setTimeout(() => {
			if (shouldTooltipTrigger) {
				triggerEl.dispatchEvent(new CustomEvent('mouseenter'));
			}

			cleanHandleDynamicImport();
		}, 100);

		function handleMouseEnter() {
			shouldTooltipTrigger = true;
		}

		function handleMouseLeave() {
			shouldTooltipTrigger = false;
		}

		function cleanHandleDynamicImport() {
			triggerEl.removeEventListener('mouseenter', handleMouseEnter);
			triggerEl.removeEventListener('mouseleave', handleMouseLeave);
		}
	}
</script>

<script lang="ts">
	import './Tooltip.scss';
	import { MDCTooltip } from '@material/tooltip';
	import { onDestroy, onMount } from 'svelte';

	export let id: string;
	export let text: string;

	let el: HTMLElement;
	let tooltip: MDCTooltip;

	onMount(async () => {
		tooltip = new MDCTooltip(el);
	});

	onDestroy(() => {
		tooltip?.destroy();
	});
</script>

<div bind:this={el} {id} class="Tooltip mdc-tooltip" role="tooltip" aria-hidden="true">
	<div class="mdc-tooltip__surface mdc-tooltip__surface-animation">
		<span class="mdc-tooltip__label">{text}</span>
	</div>
</div>
