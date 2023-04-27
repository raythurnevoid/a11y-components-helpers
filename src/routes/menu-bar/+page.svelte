<script lang="ts">
	import MenuBar from '$lib/components/examples/menu-bar/MenuBar.svelte';

	let selected: string = '';
	function handleSelect(event: MenuBar['$$events_def']['select']) {
		selected = event.detail.value;
	}
</script>

<div>
	Selected: {selected}
</div>
<MenuBar on:select={handleSelect} />
<button>dummy</button>
