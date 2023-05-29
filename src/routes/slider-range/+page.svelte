<script lang="ts">
	import SliderRange from '$lib/components/examples/slider/SliderRange.svelte';

	let value: [number, number] = [30, 70];
	function handleChange(event: SliderRange['$$events_def']['change']) {
		value = event.detail.value;
	}
</script>

<div>
	Value: {value}
</div>
<SliderRange on:change={handleChange} />
