<script lang="ts" context="module">
	let count: number = 0;

	type ActiveOption = string | null | undefined;

	export { default as SelectOption } from './SelectOption.svelte';

	export interface SelectContext {
		value$: Readable<string>;
		activeOption$: Readable<ActiveOption>;
		handleOptionClick: (optionEl: HTMLLIElement) => void;
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

	let value$ = writable<string>(value);
	$: $value$ = value;
	let oldValue = value;
	let canCommitValue = false;

	let activeOption$: Writable<ActiveOption> = writable(undefined);

	let options: string[] = [];
	let optionToElMap = new Map<string, HTMLLIElement>();

	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const timedFilter = new InputBackgroundTimedFilter();

	setContext<SelectContext>('select', {
		value$: readonlyStore(value$),
		activeOption$: readonlyStore(activeOption$),
		handleOptionClick
	});

	async function scrollOptionIntoView(option: string) {
		const optionEl = optionToElMap.get(option)!;
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
		canCommitValue = true;
		value = newValue;
		setActiveOption(value || null);
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

	async function tryToOpen() {
		if (isListboxOpen || disabled) return;

		const canContinue = dispatch('before-open', undefined, { cancelable: true });
		if (!canContinue) return;

		isListboxOpen = true;
		await tick();
	}

	function close() {
		isListboxOpen = false;
	}

	function setActiveOption(newActiveOption: string | null, options?: { scrollIntoView?: boolean }) {
		if ($activeOption$ === newActiveOption) return;
		$activeOption$ = newActiveOption;
		handleActiveOptionChange($activeOption$, options);
	}

	export function handleDomChanges(thisOptions?: { scrollActiveOptionIntoView?: boolean }) {
		optionToElMap.clear();
		let optionToActivate: string | null = null;

		options = Array.from(
			listboxEl.querySelectorAll('li[role="option"][id][data-value]:not([aria-disabled])')
		).map((el) => {
			const optionValue = el.getAttribute('data-value')!;
			optionToElMap.set(optionValue, el as HTMLLIElement);

			if (value === optionValue) optionToActivate = optionValue;
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
		if (options?.scrollIntoView) scrollOptionIntoView(activeOption);
	}

	function handleBlur(event: FocusEvent) {
		if (!isListboxOpen || !document.hasFocus() || el.contains(event.relatedTarget as HTMLElement)) {
			return;
		} else if (el.querySelector(':scope:hover, :hover')) {
			return buttonEl.focus();
		}

		close();
		commitValue();
	}

	function handleOptionClick(optionEl: HTMLLIElement) {
		if (optionEl.getAttribute('aria-disabled') === 'true') return;

		setValue(optionEl.getAttribute('data-value')!);
		close();
		buttonEl.focus();
		commitValue();
	}

	async function handleComboboxClick() {
		if (!isListboxOpen) {
			tryToOpen();
		} else {
			close();
		}
	}

	async function handleButtonKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;

		if (target !== buttonEl || event.ctrlKey || (event.shiftKey && event.key !== 'Tab')) {
			return;
		}

		let isHandled = false;
		let shouldPreventDefault = false;
		switch (event.key) {
			case 'Enter':
			case ' ':
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Home':
			case 'End':
			case 'Escape':
				isHandled = shouldPreventDefault = true;
				break;
			case 'PageUp':
			case 'PageDown':
				isHandled = shouldPreventDefault = isListboxOpen;
				break;
			case 'Tab':
				isHandled = true;
				break;
			default:
				isHandled = !!event.key.match(printableCharRegex);
				break;
		}

		if (!isHandled) return;
		if (shouldPreventDefault) event.preventDefault();

		switch (event.key) {
			case 'Enter':
			case ' ':
				if (isListboxOpen) {
					if ($activeOption$ != null) {
						setValue($activeOption$);
						close();
						commitValue();
					}
				} else {
					tryToOpen();
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
						await tryToOpen();

						if (event.altKey) {
							if (event.key === 'ArrowUp') close();
							break;
						}
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

			default: {
				await tryToOpen();

				timedFilter.addChar(event.key);
				const optionToActivate =
					timedFilter.find(options, $activeOption$, (option: string) =>
						option.toLowerCase().startsWith(timedFilter.filter.toLowerCase())
					) ?? $activeOption$;

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
			aria-activedescendant={isListboxOpen && $activeOption$
				? optionToElMap.get($activeOption$)?.id ?? ''
				: ''}
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
