<svelte:options immutable={true} />

<script lang="ts" context="module">
	let count = 0;
</script>

<script lang="ts">
	import { MDCRipple } from '@material/ripple';
	import { onMount } from 'svelte';
	import './IconButton.scss';

	export let id: string = `IconButton--${count++}`;
	let className: string = '';
	export { className as class };

	export let icon: string = '';
	export let title: string = '';
	export let href: string | undefined = undefined;
	export let target: string | undefined = undefined;
	export let notIstantiate: boolean = false;

	let buttonEl: HTMLElement;

	let buttonElTag: 'button' | 'a' = href ? 'a' : 'button';
	$: tooltipId = `${id}__tooltip`;

	let canTooltipBeImported: boolean = false;

	onMount(() => {
		if (notIstantiate) return;

		const iconButtonRipple = new MDCRipple(buttonEl);
		iconButtonRipple.unbounded = true;

		const destroyTooltipImport = executeLate();

		return () => {
			destroyTooltipImport();
			iconButtonRipple.destroy();
		};
	});

	function executeLate() {
		const clearSteps: (() => void)[] = [];

		function allowImport() {
			function setAsynchronously() {
				const timeout = setTimeout(() => (canTooltipBeImported = true), 100);
				clearSteps.push(() => clearTimeout(timeout));
			}

			const idleCallbackIsSupported = 'requestIdleCallback' in window;
			if (idleCallbackIsSupported) {
				const idleCallBackRequest = requestIdleCallback(setAsynchronously);
				clearSteps.push(() => cancelIdleCallback(idleCallBackRequest));
			} else {
				setAsynchronously();
			}
		}

		function handleLoad() {
			function handleInteraction() {
				allowImport();
				window.removeEventListener('pointermove', handleInteraction);
				window.removeEventListener('pointerdown', handleInteraction);
			}

			window.addEventListener('pointermove', handleInteraction);
			window.addEventListener('pointerdown', handleInteraction);
			clearSteps.push(() => {
				window.removeEventListener('pointermove', handleInteraction);
				window.removeEventListener('pointerdown', handleInteraction);
			});

			// const timeout = setTimeout(() => {
			// 	allowImport();
			// }, 1000);

			window.removeEventListener('load', handleLoad);
		}

		if (document.readyState === 'complete') {
			handleLoad();
		} else {
			window.addEventListener('load', handleLoad);
			clearSteps.push(() => window.removeEventListener('load', handleLoad));
		}

		return () => {
			clearSteps.forEach((clearStep) => clearStep());
		};
	}

	async function importTooltipComponent() {
		await import('$lib/components/tooltip/Tooltip.svelte');
	}
</script>

<div class="IconButton">
	<div class="mdc-touch-target-wrapper">
		<svelte:element
			this={buttonElTag}
			bind:this={buttonEl}
			class="mdc-icon-button mdc-icon-button--touch {className}"
			class:material-icons={!!icon}
			{href}
			target={href ? target : undefined}
			aria-describedby={tooltipId}
			aria-labelledby={tooltipId}
			on:click
		>
			<div class="mdc-icon-button__ripple" />
			<div class="mdc-icon-button__touch" />
			{icon}
			<slot />
		</svelte:element>
	</div>

	{#if title && canTooltipBeImported}
		{#await import('$lib/components/tooltip/Tooltip.svelte') then { default: Tooltip }}
			<Tooltip id={tooltipId} text={title} />
		{/await}
	{/if}
</div>

<style lang="scss">
	.IconButton {
		display: contents;
	}
</style>
