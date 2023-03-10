export async function handleComboboxInput(input: {
	state: State;
	event: InputEvent;
	comboboxValue: string;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
		showInlineSuggestion?: Hooks['showInlineSuggestion'];
	};
}): Promise<State> {
	let state = input.state;

	const isInsertOrDelete =
		input.event.inputType.startsWith('insert') || input.event.inputType.startsWith('delete');

	if (isInsertOrDelete) {
		input.event.preventDefault();
	}

	let listboxCanOpen = await input.callbacks.checkIfListboxCanOpen({
		reason: 'combobox input'
	});
	state = await collectStateUpdates(
		state,
		async (updateState) => {
			if (listboxCanOpen) {
				if (state.elementWithFocus !== 'combobox') {
					await updateState({
						state: {
							elementWithFocus: 'combobox'
						}
					});
				}

				if (!state.isListboxOpen) {
					await updateStateOnOpen({
						state,
						callbacks: { updateState }
					});
				}
			} else if (state.isListboxOpen) {
				await updateStateOnClose({
					force: false,
					state,
					callbacks: { updateState }
				});
			}
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'combobox input'
			})
	);

	if (state.autocomplete !== 'list' && state.autocomplete !== 'both') {
		return state;
	}

	if (listboxCanOpen) {
		let optionToActivate: string | null = null;
		if (input.callbacks.findOptionToActivate) {
			optionToActivate = await input.callbacks.findOptionToActivate({
				filter: input.comboboxValue,
				reason: 'combobox input'
			});
		}

		if (optionToActivate) {
			state = await input.callbacks.updateState({
				state: { activeOption: optionToActivate },
				reason: 'combobox input: filter match'
			});

			if (
				(state.autocomplete === 'both' || state.elementWithFocus === 'listbox') &&
				input.event.inputType.startsWith('insert')
			) {
				if (input.callbacks.showInlineSuggestion) {
					state = await input.callbacks.showInlineSuggestion({
						reason: 'combobox input'
					});
				}
			}
		} else if (state.activeOption != null) {
			state = await input.callbacks.updateState({
				state: { activeOption: null },
				reason: 'combobox input: filter doesnt match'
			});
		}
	}

	return state;
}

export async function handleComboboxKeyDown(input: {
	event: KeyboardEvent;
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		getFirstOption: Hooks['getFirstOption'];
		getPreviousOption: Hooks['getPreviousOption'];
		getNextOption: Hooks['getNextOption'];
		getLastOption: Hooks['getLastOption'];
		setSelectedOption?: Hooks['setSelectedOption'];
		clearCombobox?: Hooks['clearCombobox'];
	};
}): Promise<State> {
	let state = input.state;

	let shouldPreventDefault = false;

	if (input.event.ctrlKey) {
		return state;
	}

	if (input.event.shiftKey && input.event.key !== 'Tab') {
		return state;
	}

	switch (input.event.key) {
		case 'Enter': {
			if (state.elementWithFocus === 'listbox' && input.callbacks.setSelectedOption) {
				state = await input.callbacks.setSelectedOption({
					option: state.activeOption,
					reason: 'combobox keydown: Enter'
				});
			}

			state = await collectStateUpdates(
				state,
				async (updateState) => {
					await updateStateOnClose({ force: true, state, callbacks: { updateState } });
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

			shouldPreventDefault = true;
			break;
		}

		case 'Down':
		case 'ArrowDown': {
			state = await collectStateUpdates(
				state,
				async (updateState) => {
					if (
						state.elementWithFocus !== 'listbox' &&
						!state.isListboxOpen &&
						(await input.callbacks.checkIfListboxCanOpen({
							reason: 'combobox keydown: ArrowUp'
						}))
					) {
						state = await updateStateOnOpen({
							state,
							callbacks: {
								updateState
							}
						});

						state = await updateState({
							state: {
								elementWithFocus: 'listbox'
							}
						});
					} else if (state.elementWithFocus !== 'listbox' && state.isListboxOpen) {
						state = await updateState({
							state: {
								elementWithFocus: 'listbox'
							}
						});
					}

					if (input.event.altKey) {
						return;
					}

					if (!state.activeOption) {
						const firstOption = await input.callbacks.getFirstOption({
							reason: 'combobox keydown: ArrowDown'
						});
						if (firstOption) {
							state = await updateState({
								state: {
									elementWithFocus: 'listbox',
									activeOption: firstOption
								}
							});
						}
					} else {
						const nextOption = await input.callbacks.getNextOption({
							option: state.activeOption,
							reason: 'combobox keydown: ArrowDown'
						});
						if (nextOption) {
							state = await updateState({
								state: {
									activeOption: nextOption
								}
							});
						}
					}
				},
				(state) =>
					input.callbacks.updateState({
						state,
						reason: 'combobox keydown: ArrowDown'
					})
			);

			shouldPreventDefault = true;
			break;
		}

		case 'Up':
		case 'ArrowUp': {
			state = await collectStateUpdates(
				state,
				async (updateState) => {
					if (
						state.elementWithFocus !== 'listbox' &&
						!state.isListboxOpen &&
						(await input.callbacks.checkIfListboxCanOpen({
							reason: 'combobox keydown: ArrowUp'
						}))
					) {
						state = await updateStateOnOpen({
							state,
							callbacks: {
								updateState
							}
						});

						state = await updateState({
							state: {
								elementWithFocus: 'listbox'
							}
						});
					} else if (state.elementWithFocus !== 'listbox' && state.isListboxOpen) {
						state = await updateState({
							state: {
								elementWithFocus: 'listbox'
							}
						});
					}

					if (input.event.altKey) {
						return;
					}

					if (!state.activeOption) {
						const lastOption = await input.callbacks.getLastOption({
							reason: 'combobox keydown: ArrowUp'
						});
						if (lastOption) {
							state = await updateState({
								state: {
									elementWithFocus: 'listbox',
									activeOption: lastOption
								}
							});
						}
					} else {
						const prevOption = await input.callbacks.getPreviousOption({
							option: state.activeOption,
							reason: 'combobox keydown: ArrowUp'
						});
						if (prevOption) {
							state = await updateState({
								state: {
									activeOption: prevOption
								}
							});
						}
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
							state = await input.callbacks.clearCombobox({
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

			if (
				state.elementWithFocus === 'listbox' &&
				state.activeOption &&
				input.callbacks.setSelectedOption
			) {
				state = await input.callbacks.setSelectedOption({
					option: state.activeOption,
					reason: 'combobox keydown: Tab'
				});
			}

			break;
		}
	}

	if (shouldPreventDefault) {
		input.event.preventDefault();
	}

	return state;
}

export async function handleComboboxFocus(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	state = await input.callbacks.updateState({
		state: {
			elementWithFocus: 'combobox'
		},
		reason: 'combobox focus'
	});

	return state;
}

export async function handleComboboxBlur(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnRemoveVisualFocus({
				state,
				callbacks: {
					updateState
				}
			});
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'combobox blur'
			})
	);

	return state;
}

export async function handleComboboxClick(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
	};
}): Promise<State> {
	let state = input.state;

	if (
		!state.isListboxOpen &&
		(await input.callbacks.checkIfListboxCanOpen({
			reason: 'combobox click'
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
					reason: 'combobox click'
				})
		);
	}

	return state;
}

export async function handleButtonClick(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
		focusCombobox?: Hooks['focusCombobox'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
	};
}): Promise<State> {
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
				state = await updateStateOnOpen({
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

	return state;
}

export async function handleRootPointerOut(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	state = await input.callbacks.updateState({
		state: {
			hasHover: false
		},
		reason: 'root pointerout'
	});

	return state;
}

export async function handleRootPointerOver(input: {
	state: State;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	state = await input.callbacks.updateState({
		state: {
			hasHover: true
		},
		reason: 'root pointerover'
	});

	return state;
}

export async function handleRootFocusOut(input: {
	state: State;
	root: HTMLElement;
	event: FocusEvent;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	if (input.root.contains(input.event.target as HTMLElement)) {
		return state;
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

			await updateState({
				state: {
					hasHover: false
				}
			});
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'root focusout'
			})
	);

	return state;
}

export async function handleOptionClick(input: {
	state: State;
	option: string;
	callbacks: {
		updateState: Hooks['updateState'];
		setSelectedOption?: Hooks['setSelectedOption'];
	};
}): Promise<State> {
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
		state = await input.callbacks.setSelectedOption({
			option: input.option,
			reason: 'click'
		});
	}

	return state;
}

export async function handleBackgroundPointerUp(input: {
	state: State;
	root: HTMLElement;
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

	if (input.root.contains(document.activeElement)) {
		return state;
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnRemoveVisualFocus({ state, callbacks: { updateState } });
			await updateStateOnClose({ force: true, state, callbacks: { updateState } });
		},
		(state) =>
			input.callbacks.updateState({
				state,
				reason: 'background pointerup'
			})
	);

	return state;
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

	if (
		state.isListboxOpen &&
		(input.force ||
			(state.elementWithFocus !== 'listbox' &&
				state.elementWithFocus !== 'combobox' &&
				!state.hasHover))
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
	callbacks: {
		updateState: Hooks['updateState'];
	};
}): Promise<State> {
	let state = input.state;

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
	| 'combobox input: filter match'
	| 'combobox input: filter doesnt match'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowUp'
	| 'combobox keydown: Enter'
	| 'combobox keydown: Esc'
	| 'combobox keydown: Tab'
	| 'combobox focus'
	| 'combobox blur'
	| 'combobox click'
	| 'button click'
	| 'option click'
	| 'background pointerup'
	| 'close'
	| 'open';
export type SetSelectedOptionReason =
	| 'click'
	| 'combobox keydown: Enter'
	| 'combobox keydown: Tab'
	| 'combobox keydown: Esc';
export type ClearComboboxReason = 'combobox keydown: Esc';
export type FocusComboboxReason = 'button click';
export type ShowInlineSuggestionReason = 'combobox input';
export type FindOptionToActivatenReason = 'combobox input';
export type GetFirstOptionReason = 'combobox keydown: ArrowDown';
export type GetPreviousOptionReason = 'combobox keydown: ArrowUp';
export type GetNextOptionReason = 'combobox keydown: ArrowDown';
export type GetLastOptionReason = 'combobox keydown: ArrowUp';
export type CheckIfListboxCanOpenReason =
	| 'button click'
	| 'combobox input'
	| 'combobox click'
	| 'combobox keydown: ArrowUp'
	| 'combobox keydown: ArrowDown';

export interface Hooks {
	updateState: (input: UpdateStateInput) => Promise<State>;
	checkIfListboxCanOpen: (input: { reason: CheckIfListboxCanOpenReason }) => Promise<boolean>;
	getFirstOption: (input: { reason: GetFirstOptionReason }) => Promise<string | null>;
	getPreviousOption: (input: {
		option: State['activeOption'];
		reason: GetPreviousOptionReason;
	}) => Promise<string | null>;
	getNextOption: (input: {
		option: State['activeOption'];
		reason: GetNextOptionReason;
	}) => Promise<string | null>;
	getLastOption: (input: { reason: GetLastOptionReason }) => Promise<string | null>;
	findOptionToActivate?: (input: {
		filter: string;
		reason: FindOptionToActivatenReason;
	}) => Promise<string | null>;
	setSelectedOption?: (input: {
		option: string | null;
		reason: SetSelectedOptionReason;
	}) => Promise<State>;
	clearCombobox?: (input: { reason: ClearComboboxReason }) => Promise<State>;
	focusCombobox?: (input: { reason: FocusComboboxReason }) => Promise<void>;
	showInlineSuggestion?: (input: { reason: ShowInlineSuggestionReason }) => Promise<State>;
}

export interface State {
	autocomplete: 'none' | 'both' | 'list';
	hasHover: boolean;
	isListboxOpen: boolean;
	elementWithFocus: 'combobox' | 'listbox' | null;
	activeOption: string | null;
}
