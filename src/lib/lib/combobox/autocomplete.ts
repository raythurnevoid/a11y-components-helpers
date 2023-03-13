export async function handleComboboxInput(input: {
	state: State;
	event: InputEvent;
	comboboxValue: string;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
		showInlineSuggestion?: Hooks['showInlineSuggestion'];
		prepareOptions?: Hooks['prepareOptions'];
	};
}): Promise<void> {
	let state = input.state;

	if (input.event.inputType.startsWith('insert') || input.event.inputType.startsWith('delete')) {
		input.event.preventDefault();
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			if (state.elementWithFocus !== 'combobox') {
				await updateState({
					state: {
						elementWithFocus: 'combobox'
					}
				});
			}

			let listboxCanOpen = await input.callbacks.checkIfListboxCanOpen({
				reason: 'combobox input'
			});

			if (listboxCanOpen) {
				if (!state.isListboxOpen) {
					await updateStateOnOpen({
						state,
						callbacks: { updateState }
					});
				}
			}
		},
		async (statePatch) => {
			return await input.callbacks.updateState({
				state: statePatch,
				reason: 'combobox input'
			});
		}
	);

	if (!state.isListboxOpen || (state.autocomplete !== 'list' && state.autocomplete !== 'both')) {
		return;
	}

	let optionsAreReady =
		(await input.callbacks.prepareOptions?.({
			reason: 'combobox input'
		})) ?? true;

	if (!optionsAreReady) return;

	if (input.callbacks.findOptionToActivate) {
		const optionToActivate = await input.callbacks.findOptionToActivate({
			filter: input.comboboxValue,
			reason: 'combobox input'
		});

		if (state.activeOption != optionToActivate) {
			state = await input.callbacks.updateState({
				state: { activeOption: optionToActivate ?? null },
				reason: optionToActivate
					? 'combobox input: filter match'
					: 'combobox input: filter doesnt match'
			});
		}
	}

	if (
		state.activeOption &&
		(state.autocomplete === 'both' || state.elementWithFocus === 'listbox') &&
		input.event.inputType.startsWith('insert') &&
		input.callbacks.showInlineSuggestion
	) {
		input.callbacks.showInlineSuggestion({
			reason: 'combobox input'
		});
	}
}

export async function handleComboboxKeyDown(input: {
	event: KeyboardEvent;
	state: State;
	comboboxValue: string;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		getPreviousOption: Hooks['getPreviousOption'];
		getNextOption: Hooks['getNextOption'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
		prepareOptions?: Hooks['prepareOptions'];
		setSelectedOption?: Hooks['setSelectedOption'];
		clearCombobox?: Hooks['clearCombobox'];
	};
}): Promise<void> {
	let state = input.state;

	let shouldPreventDefault = false;

	if (input.event.ctrlKey) {
		return;
	}

	if (input.event.shiftKey && input.event.key !== 'Tab') {
		return;
	}

	switch (input.event.key) {
		case 'Enter': {
			const currentActiveOption = state.activeOption;

			state = await collectStateUpdates(
				state,
				async (updateState) => {
					await updateStateOnClose({
						force: true,
						state,
						callbacks: {
							updateState
						}
					});
					await updateState({
						state: {
							elementWithFocus: 'combobox'
						}
					});
				},
				(state) =>
					input.callbacks.updateState({
						state,
						reason: 'combobox keydown: Enter'
					})
			);

			// if (state.elementWithFocus === 'listbox' && input.callbacks.setSelectedOption) {
			// 	await input.callbacks.setSelectedOption({
			// 		option: state.activeOption,
			// 		reason: 'combobox keydown: Enter'
			// 	});
			// }

			if (currentActiveOption && input.callbacks.setSelectedOption) {
				await input.callbacks.setSelectedOption({
					option: currentActiveOption,
					reason: 'combobox keydown: Enter'
				});
			}

			shouldPreventDefault = true;
			break;
		}

		case 'Down':
		case 'ArrowDown': {
			if (
				!state.isListboxOpen &&
				(await input.callbacks.checkIfListboxCanOpen({
					reason: 'combobox keydown: ArrowDown'
				}))
			) {
				state = await collectStateUpdates(
					state,
					async (updateState) => {
						await updateStateOnOpen({
							state,
							callbacks: {
								updateState
							}
						});
					},
					(state) =>
						input.callbacks.updateState({
							state,
							reason: 'combobox keydown: ArrowDown'
						})
				);

				let optionsAreReady =
					(await input.callbacks.prepareOptions?.({
						reason: 'combobox keydown: ArrowUp'
					})) ?? true;

				if (!optionsAreReady || input.event.altKey) return;

				if (input.callbacks.findOptionToActivate) {
					const optionToActivate = await input.callbacks.findOptionToActivate({
						filter: input.comboboxValue,
						reason: 'combobox input'
					});

					if (state.activeOption != optionToActivate) {
						state = await input.callbacks.updateState({
							state: { activeOption: optionToActivate ?? null },
							reason: optionToActivate
								? 'combobox input: filter match'
								: 'combobox input: filter doesnt match'
						});
					}
				}
			}

			state = await collectStateUpdates(
				state,
				async (updateState) => {
					if (state.elementWithFocus !== 'listbox') {
						await updateState({
							state: {
								elementWithFocus: 'listbox'
							}
						});
					}

					const nextOption = await input.callbacks.getNextOption({
						option: state.activeOption,
						reason: 'combobox keydown: ArrowDown'
					});
					if (nextOption) {
						await updateState({
							state: {
								activeOption: nextOption
							}
						});
					}
				},
				(state) =>
					input.callbacks.updateState({
						state,
						reason: 'combobox keydown: ArrowUp'
					})
			);

			shouldPreventDefault = true;
			break;
		}

		case 'Up':
		case 'ArrowUp': {
			if (
				!state.isListboxOpen &&
				(await input.callbacks.checkIfListboxCanOpen({
					reason: 'combobox keydown: ArrowUp'
				}))
			) {
				state = await collectStateUpdates(
					state,
					async (updateState) => {
						await updateStateOnOpen({
							state,
							callbacks: {
								updateState
							}
						});
					},
					(state) =>
						input.callbacks.updateState({
							state,
							reason: 'combobox keydown: ArrowUp'
						})
				);

				let optionsAreReady =
					(await input.callbacks.prepareOptions?.({
						reason: 'combobox keydown: ArrowUp'
					})) ?? true;

				if (!optionsAreReady || input.event.altKey) return;

				if (input.callbacks.findOptionToActivate) {
					const optionToActivate = await input.callbacks.findOptionToActivate({
						filter: input.comboboxValue,
						reason: 'combobox keydown: ArrowUp'
					});

					if (state.activeOption != optionToActivate) {
						state = await input.callbacks.updateState({
							state: { activeOption: optionToActivate ?? null },
							reason: optionToActivate
								? 'combobox keydown: ArrowUp: filter match'
								: 'combobox keydown: ArrowUp: filter doesnt match'
						});
					}
				}
			}

			state = await collectStateUpdates(
				state,
				async (updateState) => {
					if (state.elementWithFocus !== 'listbox') {
						await updateState({
							state: {
								elementWithFocus: 'listbox'
							}
						});
					}

					const prevOption = await input.callbacks.getPreviousOption({
						option: state.activeOption,
						reason: 'combobox keydown: ArrowUp'
					});
					if (prevOption) {
						await updateState({
							state: {
								activeOption: prevOption
							}
						});
					}
				},
				(state) =>
					input.callbacks.updateState({
						state,
						reason: 'combobox keydown: ArrowUp'
					})
			);

			shouldPreventDefault = true;
			break;
		}

		case 'Esc':
		case 'Escape': {
			state = await collectStateUpdates(
				state,
				async (updateState) => {
					if (state.isListboxOpen) {
						await updateStateOnClose({
							force: true,
							state,
							callbacks: {
								updateState
							}
						});

						await updateState({
							state: {
								elementWithFocus: 'combobox'
							}
						});
					} else {
						if (input.callbacks.clearCombobox) {
							await input.callbacks.clearCombobox({
								reason: 'combobox keydown: Esc'
							});
						}
					}
				},
				(state) =>
					input.callbacks.updateState({
						state,
						reason: 'combobox keydown: Esc'
					})
			);

			shouldPreventDefault = true;
			break;
		}

		case 'Tab': {
			const currentActiveOption = state.activeOption;

			state = await collectStateUpdates(
				state,
				async (updateState) => {
					await updateStateOnClose({
						force: true,
						state,
						callbacks: {
							updateState
						}
					});
				},
				(state) =>
					input.callbacks.updateState({
						state,
						reason: 'combobox keydown: Tab'
					})
			);

			if (currentActiveOption && input.callbacks.setSelectedOption) {
				await input.callbacks.setSelectedOption({
					option: currentActiveOption,
					reason: 'combobox keydown: Tab'
				});
			}

			break;
		}
	}

	if (shouldPreventDefault) {
		input.event.preventDefault();
	}
}

export async function handleComboboxFocus(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	state = await input.callbacks.updateState({
		state: {
			elementWithFocus: 'combobox'
		},
		reason: 'combobox focus'
	});
}

export async function handleComboboxBlur(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	// state = await collectStateUpdates(
	// 	state,
	// 	async (updateState) => {
	// 		await updateStateOnRemoveVisualFocus({
	// 			state,
	// 			callbacks: {
	// 				updateState
	// 			}
	// 		});
	// 	},
	// 	(state) =>
	// 		input.callbacks.updateState({
	// 			state,
	// 			reason: 'combobox blur'
	// 		})
	// );
}

export async function handleComboboxClick(input: {
	state: State;
	comboboxValue: string;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		prepareOptions?: Hooks['prepareOptions'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
	};
}): Promise<void> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			if (
				!state.isListboxOpen &&
				(await input.callbacks.checkIfListboxCanOpen({
					reason: 'combobox click'
				}))
			) {
				await updateStateOnOpen({
					state,
					callbacks: {
						updateState
					}
				});
			}

			if (state.elementWithFocus !== 'combobox') {
				await updateState({
					state: {
						elementWithFocus: 'combobox'
					}
				});
			}
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'combobox click'
			})
	);

	await input.callbacks.prepareOptions?.({
		reason: 'combobox click'
	});

	if (input.callbacks.findOptionToActivate) {
		const optionToActivate = await input.callbacks.findOptionToActivate({
			filter: input.comboboxValue,
			reason: 'combobox click'
		});

		if (state.activeOption != optionToActivate) {
			state = await input.callbacks.updateState({
				state: { activeOption: optionToActivate ?? null },
				reason: optionToActivate
					? 'combobox click: filter match'
					: 'combobox click: filter doesnt match'
			});
		}
	}
}

export async function handleButtonClick(input: {
	state: State;
	comboboxValue: string;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		focusCombobox?: Hooks['focusCombobox'];
		prepareOptions?: Hooks['prepareOptions'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
	};
}): Promise<void> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			if (state.isListboxOpen) {
				await updateStateOnClose({
					force: true,
					state,
					callbacks: {
						updateState
					}
				});
			} else if (
				await input.callbacks.checkIfListboxCanOpen({
					reason: 'button click'
				})
			) {
				await updateStateOnOpen({
					state,
					callbacks: {
						updateState
					}
				});
			}
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'button click'
			})
	);

	if (input.callbacks.focusCombobox) {
		await input.callbacks.focusCombobox({
			reason: 'button click'
		});
	}

	if (state.isListboxOpen) {
		await input.callbacks.prepareOptions?.({
			reason: 'button click'
		});

		if (input.callbacks.findOptionToActivate) {
			const optionToActivate = await input.callbacks.findOptionToActivate({
				filter: input.comboboxValue,
				reason: 'button click'
			});

			if (state.activeOption != optionToActivate) {
				state = await input.callbacks.updateState({
					state: { activeOption: optionToActivate ?? null },
					reason: optionToActivate
						? 'button click: filter match'
						: 'button click: filter doesnt match'
				});
			}
		}
	}

	return;
}

export async function handleListboxClick(input: { event: Event }) {
	input.event?.preventDefault();
}

export async function handleRootFocusOut(input: {
	state: State;
	root: HTMLElement;
	event: FocusEvent;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	if (input.root.contains(input.event.target as HTMLElement)) {
		return;
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnClose({
				force: false,
				state,
				callbacks: {
					updateState
				}
			});
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'root focusout'
			})
	);
}

export async function handleOptionClick(input: {
	state: State;
	option: string;
	callbacks: {
		updateState: Hooks['updateState'];
		setSelectedOption?: Hooks['setSelectedOption'];
	};
}): Promise<void> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnClose({
				force: true,
				state,
				callbacks: {
					updateState
				}
			});
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'option click'
			})
	);

	if (input.callbacks.setSelectedOption) {
		await input.callbacks.setSelectedOption({
			option: input.option,
			reason: 'option click'
		});
	}
}

export async function handleBackgroundPointerUp(input: {
	state: State;
	event: Event;
	rootEl: HTMLElement;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	const target = input.event.target as HTMLElement;
	if (input.rootEl.contains(target)) {
		return;
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnRemoveVisualFocus({ state, callbacks: { updateState } });
			await updateStateOnClose({ force: true, state, callbacks: { updateState } });
		},
		async (state) =>
			input.callbacks.updateState({
				state,
				reason: 'background pointerup'
			})
	);
}

async function updateStateOnRemoveVisualFocus(input: {
	state: State;
	callbacks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = input.state;

	state = await input.callbacks.updateState({
		state: {
			elementWithFocus: null
		}
	});

	return state;
}

async function updateStateOnClose(input: {
	state: State;
	force: boolean;
	callbacks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = input.state;

	console.warn('ASD', state);

	if (
		state.isListboxOpen &&
		(input.force || (state.elementWithFocus !== 'listbox' && state.elementWithFocus !== 'combobox'))
	) {
		state = await input.callbacks.updateState({
			state: {
				isListboxOpen: false,
				elementWithFocus: null,
				activeOption: null
			}
		});
	}

	return state;
}

export async function close(input: {
	state: State;
	force: boolean;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnClose({ state, force: input.force, callbacks: { updateState } });
		},
		async (state) => input.callbacks.updateState({ state, reason: 'close' })
	);

	return state;
}

async function updateStateOnOpen(input: {
	state: State;
	callbacks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = input.state;

	if (!state.isListboxOpen) {
		state = await input.callbacks.updateState({
			state: {
				isListboxOpen: true
			}
		});
	}

	return state;
}

export async function open(input: {
	state: State;
	comboboxValue: string;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen?: Hooks['checkIfListboxCanOpen'];
		prepareOptions?: Hooks['prepareOptions'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
	};
}): Promise<State> {
	let state = input.state;

	if (!(await input.callbacks.checkIfListboxCanOpen?.({ reason: 'open' }))) {
		return state;
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnOpen({
				state,
				callbacks: { updateState }
			});
		},
		async (state) => input.callbacks.updateState({ state, reason: 'open' })
	);

	await input.callbacks.prepareOptions?.({
		reason: 'open'
	});

	if (input.callbacks.findOptionToActivate) {
		const optionToActivate = await input.callbacks.findOptionToActivate({
			filter: input.comboboxValue,
			reason: 'open'
		});

		if (state.activeOption != optionToActivate) {
			state = await input.callbacks.updateState({
				state: { activeOption: optionToActivate ?? null },
				reason: optionToActivate ? 'open: filter match' : 'open: filter doesnt match'
			});
		}
	}

	return state;
}

export function getA11yAttributes(input: { state: State; activeOptionId: string | null }) {
	const activedescendant =
		input.state.isListboxOpen && input.activeOptionId ? input.activeOptionId : '';

	return {
		button: {
			['aria-expanded']: input.state.isListboxOpen ? ('true' as 'true') : ('false' as 'false')
		},
		combobox: {
			['aria-expanded']: input.state.isListboxOpen ? ('true' as 'true') : ('false' as 'false'),
			['aria-activedescendant']: activedescendant
		},
		activeOption: {
			['aria-selected']: 'true' as 'true'
		},
		otherOptions: {
			['aria-selected']: 'false' as 'false'
		}
	};
}

export function getBehavior(input: { state: State }) {
	return {
		canFilterOptionsInListbox: input.state.autocomplete !== 'none',
		canShowInlineSuggestions: input.state.autocomplete === 'both'
	};
}

export function setState(state: State) {
	return state;
}

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
		collectedState = { ...collectedState, ...input.state };
		doesStateGotUpdated = true;
		return collectedState as State;
	});

	if (doesStateGotUpdated && updateState) {
		state = await updateState(collectedState as State);
	}

	return state as State;
}

interface UpdateStateInputInternal {
	state: Partial<State>;
}

export interface UpdateStateInput extends UpdateStateInputInternal {
	reason: UpdateStateReason;
}

type UpdateStateReason =
	| 'root pointerover'
	| 'root pointerout'
	| 'root focusout'
	| 'combobox input'
	| 'combobox input: delete'
	| 'combobox input: filter match'
	| 'combobox input: filter doesnt match'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowDown: filter match'
	| 'combobox keydown: ArrowDown: filter doesnt match'
	| 'combobox keydown: ArrowUp'
	| 'combobox keydown: ArrowUp: filter match'
	| 'combobox keydown: ArrowUp: filter doesnt match'
	| 'combobox keydown: Enter'
	| 'combobox keydown: Esc'
	| 'combobox keydown: Tab'
	| 'combobox focus'
	| 'combobox blur'
	| 'combobox click'
	| 'combobox click: filter match'
	| 'combobox click: filter doesnt match'
	| 'button click'
	| 'button click: filter match'
	| 'button click: filter doesnt match'
	| 'option click'
	| 'background pointerup'
	| 'close'
	| 'open'
	| 'open: filter match'
	| 'open: filter doesnt match';
export type SetSelectedOptionReason =
	| 'combobox keydown: Enter'
	| 'combobox keydown: Tab'
	| 'combobox keydown: Esc'
	| 'option click';
export type ClearComboboxReason = 'combobox keydown: Esc';
export type FocusComboboxReason = 'button click';
export type ShowInlineSuggestionReason = 'combobox input';
export type FindOptionToActivatenReason =
	| 'combobox input'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowUp'
	| 'combobox click'
	| 'button click'
	| 'open';
export type GetFirstOptionReason = 'combobox keydown: ArrowDown';
export type GetPreviousOptionReason = 'combobox keydown: ArrowUp';
export type GetNextOptionReason = 'combobox keydown: ArrowDown';
export type GetLastOptionReason = 'combobox keydown: ArrowUp';
export type CheckIfListboxCanOpenReason =
	| 'button click'
	| 'combobox input'
	| 'combobox click'
	| 'combobox keydown: ArrowUp'
	| 'combobox keydown: ArrowDown'
	| 'open';
export type PrepareOptionsReason =
	| 'combobox input'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowUp'
	| 'combobox click'
	| 'button click'
	| 'open';

export interface Hooks {
	updateState: (input: UpdateStateInput) => Promise<State>;
	checkIfListboxCanOpen: (input: { reason: CheckIfListboxCanOpenReason }) => Promise<boolean>;
	prepareOptions?: (input: { reason: PrepareOptionsReason }) => Promise<boolean>;
	getPreviousOption: (input: {
		option: State['activeOption'];
		reason: GetPreviousOptionReason;
	}) => Promise<string | null | undefined>;
	getNextOption: (input: {
		option: State['activeOption'];
		reason: GetNextOptionReason;
	}) => Promise<string | null | undefined>;
	findOptionToActivate?: (input: {
		filter: string;
		reason: FindOptionToActivatenReason;
	}) => Promise<string | null | undefined>;
	setSelectedOption?: (input: {
		option: string | null;
		reason: SetSelectedOptionReason;
	}) => Promise<void>;
	clearCombobox?: (input: { reason: ClearComboboxReason }) => Promise<void>;
	focusCombobox?: (input: { reason: FocusComboboxReason }) => Promise<void>;
	showInlineSuggestion?: (input: { reason: ShowInlineSuggestionReason }) => Promise<void>;
}

export interface State {
	autocomplete: 'none' | 'both' | 'list';
	isListboxOpen: boolean;
	elementWithFocus: 'combobox' | 'listbox' | null;
	activeOption: string | null;
}
