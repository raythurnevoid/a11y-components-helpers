<script lang="ts">
	import Grid from '$lib/components/examples/grid/Grid.svelte';

	let selected: string = '';
	function handleSelect(event: Grid['$$events_def']['change']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>
<Grid on:change={handleSelect} />
