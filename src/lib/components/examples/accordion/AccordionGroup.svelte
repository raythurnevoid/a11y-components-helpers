<script lang="ts">
	import Accordion from './Accordion.svelte';

	let accordions: { component: Accordion | undefined; open: boolean }[] = [
		{ component: undefined, open: false },
		{ component: undefined, open: false },
		{ component: undefined, open: false }
	];

	function handleClick(event: Accordion['$$events_def']['click'], index: number) {
		accordions.forEach((accordion, i) => {
			accordions.at(i)!.open = event.detail.willOpen ? false : accordion.open;
		});
	}

	function handleKeydown(event: Accordion['$$events_def']['keydown'], index: number) {
		switch (event.detail.key) {
			case 'ArrowUp':
			case 'ArrowDown':
			case 'Home':
			case 'End':
				accordions.forEach((_, i) => (accordions.at(i)!.open = false));
		}

		switch (event.detail.key) {
			case 'ArrowUp':
				accordions.at(index - 1)!.component!.focus();
				break;
			case 'ArrowDown':
				(accordions.at(index + 1) ?? accordions.at(0))!.component!.focus();
				break;
			case 'Home':
				accordions.at(0)!.component!.focus();
				break;
			case 'End':
				accordions.at(-1)!.component!.focus();
				break;
		}
	}
</script>

<div class="AccordionGroup">
	{#each accordions as accordion, index (index)}
		<Accordion
			bind:this={accordion.component}
			bind:open={accordion.open}
			on:click={(e) => handleClick(e, index)}
			on:keydown={(e) => handleKeydown(e, index)}
		/>
	{/each}
</div>
