<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open: boolean = false;

	const dispatch = createEventDispatcher<{
		click: {
			willOpen: boolean;
		};
		keydown: {
			key: string;
		};
	}>();

	let accordionEl: HTMLDetailsElement;
	let buttonEl: HTMLElement;

	function handleClick() {
		dispatch('click', {
			willOpen: !accordionEl.open
		});
	}

	function handleKeydown(event: KeyboardEvent) {
		dispatch('keydown', {
			key: event.key
		});
	}

	export function getElement() {
		return accordionEl;
	}

	export function getButtonElement() {
		return buttonEl;
	}

	export function focus() {
		buttonEl.focus();
	}
</script>

<details bind:this={accordionEl} class="Accordion" bind:open>
	<summary
		bind:this={buttonEl}
		class="Accordion__button"
		on:click={handleClick}
		on:keydown={handleKeydown}>Accordion</summary
	>
	<div class="Accordion__content">Content</div>
</details>

<style>
	.Accordion {
		border: 1px solid gray;
	}

	.Accordion__button {
		cursor: pointer;
	}

	.Accordion__button,
	.Accordion__content {
		padding: 16px;
	}
</style>
