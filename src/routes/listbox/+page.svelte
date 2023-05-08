<script lang="ts">
	import Listbox from '$lib/components/examples/listbox/Listbox.svelte';

	let selected: string = '';
	function handleSelect(event: Listbox['$$events_def']['select']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>
<Listbox on:select={handleSelect} />
<button>dummy</button>
