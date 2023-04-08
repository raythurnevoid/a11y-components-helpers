<svelte:options immutable={true} />

<script lang="ts">
	import Autocomplete from '$lib/components/examples/Autocomplete.svelte';
	import TopAppBar from '$lib/layout/top-app-bar/TopAppBar.svelte';

	let state: Autocomplete['$$prop_def']['state'];
</script>

<TopAppBar />

<main>
	<!-- <Autocomplete autocomplete="list" />
	<Autocomplete autocomplete="both" />
	<Autocomplete autocomplete="both" />
	<Autocomplete autocomplete="both" /> -->
	<Autocomplete bind:state label="State" autocomplete="inline" />

	<aside id="state">
		<pre><code>{JSON.stringify(state, null, 2)}=></code></pre>
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
