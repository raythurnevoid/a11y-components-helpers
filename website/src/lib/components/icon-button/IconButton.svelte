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

	let canTooltipBeUsed: boolean = false;

	onMount(() => {
		if (notIstantiate) return;

		const iconButtonRipple = new MDCRipple(buttonEl);
		iconButtonRipple.unbounded = true;

		return () => {
			iconButtonRipple.destroy();
		};
	});

	async function handleMouseEnter() {
		if (!canTooltipBeUsed) {
			const { handleDynamicImportOnMouseEnter: handleDynamicImport } = await import(
				'$lib/components/tooltip/Tooltip.svelte'
			);
			canTooltipBeUsed = true;

			handleDynamicImport(buttonEl);
		}
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
			on:mouseenter={handleMouseEnter}
		>
			<div class="mdc-icon-button__ripple" />
			<div class="mdc-icon-button__touch" />
			{icon}
			<slot />
		</svelte:element>
	</div>

	{#if title && canTooltipBeUsed}
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
