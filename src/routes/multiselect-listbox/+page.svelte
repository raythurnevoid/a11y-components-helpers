<script lang="ts">
	import MultiSelectListbox from '$lib/components/examples/listbox/MultiSelectListbox.svelte';

	let value: Set<string> = new Set();
	function handleChange(event: MultiSelectListbox['$$events_def']['select']) {
		value = event.detail.value;
	}
</script>

<div>
	Selected: {Array.from(value)}
</div>
<MultiSelectListbox on:change={handleChange} />
