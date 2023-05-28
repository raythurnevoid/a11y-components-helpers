<script lang="ts">
	import Listbox from '$lib/components/examples/listbox/Listbox.svelte';

	let selected: string = '';
	function handleSelect(event: Listbox['$$events_def']['change']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>
<Listbox on:change={handleSelect} />
