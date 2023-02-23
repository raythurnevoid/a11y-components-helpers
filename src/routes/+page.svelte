<svelte:options immutable={true} />

<script lang="ts">
	import ListAutocomplete from '../lib/components/examples/ListAutocomplete.svelte';
</script>

<main>
	<ListAutocomplete autocomplete="list" />
	<ListAutocomplete autocomplete="both" />
</main>

<style>
	main {
		display: flex;
	}
</style>
