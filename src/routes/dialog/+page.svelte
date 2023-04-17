<script lang="ts">
	import Dialog from '$lib/components/examples/dialog/Dialog.svelte';

	let state: Dialog['$$prop_def']['state'];

	let open: boolean = false;

	let closeValue: string = '';

	function handleClose(event: Modal['$$events_def']['close']) {
		closeValue = event.detail.value;
	}
</script>

<main>
	<button>Nothing</button>
	<button
		on:click={() => {
			open = true;
		}}>Open Modal</button
	>
	<Dialog bind:state bind:open on:close={handleClose} modal />
	<div>Close value: {closeValue}</div>
	<aside id="state">
		<pre><code>{JSON.stringify(state, null, 2)}</code></pre>
	</aside>
</main>

<style>
	#state {
		position: fixed;
		right: 16px;
		padding: 16px;
		border: 5px gray inset;
	}
</style>
