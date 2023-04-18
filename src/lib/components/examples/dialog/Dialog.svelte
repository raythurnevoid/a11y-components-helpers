<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import * as dialogHelpers from '$lib/lib/dialog/dialog.js';

	export let id: string = `Dialog-${index++}`;
	export let open: boolean = false;
	export let alert: boolean = false;
	export let modal: boolean = false;
	export let closeOnBackdropClick: boolean = false;

	let dispatch = createEventDispatcher<{
		close: {
			value: string;
		};
	}>();

	let dialogEl: HTMLDialogElement;

	let labelId: string = `${id}__label`;
	let descriptionId: string = `${id}__description`;

	const a11yAttributes = dialogHelpers.getA11yAttributes({
		alert
	});

	let mounted: boolean = false;

	onMount(() => {
		mounted = true;
	});

	$: if (mounted) handleOpenPropChange(open);

	function handleOpenPropChange(open: boolean) {
		if (open) {
			if (modal) {
				dialogEl.showModal();
			} else {
				dialogEl.show();
			}
		} else {
			dialogEl.close();
			// clean the dialog return value to prevent using it when closing with Esc
			dialogEl.returnValue = '';
		}
	}

	async function handleClose(e: Event) {
		const event = e as CloseEvent;
		const target = event.target as HTMLDialogElement;

		open = false;

		dispatch('close', {
			value: target.returnValue
		});
	}

	function handleDialogClick(e: Event) {
		if (!closeOnBackdropClick) return;

		const event = e as MouseEvent;
		const target = event.target as HTMLElement;

		if (target.tagName === 'DIALOG') {
			dialogEl.close('backdrop');
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	class="Dialog"
	role={a11yAttributes.role}
	aria-labelledby={labelId}
	aria-describedby={descriptionId}
	on:click={handleDialogClick}
	on:close={handleClose}
>
	<div class="Dialog__content">
		<header class="Dialog__header">
			<span class="Dialog__label" id={labelId}>Dialog</span>
			<form method="dialog">
				<button type="submit" class="Dialog__close" value="close"> ⨉ </button>
			</form>
		</header>
		<p class="Dialog__description" id={descriptionId}>This is a modal</p>
		<form method="dialog">
			<button type="submit" class="Dialog__close" value="cancel"> Cancel </button>
			<!-- svelte-ignore a11y-autofocus -->
			<button type="submit" class="Dialog__close" value="save" autofocus> Save </button>
		</form>
	</div>
</dialog>

<style>
	.Dialog {
		padding: 0;
		border: 0;
	}

	.Dialog__content {
		padding: 16px;
		border: 1px solid gray;
	}

	.Dialog__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
