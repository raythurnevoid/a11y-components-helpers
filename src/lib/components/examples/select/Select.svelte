<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import * as api from './suggestions.js';
	import { onMount, createEventDispatcher } from 'svelte';
	import ElementInViewChecker from '$lib/ElementInViewChecker.js';
	import { TemporaryOnKeyDownFilterStore } from '../../../lib/menu/menu.js';

	export let id: string = `Select-${index++}`;

	export let value: string = '';
	export let label: string = '';
	export let disabled: boolean = false;
	export let readonly: boolean = false;

	const dispatch = createEventDispatcher<{
		change: { value: string };
		input: { value: string };
	}>();

	let rootEl: HTMLElement;
	let comboboxEl: HTMLButtonElement;
	let listboxEl: HTMLElement;
	let listboxId: string = `${id}__listbox`;
	let inputId: string = `${id}__input`;

	let isListboxOpen: boolean = false;

	let filter: string = value;
	let valueOnLastChange: string | null = value;
	let canCommitValue: boolean = false;
	let activeOption: string | null | undefined = undefined;

	let errorMessage: string | null = null;
	let loading: boolean = false;
	let options: string[] = [];
	let cachedFilter: string | null | undefined = undefined;

	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new TemporaryOnKeyDownFilterStore();

	let elementInViewChecker: ElementInViewChecker;

	onMount(() => {
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

			options = responseBody;
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
		return options?.find((option) => option === value);
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

	function getNextOptionToActivate(option: string | null | undefined, direction: 'next' | 'prev') {
		if (!options?.length) return null;

		if (!option) {
			return direction === 'next' ? options.at(0) : options.at(-1);
		}

		const activeOptionIndex = options.indexOf(option);
		const optionToActivateIndex =
			direction === 'next' ? activeOptionIndex + 1 : activeOptionIndex - 1;
		const optionToActivate = options.at(optionToActivateIndex) ?? options.at(0)!;

		return optionToActivate;
	}

	function getPreviousOption(option: string | null) {
		if (!options?.length) return null;

		let index: number = 0;

		if (!option) {
			const match = findComboboxValueMatch();
			if (match) {
				index = options.indexOf(match) - 1;
			}
		} else {
			index = options.indexOf(option) - 1;
		}

		if (index < 0) {
			index = options.length - 1;
		}

		return options.at(index) ?? null;
	}

	async function prepareOptions() {
		const areOptionsReady = await fetchSuggestions({ filter: '' });
		return areOptionsReady;
	}

	function findOptionToActivate(reason: 'input delete' | 'combobox click' | 'other') {
		if (reason === 'input delete') {
			return null;
		}

		if (!options || !filter) null;

		let optionToActivate: string | null = null;

		if (activeOption != null && options.indexOf(activeOption) >= 0) {
			optionToActivate = activeOption;
		} else if (reason !== 'combobox click') {
			optionToActivate =
				options?.find((option) => option.toLowerCase().startsWith(filter.toLowerCase())) ?? null;
		}

		return optionToActivate;
	}

	function checkIfListboxCanOpen() {
		return !disabled && !readonly;
	}

	function setComboboxValue(newValue: string) {
		canCommitValue = true;
		comboboxEl.value = value = newValue ?? '';
	}

	function commitValue() {
		if (!canCommitValue) return;

		let shouldDispatchChange = valueOnLastChange !== value;

		if (shouldDispatchChange) {
			valueOnLastChange = value;
			dispatch('change', { value });
			canCommitValue = false;
		}
	}

	function getOptionId(option: string) {
		return `${id}__option:${option}`;
	}

	function open() {
		isListboxOpen = true;
	}

	function close() {
		activeOption = null;
		isListboxOpen = false;
	}

	function handleActiveOptionChange() {
		if (!activeOption) return;

		scrollOptionIntoView({ option: activeOption });
	}

	function handleRootFocusOut(event: FocusEvent) {
		if (!document.hasFocus() || !rootEl.contains(event.relatedTarget as HTMLElement)) return;
		close();
		commitValue();
	}

	function handleOptionClick(option: string) {
		setComboboxValue(option);
		close();
		comboboxEl.focus();
		commitValue();
	}

	function handleBackgroundPointerUp(event: MouseEvent) {
		if (rootEl.contains(event.target as HTMLElement)) return;
		close();
	}

	async function handleComboboxClick() {
		if (!checkIfListboxCanOpen()) return;
		open();
		const areOptionReady = await prepareOptions();
		if (areOptionReady) {
			activeOption = findOptionToActivate('combobox click');
		}
	}

	async function handleComboboxKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;

		if (target !== comboboxEl) {
			return;
		}

		if (event.ctrlKey) {
			return;
		}

		if (event.shiftKey && event.key !== 'Tab') {
			return;
		}

		let isHandled = false;
		switch (event.key) {
			case 'Enter':
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Escape':
			case 'Tab':
				isHandled = true;
				break;
			default:
				isHandled = !!event.key.match(printableCharRegex);
				break;
		}

		if (isHandled) {
			event.preventDefault();
		} else {
			return;
		}

		switch (event.key) {
			case 'Enter':
				if (isListboxOpen) {
					if (activeOption != null) {
						setComboboxValue(activeOption);
						close();
						commitValue();
					}
				}
				break;
			case 'ArrowDown': {
				let isActiveOptionChanged: boolean = false;
				const canContinue = isListboxOpen || checkIfListboxCanOpen();
				if (!canContinue) break;

				if (!isListboxOpen) {
					open();
					const optionsAreReady = await prepareOptions();
					if (!optionsAreReady || event.altKey) break;

					const optionToActivate = findOptionToActivate('other');
					if (activeOption != optionToActivate) {
						isActiveOptionChanged = true;
						activeOption = optionToActivate;
					}
				}

				activeOption = getNextOptionToActivate(activeOption, 'next');
				isActiveOptionChanged = true;
				break;
			}

			case 'ArrowUp': {
				let isActiveOptionChanged: boolean = false;
				const canContinue = isListboxOpen || checkIfListboxCanOpen();
				if (!canContinue) break;

				if (!isListboxOpen) {
					open();
					const optionsAreReady = await prepareOptions();
					if (!optionsAreReady || event.altKey) break;

					const optionToActivate = findOptionToActivate('other');
					if (activeOption != optionToActivate) {
						isActiveOptionChanged = true;
						activeOption = optionToActivate;
					}
				}

				activeOption = getNextOptionToActivate(activeOption, 'prev');
				isActiveOptionChanged = true;
				break;
			}

			case 'Escape':
				if (isListboxOpen) {
					close();
				} else if (value) {
					setComboboxValue('');
					commitValue();
				}
				break;

			case 'Tab':
				if (activeOption != null && value !== activeOption) {
					setComboboxValue(activeOption);
					close();
					commitValue();
				}

				break;

			default: {
				let optionToActivate: string | undefined = undefined;

				if (!isListboxOpen && checkIfListboxCanOpen()) {
					open();
				}

				let areOptionReady = false;
				if (isListboxOpen) {
					areOptionReady = await prepareOptions();
				}

				if (!areOptionReady) break;

				temporaryFilter.addChar(event.key);
				activeOption =
					options.find((item) =>
						item.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase())
					) ?? activeOption;

				let itemsToSearchFirst = activeOption
					? options.slice(options.indexOf(activeOption) + 1)
					: null;
				let itemsToSearchAfter =
					itemsToSearchFirst && activeOption
						? options.slice(0, options.indexOf(activeOption) + 1)
						: options;
				const filterFn = (option: string) =>
					option.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase());

				if (itemsToSearchFirst) {
					optionToActivate = itemsToSearchFirst.find(filterFn);
				}

				if (!optionToActivate) {
					optionToActivate = itemsToSearchAfter.find(filterFn) ?? optionToActivate;
				}

				if (optionToActivate !== undefined) {
					activeOption = optionToActivate;
				}
				break;
			}
		}
	}

	function handleChange(event: Event) {
		event.stopPropagation();
		event.preventDefault();
	}
</script>

<svelte:window on:pointerup={handleBackgroundPointerUp} />

<div {id} bind:this={rootEl} class="Select Select__listbox-anchor" on:focusout={handleRootFocusOut}>
	<label class="Select__input-container">
		<span>{label}</span>

		<button
			bind:this={comboboxEl}
			class="Select__input"
			id={inputId}
			{value}
			{disabled}
			role="combobox"
			aria-readonly={readonly}
			aria-expanded={isListboxOpen}
			aria-controls="Select__listbox"
			aria-activedescendant={activeOption ? getOptionId(activeOption) : ''}
			on:keydown={handleComboboxKeyDown}
			on:click={handleComboboxClick}
			on:change={handleChange}
		>
			<span class="Select__value">{value}</span>

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
	</label>

	<div
		bind:this={listboxEl}
		id={listboxId}
		class="Select__listbox"
		class:Select__listbox--open={isListboxOpen}
		role="listbox"
		aria-label={label}
	>
		{#if errorMessage}
			<option disabled>{errorMessage}</option>
		{:else if loading}
			<option disabled>Loading...</option>
		{:else if options.length}
			{#each options as suggestion}
				<option
					id={getOptionId(suggestion)}
					class="Select__option"
					class:Select__option--active={activeOption === suggestion}
					class:Select__option--selected={value === suggestion}
					value={suggestion}
					aria-selected={activeOption === suggestion}
					on:click={() => handleOptionClick(suggestion)}
				>
					{suggestion}
				</option>
			{/each}
		{/if}
	</div>
</div>

<style>
	.Select {
		user-select: none;
	}

	.Select__listbox-anchor {
		position: relative;
		z-index: 1;
	}

	.Select__input-container {
		display: block;
	}

	.Select__listbox {
		display: none;
		position: absolute;
		width: 100%;
		border: black solid 1px;
		max-height: 200px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.Select__listbox:focus-within {
		border: blue solid 1px;
	}

	.Select:active .Select__input,
	.Select__input:focus-within {
		outline: blue solid 1px;
	}

	.Select__input {
		display: flex;
		border: gray solid 1px;
		justify-content: space-between;
		background-color: transparent;
	}

	.Select__input:focus-visible {
		outline: black solid 2px;
	}

	.Select__value {
		width: 10ch;
		white-space: nowrap;
		contain: content;
		text-align: start;
	}

	.Select__listbox--open {
		display: block;
	}

	.Select__option {
		cursor: pointer;
	}

	.Select__option:where(:hover) {
		background-color: whitesmoke;
	}

	.Select__option--selected {
		background-color: lightblue;
	}

	.Select__option--active {
		background-color: lightgray;
	}
</style>
