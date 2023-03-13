<script lang="ts">
	import * as autocompleteHelpers from '$lib/lib/combobox/autocomplete.js';
	import * as api from './suggestions.js';
	import { onMount } from 'svelte';
	import { debounce } from '$lib/debounce.js';
	import ElementInViewChecker from '$lib/ElementInViewChecker.js';

	export let autocomplete: 'list' | 'both' | 'none';

	export let state = autocompleteHelpers.setState({
		autocomplete,
		isListboxOpen: false,
		elementWithFocus: null,
		activeOption: null
	});

	$: activeOptionId = state.activeOption ? getOptionId(state.activeOption) : null;

	let hooks = autocompleteHelpers.setHooks({
		updateState: async (input) => {
			state = { ...state, ...input.state };

			if (input.state.activeOption) {
				handleActiveOptionChange();
			}

			return state;
		},
		prepareOptions: async () => {
			let result = true;

			filter = comboboxValue;
			result = await fetchSuggestions({
				filter: behavior.canFilterOptionsInListbox ? filter : ''
			});

			if (!result) {
				state.isListboxOpen = false;
			}

			return result;
		},
		getNextOption: async (input) => {
			return getNextOption(input.option);
		},
		getPreviousOption: async (input) => {
			return getPreviousOption(input.option);
		},
		findOptionToActivate: async (input) => {
			if (!suggestions || !comboboxValue) return;

			let optionToActivate: string | null = null;

			if (state.activeOption != null && suggestions.indexOf(state.activeOption) >= 0) {
				optionToActivate = state.activeOption;
			} else {
				const firstSuggestion = suggestions.at(0)!;

				if (firstSuggestion?.toLocaleLowerCase().startsWith(comboboxValue.toLowerCase())) {
					optionToActivate = firstSuggestion;
				}
			}

			return optionToActivate;
		},
		setSelectedOption: async (input) => {
			console.log(input);
			comboboxValue = input.option ?? '';
		},
		focusCombobox: async () => {
			comboboxEl.focus();
		},
		clearCombobox: async () => {
			comboboxValue = '';
		},
		showInlineSuggestion: async () => {
			if (state.activeOption) {
				comboboxEl.value = comboboxValue = state.activeOption;
				setComboboxSelectionRange({
					start: filter.length,
					end: state.activeOption.length
				});
			}
		},
		checkIfListboxCanOpen: async () => {
			return true;
		}
	});

	let behavior = autocompleteHelpers.getBehavior(state);

	let rootEl: HTMLElement;
	let comboboxEl: HTMLInputElement;
	let listboxEl: HTMLDataListElement;

	let errorMessage: string | null = null;
	let loading: boolean = false;
	let suggestions: string[] = [];
	let cachedFilter: string | null | undefined = undefined;

	let comboboxValue: string = '';
	let filter: string = comboboxValue;

	$: a11yAttributes = autocompleteHelpers.getA11yAttributes({ state, activeOptionId });

	let elementInViewChecker: ElementInViewChecker;

	onMount(() => {
		elementInViewChecker = new ElementInViewChecker(listboxEl);

		() => {
			elementInViewChecker.destroy();
		};
	});

	async function fetchSuggestions(input: { filter: string }) {
		try {
			if (cachedFilter === input.filter) {
				return true;
			}

			errorMessage = null;
			cachedFilter = input.filter;

			loading = true;

			const checkHasOverlap = await debounce({
				key: fetchSuggestions,
				delay: 100
			});
			if (checkHasOverlap()) return false;

			const response = await api.fetchSuggestions(input.filter);
			if (checkHasOverlap()) return false;

			if (response.status === 404) {
				loading = false;
				throw new Error('No results found');
			} else if (response.status >= 500) {
				throw new Error('Error fetching results', {
					cause: response.body
				});
			}

			const responseBody = await response.json();
			if (checkHasOverlap()) return false;

			suggestions = responseBody;
			loading = false;

			return true;
		} catch (e) {
			const error = e as Error;
			errorMessage = error.message;

			suggestions = [];
			loading = false;

			return false;
		}
	}

	function findComboboxValueMatch() {
		return suggestions.find((option) => option === comboboxValue);
	}

	async function setComboboxSelectionRange(input: { start: number; end: number }) {
		comboboxEl.setSelectionRange(input.start, input.end);
	}

	async function scrollOptionIntoView(input: { option: string }) {
		const optionEl = listboxEl.querySelector(`[value="${input.option}"]`);

		if (!optionEl) {
			return;
		}

		const isOptionInView = await elementInViewChecker.check(optionEl);
		if (!isOptionInView) {
			optionEl.scrollIntoView({
				block: 'nearest'
			});
		}
	}

	async function getNextOption(option: string | null) {
		if (!suggestions?.length) return null;

		let index: number = 0;

		if (!option) {
			const match = findComboboxValueMatch();
			if (match) {
				index = suggestions.indexOf(match) + 1;
			}
		} else {
			index = suggestions.indexOf(option) + 1;
		}

		if (index > suggestions.length - 1) {
			index = 0;
		}

		return suggestions.at(index) ?? null;
	}

	async function getPreviousOption(option: string | null) {
		if (!suggestions?.length) return null;

		let index: number = 0;

		if (!option) {
			const match = findComboboxValueMatch();
			if (match) {
				index = suggestions.indexOf(match) - 1;
			}
		} else {
			index = suggestions.indexOf(option) - 1;
		}

		if (index < 0) {
			index = suggestions.length - 1;
		}

		return suggestions.at(index) ?? null;
	}

	function getOptionId(option: string) {
		return `cb1-option-${option}`;
	}

	async function handleActiveOptionChange() {
		if (!state.activeOption) return;

		scrollOptionIntoView({ option: state.activeOption });
	}

	async function handleRootFocusOut(event: FocusEvent) {
		await autocompleteHelpers.handleRootFocusOut({ state, root: rootEl, event, hooks });
	}

	async function handleOptionClick(input: { option: string }) {
		await autocompleteHelpers.handleOptionClick({
			...input,
			state,
			hooks
		});
	}

	async function handleButtonClick() {
		await autocompleteHelpers.handleButtonClick({
			state,
			hooks
		});
	}

	async function handleListboxClick(event: MouseEvent) {
		await autocompleteHelpers.handleListboxClick({ event });
	}

	async function handleBackgroundPointerUp(event: MouseEvent) {
		await autocompleteHelpers.handleBackgroundPointerUp({ state, event, rootEl, hooks });
	}

	async function handleComboboxClick(event: MouseEvent) {
		await autocompleteHelpers.handleComboboxClick({
			state,
			hooks
		});
	}

	async function handleComboboxFocus() {
		await autocompleteHelpers.handleComboboxFocus({
			state,
			hooks
		});
	}

	async function handleComboboxKeyDown(event: KeyboardEvent) {
		await autocompleteHelpers.handleComboboxKeyDown({
			state,
			event,
			hooks
		});
	}

	async function handleComboboxInput(e: Event) {
		const event = e as InputEvent;
		const target = event.target as HTMLInputElement;

		comboboxValue = target.value;

		await autocompleteHelpers.handleComboboxInput({
			state,
			event,
			hooks
		});
	}
</script>

<svelte:window on:pointerup={handleBackgroundPointerUp} />

<div
	bind:this={rootEl}
	class="Autocomplete Autocomplete__listbox-anchor"
	on:focusout={handleRootFocusOut}
>
	<label class="Autocomplete__input-container" aria-label="State">
		<span>State</span>

		<div class="Autocomplete__input-group" class:focus={state.elementWithFocus === 'combobox'}>
			<input
				bind:this={comboboxEl}
				id="Autocomplete__input"
				class="Autocomplete__input"
				value={comboboxValue}
				type="text"
				role="combobox"
				aria-expanded={a11yAttributes.combobox['aria-expanded']}
				aria-autocomplete={autocomplete}
				aria-controls="Autocomplete__listbox"
				aria-activedescendant={a11yAttributes.combobox['aria-activedescendant']}
				on:input={handleComboboxInput}
				on:keydown={handleComboboxKeyDown}
				on:click={handleComboboxClick}
				on:focus={handleComboboxFocus}
			/>
			<button
				class="Autocomplete__button"
				type="button"
				tabindex="-1"
				aria-label="State"
				aria-expanded={a11yAttributes.button['aria-expanded']}
				aria-controls="cb1-listbox"
				on:click={handleButtonClick}
			>
				<svg
					width="18"
					height="16"
					aria-hidden="true"
					focusable="false"
					style="forced-color-adjust: auto"
				>
					<polygon
						class="arrow"
						stroke-width="0"
						fill-opacity="0.75"
						fill="currentcolor"
						points="3,6 15,6 9,14"
					/>
				</svg>
			</button>
		</div>
	</label>

	<datalist
		bind:this={listboxEl}
		id="Autocomplete__listbox"
		class="Autocomplete__listbox"
		class:Autocomplete__listbox--focus={state.elementWithFocus === 'listbox'}
		class:Autocomplete__listbox--open={state.isListboxOpen}
		aria-label="State"
		on:click={handleListboxClick}
	>
		{#if errorMessage}
			<option disabled>{errorMessage}</option>
		{:else if loading}
			<option disabled>Loading...</option>
		{:else if suggestions.length}
			{#each suggestions as suggestion}
				<option
					id={getOptionId(suggestion)}
					class="Autocomplete__option"
					class:Autocomplete__option--active={state.activeOption === suggestion}
					class:Autocomplete__option--selected={comboboxValue === suggestion}
					value={suggestion}
					aria-selected={state.activeOption === suggestion
						? a11yAttributes.activeOption['aria-selected']
						: a11yAttributes.otherOptions['aria-selected']}
					on:click={() => handleOptionClick({ option: suggestion })}
				>
					{suggestion}
				</option>
			{/each}
		{/if}
	</datalist>
</div>

<style>
	.Autocomplete {
		user-select: none;
	}

	.Autocomplete__listbox-anchor {
		position: relative;
		z-index: 1;
	}

	.Autocomplete__input-container {
		display: block;
	}

	.Autocomplete__listbox {
		display: none;
		position: absolute;
		width: 100%;
		border: black solid 1px;
		max-height: 200px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.Autocomplete__listbox--focus {
		border: blue solid 1px;
	}

	.Autocomplete__input-group {
		display: flex;
		border: gray solid 1px;
	}

	.Autocomplete:active .Autocomplete__input-group,
	.Autocomplete__input-group:focus-within {
		outline: blue solid 1px;
	}

	.Autocomplete__input {
		border: none;
	}

	.Autocomplete__input:focus-visible {
		outline: none;
	}

	.Autocomplete__button {
		appearance: none;
		border: none;
		background: none;
	}

	.Autocomplete__button:hover {
		cursor: pointer;
		background-color: lightgray;
	}

	.Autocomplete__listbox--open {
		display: block;
	}

	.Autocomplete__option {
		cursor: pointer;
	}

	.Autocomplete__option:where(:hover) {
		background-color: whitesmoke;
	}

	.Autocomplete__option--selected {
		background-color: lightblue;
	}

	.Autocomplete__option--active {
		background-color: lightgray;
	}
</style>
