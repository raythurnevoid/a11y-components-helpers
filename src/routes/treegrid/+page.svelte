<script lang="ts">
	import Treegrid from '$lib/components/examples/treegrid/Treegrid.svelte';

	let selected: string = '';
	function handleSelect(event: Treegrid['$$events_def']['change']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>
<Treegrid on:change={handleSelect} />
