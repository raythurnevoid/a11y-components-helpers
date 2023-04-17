<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import * as modalHelpers from '$lib/lib/modal/modal.js';

	export let id: string = `Autocomplete-${index++}`;
	export let open: boolean = false;
	export let alert: boolean = false;

	export let state = modalHelpers.setState({
		isOpen: open
	});

	let dialogEl: HTMLDialogElement;

	let labelId: string = `${id}__label`;
	let descriptionId: string = `${id}__description`;

	const a11yAttributes = modalHelpers.getA11yAttributes({
		alert
	});

	let hooks = modalHelpers.setHooks({
		updateState: async (input) => {
			state = { ...state, ...input.state };

			if (input.state.isOpen != null) {
				open = input.state.isOpen;
			}

			return state;
		}
	});

	let mounted: boolean = false;

	onMount(() => {
		mounted = true;
	});

	$: if (mounted) handleOpenPropChange(open);

	function handleOpenPropChange(open: boolean) {
		state.isOpen = open;

		if (open) {
			dialogEl.showModal();
		} else {
			dialogEl.close();
		}
	}

	async function handleClose() {
		await modalHelpers.handleClose({
			dialogEl,
			state,
			open
		});
	}
</script>

<dialog
	bind:this={dialogEl}
	class="Modal"
	role={a11yAttributes.role}
	aria-labelledby={labelId}
	aria-describedby={descriptionId}
	on:close={handleClose}
>
	<span class="Modal__label" id={labelId}>Modal</span>
	<p class="Modal__description" id={descriptionId}>This is a modal</p>
</dialog>
