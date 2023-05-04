/**
 * Handles input events on the combobox, for the specs check the following resources:
 * - for {@link State.autocomplete} `"list"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/#kbd_label
 * - for {@link State.autocomplete} `"both"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/#kbd_label
 * - for {@link State.autocomplete} `"none"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-none/#kbd_label
 */
export async function handleComboboxInput(input: {
	state: State;
	event: InputEvent;
	hooks: {
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
	} else {
		return;
	}

	let reason = `combobox input: ${
		input.event.inputType.startsWith('insert') ? 'insert' : 'delete'
	}` as const;

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

			let listboxCanOpen = await input.hooks.checkIfListboxCanOpen({
				reason
			});

			if (listboxCanOpen && !state.isListboxOpen) {
				await updateStateOnOpen({
					state,
					hooks: { updateState }
				});
			} else if (!listboxCanOpen && state.isListboxOpen) {
				await updateStateOnClose({
					force: true,
					state,
					hooks: { updateState }
				});
			}
		},
		async (statePatch) => {
			return await input.hooks.updateState({
				state: statePatch,
				reason
			});
		}
	);

	if (state.isListboxOpen) {
		const optionsAreReady =
			(await input.hooks.prepareOptions?.({
				reason
			})) ?? true;

		if (!optionsAreReady) return;
	}

	if (input.hooks.findOptionToActivate) {
		const optionToActivate = await input.hooks.findOptionToActivate({
			reason
		});

		if (state.activeOption != optionToActivate) {
			state = await input.hooks.updateState({
				state: { activeOption: optionToActivate ?? null },
				reason
			});
		}
	}

	const behavior = getBehavior(state);
	if (
		behavior.canShowInlineSuggestions &&
		state.activeOption &&
		input.event.inputType.startsWith('insert') &&
		input.hooks.showInlineSuggestion
	) {
		input.hooks.showInlineSuggestion({
			reason
		});
	}
}

/**
 * Handles keydown events on the combobox, for the specs check the following resources:
 * - for {@link State.autocomplete} `"list"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/#kbd_label
 * - for {@link State.autocomplete} `"both"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/#kbd_label
 * - for {@link State.autocomplete} `"none"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-none/#kbd_label
 */
export async function handleComboboxKeyDown(input: {
	state: State;
	event: KeyboardEvent;
	/**
	 * The value of the combobox.
	 */
	value: string;
	hooks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
		getPreviousOption: Hooks['getPreviousOption'];
		getNextOption: Hooks['getNextOption'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
		prepareOptions?: Hooks['prepareOptions'];
		setComboboxValue?: Hooks['setComboboxValue'];
		showInlineSuggestion?: Hooks['showInlineSuggestion'];
		commitValue?: Hooks['commitValue'];
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

			if (state.isListboxOpen) {
				// do not prevent form submit when the listbox is closed
				shouldPreventDefault = true;
			}

			state = await collectStateUpdates(
				state,
				async (updateState) => {
					await updateStateOnClose({
						force: true,
						state,
						hooks: {
							updateState
						}
					});
					await updateState({
						state: {
							elementWithFocus: 'combobox'
						}
					});

					if (input.hooks.setComboboxValue && currentActiveOption) {
						await input.hooks.setComboboxValue({
							value: currentActiveOption,
							reason: 'combobox keydown: Enter'
						});
					}

					if (input.hooks.commitValue) {
						await input.hooks.commitValue({
							reason: 'combobox keydown: Enter'
						});
					}
				},
				(state) =>
					input.hooks.updateState({
						state,
						reason: 'combobox keydown: Enter'
					})
			);

			break;
		}

		case 'Down':
		case 'ArrowDown': {
			let isActiveOptionChanged: boolean = false;

			const canContinue =
				state.isListboxOpen ||
				(await input.hooks.checkIfListboxCanOpen({
					reason: 'combobox keydown: ArrowDown'
				}));

			if (!canContinue) return;

			if (!state.isListboxOpen) {
				state = await collectStateUpdates(
					state,
					async (updateState) => {
						await updateStateOnOpen({
							state,
							hooks: {
								updateState
							}
						});
					},
					(state) =>
						input.hooks.updateState({
							state,
							reason: 'combobox keydown: ArrowDown'
						})
				);

				const optionsAreReady =
					(await input.hooks.prepareOptions?.({
						reason: 'combobox keydown: ArrowDown'
					})) ?? true;

				if (!optionsAreReady || input.event.altKey) return;

				if (input.hooks.findOptionToActivate) {
					const optionToActivate = await input.hooks.findOptionToActivate({
						reason: 'combobox keydown: ArrowDown'
					});

					if (state.activeOption != optionToActivate) {
						isActiveOptionChanged = true;
						state = await input.hooks.updateState({
							state: { activeOption: optionToActivate ?? null },
							reason: 'combobox keydown: ArrowDown'
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

					const nextOption = await input.hooks.getNextOption({
						option: state.activeOption,
						reason: 'combobox keydown: ArrowDown'
					});
					if (nextOption && nextOption !== state.activeOption) {
						await updateState({
							state: {
								activeOption: nextOption
							}
						});

						isActiveOptionChanged = true;
					}
				},
				(state) =>
					input.hooks.updateState({
						state,
						reason: 'combobox keydown: ArrowUp'
					})
			);

			const behavior = getBehavior(state);
			if (behavior.canShowInlineSuggestions && isActiveOptionChanged && state.activeOption) {
				input.hooks.setComboboxValue?.({
					value: state.activeOption,
					reason: 'combobox keydown: ArrowDown'
				});
			}

			shouldPreventDefault = true;
			break;
		}

		case 'Up':
		case 'ArrowUp': {
			let isActiveOptionChanged: boolean = false;

			const canContinue =
				state.isListboxOpen ||
				(await input.hooks.checkIfListboxCanOpen({
					reason: 'combobox keydown: ArrowDown'
				}));

			if (!canContinue) return;

			if (!state.isListboxOpen) {
				state = await collectStateUpdates(
					state,
					async (updateState) => {
						await updateStateOnOpen({
							state,
							hooks: {
								updateState
							}
						});
					},
					(state) =>
						input.hooks.updateState({
							state,
							reason: 'combobox keydown: ArrowUp'
						})
				);

				const optionsAreReady =
					(await input.hooks.prepareOptions?.({
						reason: 'combobox keydown: ArrowUp'
					})) ?? true;

				if (!optionsAreReady || input.event.altKey) return;

				if (input.hooks.findOptionToActivate) {
					const optionToActivate = await input.hooks.findOptionToActivate({
						reason: 'combobox keydown: ArrowUp'
					});

					if (state.activeOption != optionToActivate) {
						isActiveOptionChanged = true;
						state = await input.hooks.updateState({
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

					const prevOption = await input.hooks.getPreviousOption({
						option: state.activeOption,
						reason: 'combobox keydown: ArrowUp'
					});
					if (prevOption && prevOption !== state.activeOption) {
						await updateState({
							state: {
								activeOption: prevOption
							}
						});

						isActiveOptionChanged = true;
					}
				},
				(state) =>
					input.hooks.updateState({
						state,
						reason: 'combobox keydown: ArrowUp'
					})
			);

			const behavior = getBehavior(state);
			if (behavior.canShowInlineSuggestions && isActiveOptionChanged && state.activeOption) {
				input.hooks.setComboboxValue?.({
					value: state.activeOption,
					reason: 'combobox keydown: ArrowUp'
				});
			}

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
							hooks: {
								updateState
							}
						});

						await updateState({
							state: {
								elementWithFocus: 'combobox'
							}
						});
					} else if (input.value) {
						if (input.hooks.setComboboxValue) {
							await input.hooks.setComboboxValue({
								value: '',
								reason: 'combobox keydown: Esc'
							});
						}

						if (input.hooks.commitValue) {
							await input.hooks.commitValue({
								reason: 'combobox keydown: Esc'
							});
						}
					}
				},
				(state) =>
					input.hooks.updateState({
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
						hooks: {
							updateState
						}
					});

					if (input.hooks.setComboboxValue && currentActiveOption) {
						await input.hooks.setComboboxValue({
							value: currentActiveOption,
							reason: 'combobox keydown: Tab'
						});
					}

					if (input.hooks.commitValue) {
						await input.hooks.commitValue({
							reason: 'combobox keydown: Tab'
						});
					}
				},
				(state) =>
					input.hooks.updateState({
						state,
						reason: 'combobox keydown: Tab'
					})
			);

			break;
		}
	}

	if (shouldPreventDefault) {
		input.event.preventDefault();
	}
}

/**
 * Set the combobox as the element with visual focus.
 *
 * @param input
 */
export async function handleComboboxFocus(input: {
	state: State;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	await input.hooks.updateState({
		state: {
			elementWithFocus: 'combobox'
		},
		reason: 'combobox focus'
	});
}

/**
 * Open the listbox if needed and set the active option when there's a match with the user input.
 * Set the combobox as the element with visual focus.
 *
 * @param input
 */
export async function handleComboboxClick(input: {
	state: State;
	hooks: {
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
				(await input.hooks.checkIfListboxCanOpen({
					reason: 'combobox click'
				}))
			) {
				await updateStateOnOpen({
					state,
					hooks: {
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
			input.hooks.updateState({
				state,
				reason: 'combobox click'
			})
	);

	if (!state.isListboxOpen) return;

	const optionsAreReady =
		(await input.hooks.prepareOptions?.({
			reason: 'combobox click'
		})) ?? true;

	if (!optionsAreReady) return;

	if (input.hooks.findOptionToActivate) {
		const optionToActivate = await input.hooks.findOptionToActivate({
			reason: 'combobox click'
		});

		if (state.activeOption != optionToActivate) {
			state = await input.hooks.updateState({
				state: { activeOption: optionToActivate ?? null },
				reason: optionToActivate
					? 'combobox click: filter match'
					: 'combobox click: filter doesnt match'
			});
		}
	}
}

/**
 * Prevent the default behavior of the event, calls stopPropagation() and preventDefault() on the event.
 *
 * @param input
 */
export async function handleComboboxChange(input: { event: Event }) {
	input.event.stopPropagation();
	input.event.preventDefault();
}

/**
 * Toggle listbox open/closed state and move the focus to the combobox element.
 */
export async function handleButtonClick(input: {
	state: State;
	hooks: {
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
					hooks: {
						updateState
					}
				});
			} else if (
				await input.hooks.checkIfListboxCanOpen({
					reason: 'button click'
				})
			) {
				await updateStateOnOpen({
					state,
					hooks: {
						updateState
					}
				});

				if (state.elementWithFocus != 'combobox') {
					await updateState({
						state: {
							elementWithFocus: 'combobox'
						}
					});
				}

				if (input.hooks.focusCombobox) {
					await input.hooks.focusCombobox({
						reason: 'button click'
					});
				}
			}
		},
		(state) =>
			input.hooks.updateState({
				state,
				reason: 'button click'
			})
	);

	if (state.isListboxOpen) {
		await input.hooks.prepareOptions?.({
			reason: 'button click'
		});

		if (input.hooks.findOptionToActivate) {
			const optionToActivate = await input.hooks.findOptionToActivate({
				reason: 'button click'
			});

			if (state.activeOption != optionToActivate) {
				state = await input.hooks.updateState({
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

/**
 * Close the listbox if needed.
 */
export async function handleRootFocusOut(input: {
	state: State;
	event: FocusEvent;
	rootEl: HTMLElement;
	/**
	 * The value of the combobox input element (eventually including inline suggestion).
	 */
	value: string;
	hooks: {
		updateState: Hooks['updateState'];
		commitValue?: Hooks['commitValue'];
	};
}): Promise<void> {
	let state = input.state;

	if (!document.hasFocus() || input.rootEl.querySelector(':scope:hover, :hover')) {
		return;
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnClose({
				force: false,
				state,
				hooks: {
					updateState
				}
			});

			if (input.hooks.commitValue) {
				await input.hooks.commitValue({
					reason: 'root focusout'
				});
			}
		},
		(state) =>
			input.hooks.updateState({
				state,
				reason: 'root focusout'
			})
	);
}

/**
 * Select the option, close the listbox and move the focus to the combobox element.
 *
 * @param input
 */
export async function handleOptionClick(input: {
	state: State;
	/**
	 * The value of the combobox (only what the user has typed).
	 */
	value: string;
	/**
	 * The clicked option.
	 */
	option: string;
	hooks: {
		updateState: Hooks['updateState'];
		setComboboxValue?: Hooks['setComboboxValue'];
		focusCombobox?: Hooks['focusCombobox'];
		commitValue?: Hooks['commitValue'];
	};
}): Promise<void> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnClose({
				force: true,
				state,
				hooks: {
					updateState
				}
			});

			if (state.elementWithFocus != 'combobox') {
				await updateState({
					state: {
						elementWithFocus: 'combobox'
					}
				});
			}

			if (input.hooks.focusCombobox) {
				await input.hooks.focusCombobox({
					reason: 'option click'
				});
			}

			if (input.hooks.setComboboxValue) {
				await input.hooks.setComboboxValue({
					value: input.option,
					reason: 'option click'
				});
			}

			if (input.hooks.commitValue) {
				await input.hooks.commitValue({
					reason: 'option click'
				});
			}
		},
		(state) =>
			input.hooks.updateState({
				state,
				reason: 'option click'
			})
	);
}

/**
 * Close the listbox if needed.
 */
export async function handleBackgroundPointerUp(input: {
	state: State;
	event: Event;
	rootEl: HTMLElement;
	hooks: {
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
			await updateStateOnRemoveVisualFocus({ state, hooks: { updateState } });
			await updateStateOnClose({ force: true, state, hooks: { updateState } });
		},
		async (state) =>
			input.hooks.updateState({
				state,
				reason: 'background pointerup'
			})
	);
}

async function updateStateOnRemoveVisualFocus(input: {
	state: State;
	hooks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = input.state;

	state = await input.hooks.updateState({
		state: {
			elementWithFocus: null
		}
	});

	return state;
}

async function updateStateOnClose(input: {
	state: State;
	force: boolean;
	hooks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = input.state;

	if (
		state.isListboxOpen &&
		(input.force || (state.elementWithFocus !== 'listbox' && state.elementWithFocus !== 'combobox'))
	) {
		state = await input.hooks.updateState({
			state: {
				isListboxOpen: false,
				elementWithFocus: null,
				activeOption: null
			}
		});
	}

	return state;
}

/**
 * Programmatically close the listbox.
 */
export async function close(input: {
	state: State;
	force: boolean;
	hooks: {
		updateState: Hooks['updateState'];
	};
}): Promise<void> {
	let state = input.state;

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnClose({ state, force: input.force, hooks: { updateState } });
		},
		async (state) => input.hooks.updateState({ state, reason: 'close' })
	);
}

async function updateStateOnOpen(input: {
	state: State;
	hooks: {
		updateState: (input: UpdateStateInputInternal) => Promise<State>;
	};
}): Promise<State> {
	let state = input.state;

	if (!state.isListboxOpen) {
		state = await input.hooks.updateState({
			state: {
				isListboxOpen: true
			}
		});
	}

	return state;
}

/**
 * Programmatically open the listbox.
 */
export async function open(input: {
	state: State;
	hooks: {
		updateState: Hooks['updateState'];
		checkIfListboxCanOpen?: Hooks['checkIfListboxCanOpen'];
		prepareOptions?: Hooks['prepareOptions'];
		findOptionToActivate?: Hooks['findOptionToActivate'];
	};
}): Promise<void> {
	let state = input.state;

	if (!(await input.hooks.checkIfListboxCanOpen?.({ reason: 'open' }))) {
		return;
	}

	state = await collectStateUpdates(
		state,
		async (updateState) => {
			await updateStateOnOpen({
				state,
				hooks: { updateState }
			});
		},
		async (state) => input.hooks.updateState({ state, reason: 'open' })
	);

	await input.hooks.prepareOptions?.({
		reason: 'open'
	});

	if (input.hooks.findOptionToActivate) {
		const optionToActivate = await input.hooks.findOptionToActivate({
			reason: 'open'
		});

		if (state.activeOption != optionToActivate) {
			state = await input.hooks.updateState({
				state: { activeOption: optionToActivate ?? null },
				reason: optionToActivate ? 'open: filter match' : 'open: filter doesnt match'
			});
		}
	}
}

/**
 * Helps to correctly assign aria attributes to your elements for the given state.
 */
export function getA11yAttributes(input: {
	state: State;
	/**
	 * The id of the active option, if any.
	 */
	activeOptionId: string | null;
}) {
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

/**
 * List of this component capabilities for the given state, can be used to help you implement custom logics.
 */
export function getBehavior(state: State) {
	return {
		/**
		 * When `true` the options in the listbox should be updated accordingly to the user input.
		 *
		 * When `false` the options in the listbox should be static and not change.
		 */
		canFilterOptionsInListbox: state.autocomplete === 'list' || state.autocomplete === 'both',
		/**
		 * When `true` the current active option should be set as combobox value and inline suggestions should be shown on user input.
		 *
		 * When `false` the user input should be preserved until the user selects an option.
		 */
		canShowInlineSuggestions: state.autocomplete === 'both' || state.autocomplete === 'inline'
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

type UpdateStateReason =
	| 'root pointerover'
	| 'root pointerout'
	| 'root focusout'
	| 'combobox input: insert'
	| 'combobox input: delete'
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
export type setComboboxValueReason =
	| 'combobox keydown: Enter'
	| 'combobox keydown: Tab'
	| 'combobox keydown: Esc'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowUp'
	| 'option click';
export type ClearComboboxReason = 'combobox keydown: Esc';
export type FocusComboboxReason = 'button click' | 'option click';
export type ShowInlineSuggestionReason = 'combobox input: insert' | 'combobox input: delete';
export type FindOptionToActivatenReason =
	| 'combobox input: insert'
	| 'combobox input: delete'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowUp'
	| 'combobox click'
	| 'button click'
	| 'open';
export type GetNextOptionReason = 'combobox keydown: ArrowDown';
export type GetPreviousOptionReason = 'combobox keydown: ArrowUp';
export type CheckIfListboxCanOpenReason =
	| 'button click'
	| 'combobox input: insert'
	| 'combobox input: delete'
	| 'combobox click'
	| 'combobox keydown: ArrowUp'
	| 'combobox keydown: ArrowDown'
	| 'open';
export type PrepareOptionsReason =
	| 'combobox input: insert'
	| 'combobox input: delete'
	| 'combobox keydown: ArrowDown'
	| 'combobox keydown: ArrowUp'
	| 'combobox click'
	| 'button click'
	| 'open';
export type CommitValueReason =
	| 'combobox change'
	| 'combobox keydown: Enter'
	| 'combobox keydown: Tab'
	| 'combobox keydown: Esc'
	| 'option click'
	| 'root focusout';

export interface Hooks {
	/**
	 * Called when the state should be updated.
	 * This method is called only when a value is changed to avoid unnecessary calls.
	 * This method is called only with the properties that changed allowing the user to check for a specific property.
	 */
	updateState: (input: UpdateStateInput) => Promise<State>;
	/**
	 * Called to check if the listbox can be opened.
	 * When `false` is returned, the listbox won't be opened and all the logics related to the opening will be skipped
	 *
	 * Eg: When returns `false` on `keydown ArrowDown` the hooks related the {@link prepareOptions} hook won't be called.
	 *
	 * @returns `true` if the listbox can be opened, `false` otherwise.
	 */
	checkIfListboxCanOpen: (input: {
		/**
		 * The reason why {@link checkIfListboxCanOpen} checked.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: CheckIfListboxCanOpenReason;
	}) => Promise<boolean>;
	/**
	 * Called before running logics related to the options.
	 * Can be used to fetch data and/or filter the options.
	 *
	 * `false` shall be returned when the options failed to prepare for instance because of a network error or because no options are available for the current user input.
	 *
	 * When `false` is returned, all the logics related to the options will be skipped.
	 *
	 * Eg: When returns `false` on `keydown ArrowDown` {@link getNextOption} hook won't be called.
	 *
	 * **Note**: The listbox is not closed automatically because you may want to show a message in the listbox in place of the options.
	 * *If you want want to close the listbox when the options are not ready, you have to manually update the state.*
	 *
	 * @returns `true` if the options are ready. `false` otherwise.
	 *
	 */
	prepareOptions?: (input: {
		/**
		 * The reason why {@link prepareOptions} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: PrepareOptionsReason;
	}) => Promise<boolean>;
	/**
	 * Allows to provide the previous option to activate on `keydown ArrowUp`.
	 *
	 * When `null` is returned, no option will be activated and {@link State.activeOption} will be set to `null`.
	 *
	 * @returns The previous option to activate or `null` if there is no previous option.
	 */
	getPreviousOption: (input: {
		/**
		 * The current active option.
		 */
		option: State['activeOption'];
		/**
		 * The reason why {@link getPreviousOption} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: GetPreviousOptionReason;
	}) => Promise<string | null | undefined>;
	/**
	 * Allows to provide the next option to activate on `keydown ArrowDown`.
	 *
	 * When `null` is returned, no option will be activated and {@link State.activeOption} will be set to `null`.
	 *
	 * @returns The next option to activate or `null` if there is no next option.
	 */
	getNextOption: (input: {
		/**
		 * The current active option.
		 */
		option: State['activeOption'];
		/**
		 * The reason why {@link getNextOption} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: GetNextOptionReason;
	}) => Promise<string | null | undefined>;
	/**
	 * Called to check if there's an option to activate that match the current user input when the listbox is opened.
	 *
	 * @returns The option to activate or `null` if there's no option to activate.
	 */
	findOptionToActivate?: (input: {
		/**
		 * The reason why {@link findOptionToActivate} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: FindOptionToActivatenReason;
	}) => Promise<string | null | undefined>;
	/**
	 * Called when an option is selected or when the user wants to clear the combobox by pressing `Esc`.
	 *
	 * The combobox value must be updated accordingly.
	 *
	 * When {@link State.autocomplete} is `both` this methos is called on `keydown ArrowDown` and `keydown ArrowUp` to update the combobox value.
	 */
	setComboboxValue?: (input: {
		/**
		 * The value of the selected option or an empty string in case the user pressed `Esc` to clear the combobox.
		 */
		value: string;
		/**
		 * The reason why {@link setComboboxValue} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: setComboboxValueReason;
	}) => Promise<void>;
	/**
	 * Called when the DOM focus must be moved to the combobox when a click occurs on the button.
	 */
	focusCombobox?: (input: {
		/**
		 * The reason why {@link focusCombobox} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: FocusComboboxReason;
	}) => Promise<void>;
	/**
	 * Called when an inline suggestion should show on the combobox, it happens only when autocomplete is `both`.
	 */
	showInlineSuggestion?: (input: {
		/**
		 * The reason why {@link showInlineSuggestion} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: ShowInlineSuggestionReason;
	}) => Promise<void>;
	/**
	 * Called when the change event is expected to be triggered.
	 */
	commitValue?: (input: {
		/**
		 * The reason why {@link commitValue} is called.
		 *
		 * Can be used to implement custom logics.
		 */
		reason: CommitValueReason;
	}) => Promise<void>;
}

export interface State {
	/**
	 * The of autocompletition to apply.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-autocomplete
	 */
	autocomplete: 'none' | 'both' | 'list' | 'inline';
	/**
	 * Define the open/closed state of the listbox.
	 */
	isListboxOpen: boolean;
	/**
	 * The element that has the focus.
	 */
	elementWithFocus: 'combobox' | 'listbox' | null;
	/**
	 * The currently active option.
	 *
	 * Can be used to apply some highlighting on the element.
	 */
	activeOption: string | null;
}
