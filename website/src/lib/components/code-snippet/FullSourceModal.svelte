<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import * as dialogHelpers from '@raythurnevoid/a11y-components-helpers/dialog/dialog.js';
	import Code from './Code.svelte';

	export let open: boolean = false;
	export let source: string;

	let dispatch = createEventDispatcher<{
		close: {
			value: string;
		};
	}>();

	let dialogEl: HTMLDialogElement;

	let dispatchCloseEvent: boolean = false;
	let submitter: HTMLButtonElement | undefined = undefined;

	let state = dialogHelpers.setState({
		isOpen: false
	});

	const a11yAttributes = dialogHelpers.getA11yAttributes({
		alert: false
	});

	let hooks = dialogHelpers.setHooks({
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
		if (open) {
			dialogHelpers.open({
				state,
				hooks,
				dialogEl,
				modal: true
			});
		} else {
			dialogHelpers.close({
				state,
				hooks
			});
		}
	}

	async function handleClose() {
		await dialogHelpers.handleClose({
			state,
			hooks
		});
	}

	async function handleCancel(event: Event) {
		event.preventDefault();

		dispatchCloseEvent = true;

		await dialogHelpers.handleClose({
			state,
			hooks
		});
	}

	async function handleDialogClick(e: Event) {
		const event = e as MouseEvent;
		const target = event.target as HTMLElement;

		if (target.tagName === 'DIALOG') {
			dispatchCloseEvent = true;

			await dialogHelpers.close({
				state,
				hooks
			});
		}
	}

	function handleTransitionEnd() {
		if (!open && dialogEl.open) {
			const value = submitter?.value ?? '';
			if (dispatchCloseEvent) {
				dispatchCloseEvent = false;
				dispatch('close', {
					value: value
				});
			}

			dialogEl.close(value);
			submitter = undefined;
		}
	}

	async function handleButtonSubmit(e: Event) {
		const event = e as SubmitEvent;
		event.preventDefault();

		dispatchCloseEvent = true;
		submitter = event.submitter as HTMLButtonElement;

		await dialogHelpers.handleDialogFormSubmit({
			state,
			hooks
		});
	}
</script>

<dialog
	bind:this={dialogEl}
	class="Dialog"
	class:Dialog--open={state.isOpen}
	role={a11yAttributes.role}
	aria-label="Full source"
	on:click={handleDialogClick}
	on:cancel={handleCancel}
	on:close={handleClose}
	on:transitionend={handleTransitionEnd}
>
	<!-- <div class="Dialog__content">
		<header class="Dialog__header">
			<span class="Dialog__label" id={labelId}>Dialog</span>
			<form method="dialog" on:submit={handleButtonSubmit}>
				<button type="submit" class="Dialog__close" value="close"> ⨉ </button>
			</form>
		</header>
	</div> -->
	<Code {source} />
</dialog>

<style>
	.Dialog {
		padding: 0;
		border: 0;
		transition-property: transform opacity;
		transition: 0.2s ease-in-out;
		transform: translateY(50px) scale(0.9);
		opacity: 0;
		border-radius: 8px;
		background-color: transparent;
		width: 1000px;
	}

	.Dialog :global(.Code) {
		width: max-content;
	}

	.Dialog :global(.Code__content) {
		overflow: hidden;
	}

	.Dialog:focus-visible {
		outline: none;
	}

	.Dialog--open {
		transform: translateY(0px) scale(1);
		opacity: 1;
	}

	.Dialog__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
