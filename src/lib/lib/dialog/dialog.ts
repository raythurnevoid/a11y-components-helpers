/**
 * Handle the dialog's `close` event.
 */
export async function handleClose(input: {
	state: State;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	await close(input);
}

/**
 * Programmatically close the modal.
 *
 * **Note**: `dialogEl.close()` must be called externally. This allows to implement animations before closing the modal.
 */
export async function close(input: {
	state: State;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	if (state.isOpen) {
		state = await input.hooks.updateState({
			state: {
				isOpen: false
			},
			reason: 'close'
		});
	}
}

/**
 * Programmatically open the modal.
 */
export async function open(input: {
	state: State;
	dialogEl: HTMLDialogElement;
	/**
	 * When `true`, the modal is shown as a modal dialog.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#Modal_dialogs
	 */
	modal: boolean;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	if (!state.isOpen) {
		if (!input.dialogEl.open) {
			if (input.modal) input.dialogEl.showModal();
			else input.dialogEl.show();
		}
		state = await input.hooks.updateState({
			state: {
				isOpen: true
			},
			reason: 'open'
		});
	}
}

/**
 * Helps to correctly assign aria attributes to your elements for the given state.
 */
export function getA11yAttributes(input: {
	/**
	 * Whether the modal is used to show an alert.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alertdialog_role
	 */
	alert: boolean;
}) {
	return {
		role: input.alert ? 'alertdialog' : 'dialog'
	};
}

/**
 * Helps to instantiate the state while providing types intellisense.
 */
export function setState(state: State) {
	return state;
}

/**
 * Helps to instantiate the hooks while providing types intellisense.
 */
export function setHooks(hooks: Hooks) {
	return hooks;
}

async function collectStateUpdates(
	state: State,
	collector: (updateState: (input: UpdateStateInputInternal) => Promise<State>) => Promise<void>,
	updateState: (state: State) => Promise<State>
) {
	let collectedState = {} as State;

	let doesStateGotUpdated: boolean = false;

	await collector(async (input) => {
		if (Object.keys(input.state).length === 0) {
			return collectedState;
		}

		collectedState = Object.assign(collectedState, input.state);
		doesStateGotUpdated = true;
		return collectedState;
	});

	if (doesStateGotUpdated && updateState) {
		state = await updateState(collectedState);
	}

	return state;
}

interface UpdateStateInputInternal {
	/**
	 * The patch to apply to the state.
	 */
	state: Partial<State>;
}

export interface UpdateStateInput extends UpdateStateInputInternal {
	/**
	 * The reason why {@link Hooks.updateState} is called.
	 *
	 * Can be used to implement custom logics.
	 */
	reason: UpdateStateReason;
}

type UpdateStateReason = 'close' | 'open';

export interface Hooks {
	/**
	 * Called when the state should be updated.
	 * This method is called only when a value is changed to avoid unnecessary calls.
	 * This method is called only with the properties that changed allowing the user to check for a specific property.
	 */
	updateState: (input: UpdateStateInput) => Promise<State>;
}

export interface State {
	/**
	 * Define the open/closed state of the modal.
	 */
	isOpen: boolean;
}
