<script lang="ts">
	import SliderRange from '$lib/components/examples/slider/SliderRange.svelte';

	let selected: string = '';
	function handleSelect(event: SliderRange['$$events_def']['change']) {
		selected = event.detail.value;
	}
</script>

<div>
	Value: {selected}
</div>
<SliderRange on:change={handleSelect} />
