<script lang="ts">
	import ListboxWithGroups from '$lib/components/examples/listbox/ListboxWithGroups.svelte';

	let selected: string = '';
	function handleSelect(event: ListboxWithGroups['$$events_def']['change']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>

<ListboxWithGroups on:change={handleSelect} />
