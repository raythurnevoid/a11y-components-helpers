<script lang="ts">
	import Treeview from '$lib/components/examples/treeview/Treeview.svelte';

	let selected: string = '';
	function handleSelect(event: Treeview['$$events_def']['change']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>
<Treeview on:change={handleSelect} />
