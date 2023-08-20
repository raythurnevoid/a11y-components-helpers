<script lang="ts" context="module">
	let count: number = 0;

	type ActiveOption = HTMLElement | null | undefined;
	type OptionValue = string;

	export { default as SelectOption } from './SelectOption.svelte';

	export interface SelectContext {
		value$: Readable<string>;
		activeOption$: Readable<ActiveOption>;
		handleOptionClick: (optionEl: HTMLElement) => void;
	}
</script>

<script lang="ts">
	import { createEventDispatcher, tick, setContext } from 'svelte';
	import { InputBackgroundTimedFilter } from '$lib/input-background-timed-filter.js';
	import { writable, readonly as readonlyStore, type Readable, type Writable } from 'svelte/store';
	import { scrollIntoView } from '$lib/scroll-into-view.js';

	export let id: string = `Select--${count++}`;

	export let value: string = '';
	export let label: string = '';
	export let disabled: boolean = false;
	export let readonly: boolean = false;

	const dispatch = createEventDispatcher<{
		'before-open': void;
		change: { value: string };
		input: { value: string };
	}>();

	let el: HTMLElement;
	let buttonEl: HTMLButtonElement;
	let listboxEl: HTMLElement;
	let labelId = `${id}__label`;
	let listboxId = `${id}__listbox`;
	let inputId = `${id}__input`;

	let isListboxOpen: boolean = false;
	let userExplicitlyClosed: boolean = false;
	let userBlurredWithTab: boolean = false;

	let value$ = writable<string>(value);
	$: $value$ = value;
	let oldValue = value;
	let canCommitValue = false;

	let activeOption$: Writable<ActiveOption> = writable(undefined);

	let options: HTMLElement[] = [];
	let optionValueToElMap = new Map<string, HTMLElement>();
	let optionsValues: OptionValue[] = [];

	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const timedFilter = new InputBackgroundTimedFilter();

	setContext<SelectContext>('select', {
		value$: readonlyStore(value$),
		activeOption$: readonlyStore(activeOption$),
		handleOptionClick
	});

	async function scrollOptionIntoView(optionEl: HTMLElement) {
		await scrollIntoView(listboxEl, optionEl);
	}

	function getNextOptionToActivate(
		option: ActiveOption,
		direction: 'next' | 'prev' | 'first' | 'last'
	) {
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
		if (value !== newValue) {
			canCommitValue = true;
			value = newValue;
		}

		setActiveOption(optionValueToElMap.get(value) ?? null);
	}

	function setValueFromOptionEl(optionEl: HTMLElement) {
		setValue(getValueFromOption(optionEl));
	}

	function getValueFromOption(optionEl: HTMLElement) {
		return optionEl.getAttribute('data-value')!;
	}

	function tryToCommitValue() {
		if (!canCommitValue) return;

		let mustDispatchChange = oldValue !== value;

		if (mustDispatchChange) {
			oldValue = value;
			dispatch('change', { value });
			canCommitValue = false;
		}
	}

	async function tryToOpen() {
		if (isListboxOpen || disabled) return;

		dispatch('before-open');

		userExplicitlyClosed = false;

		isListboxOpen = true;
		await tick();
	}

	function close() {
		isListboxOpen = false;
	}

	function setActiveOption(
		newActiveOption: HTMLElement | null,
		options?: { scrollIntoView?: boolean }
	) {
		if ($activeOption$ === newActiveOption) return;

		$activeOption$ = newActiveOption;
		handleActiveOptionChange($activeOption$, options);
	}

	export function handleOptionsChange(thisOptions?: { scrollActiveOptionIntoView?: boolean }) {
		optionValueToElMap.clear();
		options = [];
		optionsValues = [];

		let optionToActivate: HTMLElement | null = null;

		const optionsEl = listboxEl.querySelectorAll<HTMLElement>(
			'li[role="option"][id][data-value]:not([aria-disabled])'
		);
		for (const optionEl of optionsEl) {
			const optionValue = optionEl.getAttribute('data-value')!;
			if (!optionValueToElMap.has(optionValue)) {
				optionValueToElMap.set(optionValue, optionEl);
				optionsValues.push(optionValue);
			}

			if (value === optionValue) optionToActivate = optionEl;
			options.push(optionEl);
		}

		optionValueToElMap = optionValueToElMap;

		setActiveOption(optionToActivate, {
			scrollIntoView: thisOptions?.scrollActiveOptionIntoView
		});
	}

	function handleActiveOptionChange(
		activeOption: ActiveOption,
		options?: { scrollIntoView?: boolean }
	) {
		if (!activeOption) return;
		if (options?.scrollIntoView) scrollOptionIntoView(activeOption);
	}

	function handleBlur(event: FocusEvent) {
		if (!isListboxOpen || !document.hasFocus() || el.contains(event.relatedTarget as HTMLElement)) {
			return;
		} else if (!userBlurredWithTab && el.querySelector(':scope:hover, :hover')) {
			return buttonEl.focus();
		}

		userExplicitlyClosed = userBlurredWithTab = false;
		close();
		tryToCommitValue();
	}

	function handleOptionClick(optionEl: HTMLElement) {
		if (optionEl.getAttribute('aria-disabled') === 'true') return;

		setValueFromOptionEl(optionEl);
		userExplicitlyClosed = false;
		close();
		buttonEl.focus();
		tryToCommitValue();
	}

	async function handleComboboxClick() {
		if (!isListboxOpen) {
			tryToOpen();
		} else {
			userExplicitlyClosed = true;
			close();
		}
	}

	async function handleButtonKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;

		if (target !== buttonEl || event.ctrlKey || (event.shiftKey && event.key !== 'Tab')) {
			return;
		}

		let isHandled = false;
		let mustPreventDefault = false;
		let mustTryToOpen = false;

		switch (event.key) {
			case 'Enter':
			case ' ':
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Home':
			case 'End':
			case 'Escape':
				isHandled = mustPreventDefault = true;
				break;
			case 'PageUp':
			case 'PageDown':
				isHandled = mustPreventDefault = isListboxOpen;
				break;
			case 'Tab':
				isHandled = true;
				break;
			default:
				isHandled = !!event.key.match(printableCharRegex);
				break;
		}

		if (!isListboxOpen) {
			switch (event.key) {
				case 'Enter':
				case 'ArrowDown':
				case 'ArrowUp':
				case 'PageUp':
				case 'PageDown':
				case 'Home':
				case 'End':
					if (
						(!userExplicitlyClosed && event.key !== 'Enter') ||
						(event.key === 'ArrowUp' && event.altKey)
					) {
						break;
					} else mustTryToOpen = true;
					break;
				default:
					if (isHandled) mustTryToOpen = !userExplicitlyClosed;
			}
		}

		if (!isHandled) return;
		if (mustPreventDefault) event.preventDefault();

		switch (event.key) {
			case 'Enter':
			case ' ':
				if (isListboxOpen) {
					if ($activeOption$ != null) {
						setValueFromOptionEl($activeOption$);
						userExplicitlyClosed = false;
						close();
						tryToCommitValue();
					}
				}
				break;

			case 'ArrowDown':
			case 'ArrowUp':
			case 'Home':
			case 'End':
			case 'PageUp':
			case 'PageDown': {
				if (event.altKey) {
					if (isListboxOpen && event.key === 'ArrowUp') {
						userExplicitlyClosed = true;
						close();
					}
					break;
				}

				let optionToActivate: HTMLElement | null | undefined = undefined;

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
				}

				break;
			}

			case 'Escape':
				if (isListboxOpen) {
					userExplicitlyClosed = true;
					close();
				} else if (value) {
					setValue('');
					tryToCommitValue();
				}
				break;

			case 'Tab':
				userBlurredWithTab = true;
				if ($activeOption$ != null) setValueFromOptionEl($activeOption$);
				userExplicitlyClosed = false;
				close();
				tryToCommitValue();

				break;

			default: {
				timedFilter.addChar(event.key);
				const activeOptionValue = $activeOption$
					? getValueFromOption($activeOption$)
					: $activeOption$;
				const optionValueOfOptionToActivate = timedFilter.find(
					optionsValues,
					activeOptionValue,
					(option: string) => option.toLowerCase().startsWith(timedFilter.filter.toLowerCase())
				);
				const optionToActivate = optionValueOfOptionToActivate
					? optionValueToElMap.get(optionValueOfOptionToActivate)!
					: $activeOption$;

				if (optionToActivate !== undefined) {
					setActiveOption(optionToActivate, {
						scrollIntoView: true
					});
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

<div bind:this={el} {id} class="Select">
	<div class="Select__button-container">
		<span id={labelId} class="Select__label">{label}</span>

		<button
			bind:this={buttonEl}
			class="Select__button"
			id={inputId}
			{value}
			{disabled}
			role="combobox"
			aria-labelledby={labelId}
			aria-readonly={readonly}
			aria-expanded={isListboxOpen}
			aria-controls={listboxId}
			aria-activedescendant={isListboxOpen && $activeOption$ ? $activeOption$?.id ?? '' : ''}
			on:keydown={handleButtonKeyDown}
			on:click={handleComboboxClick}
			on:change={handleChange}
			on:blur={handleBlur}
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
	</div>

	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<menu
		bind:this={listboxEl}
		id={listboxId}
		class="Select__listbox"
		class:Select__listbox--open={isListboxOpen}
		role="listbox"
		aria-label={label}
	>
		<slot />
	</menu>
</div>

<style>
	.Select {
		user-select: none;
		position: relative;
		z-index: 1;
	}

	.Select__button-container {
		display: block;
	}

	.Select__button {
		outline: blue solid 1px;
	}

	.Select__button {
		display: flex;
		border: gray solid 1px;
		justify-content: space-between;
		background-color: transparent;
	}

	.Select__button:focus {
		outline: black solid 2px;
	}

	.Select__value {
		width: 10ch;
		white-space: nowrap;
		contain: content;
		text-align: start;
	}

	.Select__listbox {
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

	.Select__listbox:focus-within {
		border: blue solid 1px;
	}

	.Select__listbox--open {
		display: block;
	}
</style>
