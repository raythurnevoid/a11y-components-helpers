<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import * as autocompleteHelpers from '$lib/lib/autocomplete/autocomplete.js';
	import * as api from './suggestions.js';
	import { onMount, createEventDispatcher } from 'svelte';
	import ElementInViewChecker from '$lib/ElementInViewChecker.js';

	export let id: string = `Autocomplete-${index++}`;

	export let value: string = '';
	export let autocomplete: 'list' | 'both' | 'inline' | 'none' = 'both';
	export let label: string = '';
	export let disabled: boolean = false;
	export let readonly: boolean = false;

	export let state = autocompleteHelpers.setState({
		autocomplete,
		isListboxOpen: false,
		activeOption: null
	});

	const dispatch = createEventDispatcher<{
		change: { value: string };
		input: { value: string };
	}>();

	let behavior = autocompleteHelpers.getBehavior(state);

	let rootEl: HTMLElement;
	let comboboxEl: HTMLInputElement;
	let listboxEl: HTMLElement;
	let listboxId: string = `${id}__listbox`;
	let inputId: string = `${id}__input`;
	$: activeOptionId = state.activeOption ? getOptionId(state.activeOption) : null;

	$: a11yAttributes = autocompleteHelpers.getA11yAttributes({
		state,
		activeOptionId
	});

	let filter: string = value;
	let valueOnLastChange: string | null = value;
	let canCommitValue: boolean = false;

	let errorMessage: string | null = null;
	let loading: boolean = false;
	let suggestions: string[] = [];
	let cachedFilter: string | null | undefined = undefined;

	let elementInViewChecker: ElementInViewChecker;

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

			filter = value;

			if (behavior.canFilterOptionsInListbox) {
				result = await fetchSuggestions({ filter });
			} else {
				result = await fetchSuggestions({ filter: '' });
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
			if (input.reason === 'combobox input: delete') {
				return null;
			}

			if (!suggestions || !filter) return;

			let optionToActivate: string | null = null;

			if (state.activeOption != null && suggestions.indexOf(state.activeOption) >= 0) {
				optionToActivate = state.activeOption;
			} else if (input.reason !== 'combobox click') {
				optionToActivate =
					suggestions?.find((option) => option.toLowerCase().startsWith(filter.toLowerCase())) ??
					null;
			}

			return optionToActivate;
		},
		setComboboxValue: async (input) => {
			canCommitValue = true;
			comboboxEl.value = value = input.value ?? '';
			setComboboxSelectionRange({
				start: value.length,
				end: value.length
			});
		},
		focusCombobox: async () => {
			comboboxEl.focus();
		},
		showInlineSuggestion: async () => {
			if (state.activeOption) {
				comboboxEl.value = value = state.activeOption ?? '';
				setComboboxSelectionRange({
					start: filter.length,
					end: state.activeOption.length
				});
			}
		},
		checkIfListboxCanOpen: async () => {
			return !disabled && !readonly;
		},
		commitValue: async () => {
			if (!canCommitValue) return;

			let shouldDispatchChange = valueOnLastChange !== value;

			if (shouldDispatchChange) {
				valueOnLastChange = value;
				dispatch('change', { value });
				canCommitValue = false;
			}
		}
	});

	onMount(() => {
		comboboxEl = rootEl.querySelector('input')!;

		elementInViewChecker = new ElementInViewChecker(listboxEl);

		() => {
			elementInViewChecker.destroy();
		};
	});

	async function fetchSuggestions(input: { filter: string }) {
		try {
			errorMessage = null;

			if (cachedFilter === input.filter) {
				loading = false;
				return true;
			}

			loading = true;

			const response = await api.fetchSuggestions(input.filter);
			if (response.status === 404) {
				loading = false;
				throw new Error('No results found');
			} else if (response.status >= 500) {
				throw new Error('Error fetching results', {
					cause: response.body
				});
			}

			const responseBody = await response.json();

			suggestions = responseBody;
			cachedFilter = input.filter;
			loading = false;

			return true;
		} catch (e) {
			const error = e as Error;
			errorMessage = error.message;
			loading = false;

			return false;
		}
	}

	function findComboboxValueMatch() {
		return suggestions?.find((option) => option === value);
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
		return `${id}__option:${option}`;
	}

	async function handleActiveOptionChange() {
		if (!state.activeOption) return;

		scrollOptionIntoView({ option: state.activeOption });
	}

	async function handleRootFocusOut(event: FocusEvent) {
		await autocompleteHelpers.handleRootFocusOut({ state, rootEl, value, event, hooks });
	}

	async function handleOptionClick(input: { option: string }) {
		await autocompleteHelpers.handleOptionClick({
			state,
			option: input.option,
			value,
			hooks
		});
	}

	async function handleButtonClick() {
		await autocompleteHelpers.handleButtonClick({
			state,
			hooks
		});
	}

	async function handleBackgroundPointerUp(event: MouseEvent) {
		await autocompleteHelpers.handleBackgroundPointerUp({ state, event, rootEl, hooks });
	}

	async function handleComboboxClick() {
		await autocompleteHelpers.handleComboboxClick({
			state,
			hooks
		});
	}

	async function handleComboboxKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;

		if (target.tagName !== 'INPUT') {
			return;
		}

		await autocompleteHelpers.handleComboboxKeyDown({
			state,
			event,
			hooks,
			value
		});
	}

	async function handleComboboxInput(e: Event) {
		dispatch('input', {
			value
		});

		const event = e as InputEvent;
		const target = event.target as HTMLInputElement;

		canCommitValue = true;
		value = target.value;

		await autocompleteHelpers.handleComboboxInput({
			state,
			event,
			hooks
		});
	}

	async function handleChange(event: Event) {
		await autocompleteHelpers.handleComboboxChange({
			event
		});
	}
</script>

<svelte:window on:pointerup={handleBackgroundPointerUp} />

<div
	bind:this={rootEl}
	class="Autocomplete Autocomplete__listbox-anchor"
	on:focusout={handleRootFocusOut}
>
	<label class="Autocomplete__input-container">
		<span>{label}</span>

		<div {id} class="Autocomplete__input-group">
			<input
				bind:this={comboboxEl}
				id={inputId}
				class="Autocomplete__input"
				{value}
				type="text"
				{disabled}
				{readonly}
				role="combobox"
				aria-expanded={a11yAttributes.combobox['aria-expanded']}
				aria-autocomplete={autocomplete}
				aria-controls="Autocomplete__listbox"
				aria-activedescendant={a11yAttributes.combobox['aria-activedescendant']}
				on:input={handleComboboxInput}
				on:keydown={handleComboboxKeyDown}
				on:click={handleComboboxClick}
				on:change={handleChange}
			/>

			<button
				class="Autocomplete__button"
				type="button"
				tabindex="-1"
				aria-label={label}
				aria-expanded={a11yAttributes.button['aria-expanded']}
				aria-controls={listboxId}
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

	<div
		bind:this={listboxEl}
		id={listboxId}
		class="Autocomplete__listbox"
		class:Autocomplete__listbox--open={state.isListboxOpen}
		role="listbox"
		aria-label={label}
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
					class:Autocomplete__option--selected={value === suggestion}
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
	</div>
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

	.Autocomplete__listbox:focus-within {
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
