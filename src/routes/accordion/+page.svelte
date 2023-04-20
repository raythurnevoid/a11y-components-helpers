<script lang="ts">
	import Accordion from '$lib/components/examples/accordion/Accordion.svelte';
	import AccordionGroup from '$lib/components/examples/accordion/AccordionGroup.svelte';
</script>

<main>
	<section>
		<Accordion />
	</section>
	<section>
		<AccordionGroup />
	</section>
</main>

<style>
	section {
		margin-bottom: 16px;
	}
</style>
