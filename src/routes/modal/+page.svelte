<script lang="ts">
	import Modal from '$lib/components/examples/modal/Modal.svelte';

	let modalEl: Modal;
	let state: Modal['$$prop_def']['state'];

	let open: boolean = true;
</script>

<main>
	<button>1</button>
	<button
		on:click={() => {
			open = true;
		}}>Open Modal</button
	>
	<Modal bind:this={modalEl} bind:state bind:open />

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
