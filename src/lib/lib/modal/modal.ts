/**
 * Close the listbox if needed.
 */
export async function handleClose(input: {
	state: State;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			updateState({ state: { isOpen: false } });
		},
		async (state) =>
			input.hooks.updateState({
				state,
				reason: 'close'
			})
	);
}

/**
 * Programmatically close the modal.
 */
export async function close(input: {
	state: State;
	dialogEl: HTMLDialogElement;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	if (state.isOpen) {
		input.dialogEl.close();
		state = await collectStateUpdates(
			state,
			async (updateState) => {
				await getUpdatedStateOnClose({
					state: input.state,
					hooks: {
						updateState
					}
				});
			},
			(state) => {
				return input.hooks.updateState({
					state,
					reason: 'close'
				});
			}
		);
	}

	return state;
}

async function getUpdatedStateOnClose(input: {
	state: State;
	hooks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = {} as State;

	if (input.state.isOpen) {
		state.isOpen = false;
	}

	return state;
}

/**
 * Programmatically open the modal.
 */
export async function open(input: {
	state: State;
	dialogEl: HTMLDialogElement;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	if (!state.isOpen) {
		input.dialogEl.showModal();
		state = await input.hooks.updateState({
			state: {
				isOpen: true
			},
			reason: 'open'
		});
	}

	return state;
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
	let collectedState: Partial<State> = {};

	let doesStateGotUpdated: boolean = false;

	await collector(async (input) => {
		collectedState = Object.assign(collectedState, input.state);
		doesStateGotUpdated = true;
		return collectedState as State;
	});

	if (doesStateGotUpdated && updateState) {
		state = await updateState(collectedState as State);
	}

	return state as State;
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
