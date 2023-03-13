<svelte:options immutable={true} />

<script lang="ts">
	import ListAutocomplete from '../lib/components/examples/ListAutocomplete.svelte';

	let state: ListAutocomplete['$$prop_def']['state'];
</script>

<main>
	<!-- <ListAutocomplete autocomplete="list" />
	<ListAutocomplete autocomplete="both" />
	<ListAutocomplete autocomplete="both" />
	<ListAutocomplete autocomplete="both" /> -->
	<ListAutocomplete bind:state autocomplete="list" />

	<aside id="state">
		<pre>{JSON.stringify(state, null, 2)}</pre>
	</aside>
</main>

<style>
	main {
		display: flex;
	}

	#state {
		position: fixed;
		right: 16px;
		padding: 16px;
		border: 5px gray inset;
	}
</style>
