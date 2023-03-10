<script lang="ts">
	import * as autocompleteHelpers from '$lib/lib/combobox/list-autocomplete.js';
	import * as api from './suggestions.js';
	import { onMount } from 'svelte';
	import './ListAutocomplete.css';

	export let autocomplete: 'list' | 'both' | 'none';
	export let state = autocompleteHelpers.setState({
		autocomplete,
		hasHover: false,
		isListboxOpen: false,
		elementWithFocus: null,
		activeOption: null
	});

	let root: HTMLElement;
	let combobox: HTMLInputElement;
	let listbox: HTMLDataListElement;

	let hooks = autocompleteHelpers.setHooks({
		updateState: async (input) => {
			state = { ...state, ...input.state };

			let shouldSelectActiveOption: boolean = false;

			if (Object.hasOwn(input.state, 'isListboxOpen')) {
				if (!state.isListboxOpen && input.reason === 'combobox keydown: Tab') {
					shouldSelectActiveOption = true;
				}
			}

			if (Object.hasOwn(input.state, 'elementWithFocus')) {
				if (state.elementWithFocus === 'listbox') {
					const match = findComboboxValueMatch();
					if (match) {
						state.activeOption = match;
					}
				}
			}

			if (Object.hasOwn(input.state, 'activeOption')) {
				await handleActiveOptionChange();
				if (input.reason.startsWith('combobox keydown: Arrow')) {
					shouldSelectActiveOption = true;
				}
			}

			if (shouldSelectActiveOption) {
				comboboxValue = state.activeOption ?? '';
			}

			return state;
		},
		getFirstOption: async () => {
			return getFirstOption();
		},
		getLastOption: async () => {
			return getLastOption();
		},
		getNextOption: async (input) => {
			return getNextOption(input.option);
		},
		getPreviousOption: async (input) => {
			return getPreviousOption(input.option);
		},
		findOptionToActivate: async (input) => {
			let optionToActivate: string | null = null;

			if (state.activeOption != null && suggestions.indexOf(state.activeOption) >= 0) {
				optionToActivate = state.activeOption;
			} else {
				optionToActivate = suggestions.at(0)!;
			}

			if (
				optionToActivate != null &&
				optionToActivate?.toLocaleLowerCase().startsWith(input.filter.toLowerCase())
			) {
				return optionToActivate;
			}

			return null;
		},
		setSelectedOption: async (input) => {
			comboboxValue = input.option ?? '';
			return state;
		},
		focusCombobox: async () => {
			combobox.focus();
		},
		clearCombobox: async () => {
			comboboxValue = '';
			fetchSuggestions({ filter: comboboxValue });
			return state;
		},
		showInlineSuggestion: async () => {
			if (state.activeOption) {
				combobox.value = comboboxValue = state.activeOption;
				setComboboxSelectionRange({
					start: filter.length,
					end: state.activeOption.length
				});
			}

			return state;
		},
		checkIfListboxCanOpen: async (input) => {
			if (input.reason === 'combobox click' || input.reason === 'button click') {
				const match = findComboboxValueMatch();
				if (match) {
					return false;
				}
			}

			if (!isFetchDone) {
				fetchSuggestions({ filter: comboboxValue });
				return true;
			} else {
				return cachedSuggestions?.filter !== filter || !!suggestions.length;
			}
		}
	});

	let behavior = autocompleteHelpers.getBehavior({
		state
	});

	let comboboxValue: string = '';
	let filter: string = comboboxValue;

	$: activeOptionId = state.activeOption ? getOptionId(state.activeOption) : null;
	$: a11yAttributes = autocompleteHelpers.getA11yAttributes({ state, activeOptionId });

	let observer: CheckIfInViewObserver;

	onMount(() => {
		observer = createIntersectionObserver();
	});

	function createIntersectionObserver() {
		const map = new Map<Element, (isIntersecting: boolean) => void>();

		const instance = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (map.has(entry.target)) {
						const callback = map.get(entry.target)!;

						callback(entry.isIntersecting);

						map.delete(entry.target);
					}

					instance.unobserve(entry.target);
				});
			},
			{
				root: listbox,
				threshold: 1
			}
		);

		return {
			instance,
			checkElementIsInView: async (target: Element) => {
				return new Promise<boolean>((resolve) => {
					map.set(target, resolve);
					instance.observe(target);
				});
			}
		};
	}

	let errorMessage: string | null = null;
	let loading: boolean = false;
	let suggestions: string[] = [];
	let cachedSuggestions:
		| {
				filter: string;
				results: string[];
		  }
		| undefined = undefined;
	let isFetchDone: boolean = false;
	let lastRequestToken: any | undefined = undefined;
	async function fetchSuggestions(input: { filter: string }) {
		const token = {};

		try {
			isFetchDone = true;
			errorMessage = null;

			if (cachedSuggestions?.filter === input.filter) {
				return cachedSuggestions.results;
			}

			let request: string = behavior.canFilterOptionsInListbox ? '' : input.filter;
			loading = true;

			lastRequestToken = token;
			const response = await api.fetchSuggestions(request);

			if (lastRequestToken !== token) {
				return;
			}

			if (response.status === 404) {
				throw new Error('No results found');
			}

			suggestions = await response.json();
		} catch (e) {
			const error = e as Error;
			errorMessage = error.message;
		} finally {
			if (lastRequestToken !== token) {
				return;
			}

			loading = false;
			lastRequestToken = undefined;
		}
	}

	function findComboboxValueMatch() {
		return suggestions.find((option) => option === comboboxValue);
	}

	async function setComboboxSelectionRange(input: { start: number; end: number }) {
		combobox.setSelectionRange(input.start, input.end);
	}

	async function scrollOptionIntoView(input: { option: string }) {
		const optionEl = listbox.querySelector(`[value="${input.option}"]`);

		if (!optionEl) {
			return;
		}

		const isOptionInView = await observer.checkElementIsInView(optionEl);
		if (!isOptionInView) {
			optionEl.scrollIntoView({
				block: 'nearest'
			});
		}
	}

	async function getFirstOption() {
		return suggestions.at(0) ?? null;
	}

	async function getLastOption() {
		return suggestions.at(suggestions.length - 1) ?? null;
	}

	async function getNextOption(option: string | null) {
		if (!option) return await getFirstOption();

		if (option === (await getLastOption())) {
			return await getFirstOption();
		}

		const index = suggestions.indexOf(option);
		return suggestions.at(index + 1) ?? null;
	}

	async function getPreviousOption(option: string | null) {
		if (!option) return await getLastOption();

		if (option === (await getFirstOption())) {
			return await getLastOption();
		}

		const index = suggestions.indexOf(option);
		return suggestions.at(index - 1) ?? null;
	}

	function getOptionId(option: string) {
		return `cb1-option-${option}`;
	}

	async function handleActiveOptionChange() {
		if (!state.activeOption) return;

		scrollOptionIntoView({ option: state.activeOption });
	}

	async function handleRootFocusOut(event: FocusEvent) {
		await autocompleteHelpers.handleRootFocusOut({ state, root, event, callbacks: hooks });
	}

	async function handleRootPointerOut() {
		await autocompleteHelpers.handleRootPointerOut({ state, callbacks: hooks });
	}

	async function handleRootPointerOver() {
		await autocompleteHelpers.handleRootPointerOver({ state, callbacks: hooks });
	}

	async function handleOptionClick(input: { option: string }) {
		await autocompleteHelpers.handleOptionClick({
			...input,
			state,
			callbacks: hooks
		});
	}

	async function handleButtonClick() {
		await autocompleteHelpers.handleButtonClick({
			state,
			callbacks: hooks
		});
	}

	async function handleBackgroundPointerUp() {
		await autocompleteHelpers.handleBackgroundPointerUp({ state, root, callbacks: hooks });
	}

	async function handleComboboxBlur() {
		await autocompleteHelpers.handleComboboxBlur({ state, callbacks: hooks });
	}

	async function handleComboboxClick() {
		await autocompleteHelpers.handleComboboxClick({
			state,
			callbacks: hooks
		});
	}

	async function handleComboboxFocus() {
		await autocompleteHelpers.handleComboboxFocus({
			state,
			callbacks: hooks
		});
	}

	async function handleComboboxKeyDown(event: KeyboardEvent) {
		await autocompleteHelpers.handleComboboxKeyDown({
			event,
			state,
			callbacks: hooks
		});
	}

	async function handleComboboxInput(e: Event) {
		const event = e as InputEvent;
		const target = event.target as HTMLInputElement;

		comboboxValue = target.value;
		fetchSuggestions({ filter: comboboxValue }).then((e) => console.warn(e));

		await autocompleteHelpers.handleComboboxInput({
			state,
			event,
			comboboxValue,
			callbacks: hooks
		});
	}

	interface CheckIfInViewObserver {
		instance: IntersectionObserver;
		checkElementIsInView: (target: Element) => Promise<boolean>;
	}
</script>

<svelte:window on:pointerup={handleBackgroundPointerUp} />

<div>
	{comboboxValue}
	{suggestions.length}
	{!!errorMessage}
	{loading}
	<label for="cb1-input">State</label>
	<div
		bind:this={root}
		class="combobox combobox-list"
		on:focusout={handleRootFocusOut}
		on:pointerout={handleRootPointerOut}
		on:pointerover={handleRootPointerOver}
	>
		<div class="group" class:focus={state.elementWithFocus === 'combobox'}>
			<input
				bind:this={combobox}
				id="cb1-input"
				class="cb_edit"
				value={comboboxValue}
				type="text"
				role="combobox"
				aria-expanded={a11yAttributes.combobox['aria-expanded']}
				aria-autocomplete={autocomplete}
				aria-controls="cb1-listbox"
				aria-activedescendant={a11yAttributes.combobox['aria-activedescendant']}
				on:input={handleComboboxInput}
				on:keydown={handleComboboxKeyDown}
				on:click={handleComboboxClick}
				on:focus={handleComboboxFocus}
				on:blur={handleComboboxBlur}
			/>
			<button
				id="cb1-button"
				tabindex="-1"
				aria-label="States"
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
		<datalist
			bind:this={listbox}
			id="cb1-listbox"
			class:focus={state.elementWithFocus === 'listbox'}
			style:display={state.isListboxOpen ? 'block' : 'none'}
			aria-label="States"
		>
			{#if errorMessage}
				<option disabled>{errorMessage}</option>
			{:else if loading}
				<option disabled>Loading...</option>
			{:else if suggestions.length}
				{#each suggestions as suggestion}
					<option
						id={getOptionId(suggestion)}
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
</div>
