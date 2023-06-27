<script lang="ts">
	import Autocomplete from '$lib/components/examples/autocomplete/Autocomplete.svelte';

	let state: Autocomplete['$$prop_def']['state'];
</script>

<main>
	<Autocomplete bind:state label="State" autocomplete="both" />

	<aside id="state">
		<pre><code>{JSON.stringify(state, null, 2)}</code></pre>
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
