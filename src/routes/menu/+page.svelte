<script lang="ts">
	import MenuButton from '$lib/components/examples/menu-button/MenuButton.svelte';

	let selected: string = '';

	function handleSelect(event: MenuButton['$$events_def']['select']) {
		selected = event.detail.value;
	}
</script>

<!-- <button on:click={handleClick} /> -->

<div>
	Selected: {selected}
</div>
<MenuButton on:select={handleSelect} />
<button>dummy</button>
