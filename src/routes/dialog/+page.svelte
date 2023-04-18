<script lang="ts">
	import Dialog from '$lib/components/examples/dialog/Dialog.svelte';

	let open: boolean = false;
	let modal: boolean = true;
	let closeOnBackdropClick: boolean = true;

	let closeValue: string = '';

	function handleClose(event: Dialog['$$events_def']['close']) {
		closeValue = event.detail.value;
	}
</script>

<main>
	<div>
		<label>
			<input type="checkbox" bind:checked={modal} />
			Modal
		</label>
	</div>
	<div>
		<label>
			<input type="checkbox" bind:checked={closeOnBackdropClick} />
			Close on backdrop click
		</label>
	</div>
	<div>
		<button
			on:click={() => {
				open = true;
			}}>Open Modal</button
		>
	</div>
	<div>Close value: {closeValue}</div>
</main>
<Dialog bind:open on:close={handleClose} {modal} {closeOnBackdropClick} />
