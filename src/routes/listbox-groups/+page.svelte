<script lang="ts">
	import ListboxWithGroups from '$lib/components/examples/listbox/ListboxWithGroups.svelte';

	let selected: string = '';
	function handleSelect(event: ListboxWithGroups['$$events_def']['select']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>

<ListboxWithGroups on:select={handleSelect} />
