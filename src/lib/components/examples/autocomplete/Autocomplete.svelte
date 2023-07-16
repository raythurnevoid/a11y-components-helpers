<script lang="ts" context="module">
	let count: number = 0;

	type OptionsAreReady = boolean;
	type ActiveOption = string | null | undefined;

	export { default as AutocompleteOption } from './AutocompleteOption.svelte';

	export interface AutocompleteContext {
		value$: Readable<string>;
		activeOption$: Readable<ActiveOption>;
		handleOptionClick: (optionEl: HTMLLIElement) => void;
	}
</script>

<script lang="ts">
	import { createEventDispatcher, tick, setContext } from 'svelte';
	import { writable, readonly as readonlyStore, type Readable, type Writable } from 'svelte/store';
	import { scrollIntoView } from '$lib/scroll-into-view.js';

	export let id: string = `Autocomplete-${count++}`;

	export let value: string = '';
	export let autocomplete: 'list' | 'both' | 'inline' | 'none' = 'both';
	export let label: string = '';
	export let disabled: boolean = false;
	export let readonly: boolean = false;

	export let computeOptions: (
		filter: string | undefined
	) => Promise<OptionsAreReady> | OptionsAreReady = () => true;

	const dispatch = createEventDispatcher<{
		'before-open': void;
		change: { value: string };
		input: { value: string };
	}>();

	let el: HTMLElement;
	let comboboxEl: HTMLInputElement;
	let listboxEl: HTMLElement;
	let listboxId = `${id}__listbox`;
	let inputId = `${id}__input`;

	let isListboxOpen: boolean = false;

	let value$ = writable<string>(value);
	$: $value$ = value;
	let oldValue = value;
	let canCommitValue: boolean = false;

	let activeOption$: Writable<ActiveOption> = writable(undefined);

	let options: string[] = [];
	let optionToElMap = new Map<string, HTMLLIElement>();

	$: canShowInlineSuggestions = autocomplete === 'inline' || autocomplete === 'both';

	setContext<AutocompleteContext>('select', {
		value$: readonlyStore(value$),
		activeOption$: readonlyStore(activeOption$),
		handleOptionClick
	});

	async function scrollOptionIntoView(input: { option: string }) {
		const optionEl = optionToElMap.get(input.option)!;
		await scrollIntoView(listboxEl, optionEl);
	}

	function getNextOptionToActivate(
		option: ActiveOption,
		direction: 'next' | 'prev' | 'first' | 'last'
	) {
		if (!options?.length) return null;

		if (!option || direction === 'first' || direction === 'last') {
			if (direction === 'next' || direction === 'first') {
				return options.at(0) ?? null;
			} else {
				return options.at(options.length - 1) ?? null;
			}
		}

		const activeOptionIndex = options.indexOf(option);
		const optionToActivateIndex =
			direction === 'next' ? activeOptionIndex + 1 : activeOptionIndex - 1;
		const optionToActivate = options.at(optionToActivateIndex) ?? options.at(0)!;

		return optionToActivate;
	}

	function setValue(newValue: string) {
		canCommitValue = true;
		comboboxEl.value = value = newValue;
		comboboxEl.setSelectionRange(value.length, value.length);
	}

	function commitValue() {
		if (!canCommitValue) return;

		let shouldDispatchChange = oldValue !== value;

		if (shouldDispatchChange) {
			oldValue = value;
			dispatch('change', { value });
			canCommitValue = false;
		}
	}

	async function tryToOpen(options?: { scrollActiveOptionIntoView: boolean }): Promise<boolean> {
		if (isListboxOpen) return true;
		else if (readonly || disabled) return false;

		if (
			!dispatch('before-open', undefined, {
				cancelable: true
			})
		) {
			return false;
		}

		isListboxOpen = autocomplete !== 'inline' ? true : false;
		return await callComputeOptionsFn(options);
	}

	function close() {
		$activeOption$ = null;
		isListboxOpen = false;
	}

	async function callComputeOptionsFn(options?: {
		scrollActiveOptionIntoView?: boolean;
	}): Promise<boolean> {
		const result = await computeOptions(value);
		if (!result) {
			return false;
		}

		await tick();

		handleDomChanges(options);

		return true;
	}

	function setActiveOption(newActiveOption: string | null, options?: { scrollIntoView?: boolean }) {
		if ($activeOption$ === newActiveOption) return;
		$activeOption$ = newActiveOption;
		handleActiveOptionChange($activeOption$, options);
	}

	function handleDomChanges(thisOptions?: { scrollActiveOptionIntoView?: boolean }) {
		let optionToActivate: string | null = null;

		optionToElMap.clear();
		options = Array.from(
			listboxEl.querySelectorAll('li[role="option"][id][data-value]:not(aria-disabled)')
		).map((el) => {
			const optionValue = el.getAttribute('data-value')!;
			optionToElMap.set(optionValue, el as HTMLLIElement);

			if (
				!optionToActivate &&
				value &&
				optionValue.toLocaleLowerCase().startsWith(value.toLocaleLowerCase())
			) {
				optionToActivate = optionValue;
			}

			return optionValue;
		});
		optionToElMap = optionToElMap;

		setActiveOption(optionToActivate, {
			scrollIntoView: thisOptions?.scrollActiveOptionIntoView
		});
	}

	function handleActiveOptionChange(
		activeOption: ActiveOption,
		options?: { scrollIntoView?: boolean }
	) {
		if (!activeOption) return;
		if (options?.scrollIntoView) scrollOptionIntoView({ option: activeOption });
	}

	function handleBlur(event: FocusEvent) {
		if (!isListboxOpen || !document.hasFocus() || el.contains(event.relatedTarget as HTMLElement)) {
			return;
		} else if (el.querySelector(':scope:hover, :hover')) {
			return comboboxEl.focus();
		}

		close();
		commitValue();
	}

	function handleOptionClick(optionEl: HTMLLIElement) {
		if (optionEl.getAttribute('aria-disabled') === 'true') return;

		setValue(optionEl.getAttribute('data-value')!);
		close();
		comboboxEl.focus();
		commitValue();
	}

	function handleButtonClick() {
		comboboxEl.focus();
		handleComboboxClick();
	}

	function handleComboboxClick() {
		tryToOpen({
			scrollActiveOptionIntoView: true
		});
	}

	async function handleComboboxKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;

		if (target !== comboboxEl || event.ctrlKey || (event.shiftKey && event.key !== 'Tab')) {
			return;
		}

		let isHandled = false;
		let shouldPreventDefault = false;
		switch (event.key) {
			case 'Enter':
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Escape':
				isHandled = shouldPreventDefault = true;
				break;
			case 'PageUp':
			case 'PageDown':
			case 'Home':
			case 'End':
				isHandled = shouldPreventDefault = isListboxOpen;
				break;
			case 'Tab':
				isHandled = true;
				break;
		}

		if (!isHandled) return;
		if (shouldPreventDefault) event.preventDefault();

		switch (event.key) {
			case 'Enter':
				if (isListboxOpen) {
					if ($activeOption$ != null) {
						setValue($activeOption$);
						close();
						commitValue();
					}
				} else {
					await tryToOpen({
						scrollActiveOptionIntoView: true
					});
				}
				break;
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Home':
			case 'End':
			case 'PageUp':
			case 'PageDown': {
				switch (event.key) {
					case 'ArrowDown':
					case 'ArrowUp':
						if (!tryToOpen()) {
							break;
						}

						if (event.altKey) {
							if (event.key === 'ArrowUp') close();
							break;
						}
					default:
						if (!isListboxOpen) break;
				}

				let optionToActivate: string | null | undefined = undefined;

				switch (event.key) {
					case 'ArrowDown':
						optionToActivate = getNextOptionToActivate($activeOption$, 'next');
						break;
					case 'ArrowUp':
						optionToActivate = getNextOptionToActivate($activeOption$, 'prev');
						break;
					case 'Home':
					case 'PageUp':
						optionToActivate = getNextOptionToActivate($activeOption$, 'first');
						break;
					case 'End':
					case 'PageDown':
						optionToActivate = getNextOptionToActivate($activeOption$, 'last');
						break;
				}

				if (optionToActivate !== undefined && $activeOption$ !== optionToActivate) {
					setActiveOption(optionToActivate, {
						scrollIntoView: true
					});

					if (canShowInlineSuggestions) {
						setValue($activeOption$ ?? '');
					}
				}

				break;
			}

			case 'Escape':
				if (isListboxOpen) {
					close();
				} else if (value) {
					setValue('');
					commitValue();
				}
				break;

			case 'Tab':
				if ($activeOption$ != null && value !== $activeOption$) {
					setValue($activeOption$);
					close();
					commitValue();
				}

				break;
		}
	}

	async function handleComboboxInput(e: Event) {
		const event = e as InputEvent;

		dispatch('input', {
			value
		});

		canCommitValue = true;
		value = comboboxEl.value;

		if (event.inputType.startsWith('insert') || event.inputType.startsWith('delete')) {
			event.preventDefault();
		} else {
			return;
		}

		if (isListboxOpen) {
			await callComputeOptionsFn({
				scrollActiveOptionIntoView: true
			});
		} else if (
			!(await tryToOpen({
				scrollActiveOptionIntoView: true
			}))
		) {
			return;
		}

		if (canShowInlineSuggestions && $activeOption$ && event.inputType.startsWith('insert')) {
			const selectionStart = value.length;
			comboboxEl.value = value = $activeOption$ ?? '';
			comboboxEl.setSelectionRange(selectionStart, value.length);
		}
	}

	function handleChange(event: Event) {
		event.stopPropagation();
		event.preventDefault();
	}
</script>

<div bind:this={el} {id} class="Autocomplete Autocomplete__listbox-anchor">
	<label class="Autocomplete__input-container">
		<span>{label}</span>

		<div class="Autocomplete__input-group">
			<input
				bind:this={comboboxEl}
				id={inputId}
				class="Autocomplete__input"
				{value}
				type="text"
				{disabled}
				{readonly}
				role="combobox"
				aria-autocomplete={autocomplete}
				aria-expanded={isListboxOpen}
				aria-controls="Autocomplete__listbox"
				aria-activedescendant={$activeOption$ ? optionToElMap.get($activeOption$)?.id ?? '' : ''}
				on:input={handleComboboxInput}
				on:keydown={handleComboboxKeyDown}
				on:click={handleButtonClick}
				on:change={handleChange}
				on:blur={handleBlur}
			/>

			<button
				class="Autocomplete__button"
				type="button"
				tabindex="-1"
				{disabled}
				aria-label={label}
				aria-expanded={isListboxOpen}
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

	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<menu
		bind:this={listboxEl}
		id={listboxId}
		class="Autocomplete__listbox"
		class:Autocomplete__listbox--open={isListboxOpen}
		role="listbox"
		aria-label={label}
	>
		<slot />
	</menu>
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

	.Autocomplete__listbox {
		display: none;
		position: absolute;
		width: 100%;
		border: black solid 1px;
		max-height: 200px;
		overflow-y: auto;
		overflow-x: hidden;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.Autocomplete__listbox:focus-within {
		border: blue solid 1px;
	}

	.Autocomplete__listbox--open {
		display: block;
	}
</style>
