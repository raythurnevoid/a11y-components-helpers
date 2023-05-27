<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import ElementInViewChecker from '../../../ElementInViewChecker.js';

	let el: HTMLElement;
	let id: string = `Listbox--${index++}`;
	let labelId: string = `${id}__label`;

	let options: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
	let value: string[] = [];

	const dispatch = createEventDispatcher<{
		change: { value: string[] };
	}>();

	let activeOptions: string[] = [];
	$: lastActiveOption = activeOptions.at(-1) ?? null;
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new TemporaryOnKeyDownFilterStore();

	let elementInViewChecker: ElementInViewChecker;
	let rangeSelectionIndexStart: number | null = null;
	let rangeSelectionIndexEnd: number | null = null;
	let isCtrlPressed: boolean = false;
	let isShiftPressed: boolean = false;

	onMount(() => {
		elementInViewChecker = new ElementInViewChecker(el);

		() => {
			elementInViewChecker.destroy();
		};
	});

	function toggleOptions(optionsValues: string[]) {
		if (optionsValues.length === 0) {
			return;
		}

		if (optionsValues.every((v) => value.includes(v))) {
			value = value.filter((v) => !optionsValues.includes(v));
		} else {
			value = options.filter((o) => optionsValues.includes(o) || value.includes(o));
		}

		dispatch('change', { value });
	}

	function selectAll() {
		value = options.slice();
		dispatch('change', { value });
	}

	function getOptionId(option: string) {
		return `${id}__option--${option}`;
	}

	function getLastActiveOptionIndex() {
		return options.indexOf(activeOptions.at(-1)!);
	}

	function getFirstActiveOptionIndex() {
		return options.indexOf(activeOptions.at(0)!);
	}

	async function handleKeyDown(event: KeyboardEvent) {
		let isHandledHotkey = false;

		switch (event.key) {
			case 'Control':
				isCtrlPressed = true;
				break;
			case 'Shift':
				isShiftPressed = true;
				if (rangeSelectionIndexStart === null) {
					rangeSelectionIndexEnd = rangeSelectionIndexStart = getLastActiveOptionIndex();
				}
				break;
			case 'a':
			case 'A':
				if (event.ctrlKey || event.metaKey) {
					selectAll();
					break;
				}
		}

		if (!isHandledHotkey) {
			switch (event.key) {
				case 'ArrowDown':
				case 'ArrowUp':
				case 'Enter':
				case ' ':
				case 'Home':
				case 'End':
				case 'Control':
				case 'Shift':
					event.preventDefault();

					switch (event.key) {
						case 'ArrowDown':
						case 'ArrowUp':
						case 'Home':
						case 'End':
							const activeOptionIndex = getLastActiveOptionIndex();
							if (!event.shiftKey) {
								rangeSelectionIndexEnd = rangeSelectionIndexStart = null;
							}

							switch (event.key) {
								case 'ArrowDown': {
									let newActiveOptionIndex: number | null = activeOptionIndex + 1;
									if (newActiveOptionIndex >= options.length) {
										newActiveOptionIndex = event.shiftKey ? null : 0;
									}
									const newActiveOption =
										newActiveOptionIndex != null ? options.at(newActiveOptionIndex)! : null;

									if (event.shiftKey) {
										if (newActiveOption != null) {
											newActiveOptionIndex = newActiveOptionIndex!;
											if (activeOptions.includes(newActiveOption)) {
												if (event.ctrlKey) {
													activeOptions = activeOptions.sort((a, b) => {
														if (a === newActiveOption) {
															return 1;
														} else if (b === newActiveOption) {
															return -1;
														} else {
															return 0;
														}
													});
												} else {
													activeOptions = options
														.slice(rangeSelectionIndexEnd! + 1, rangeSelectionIndexStart! + 1)
														.reverse();
												}
											} else {
												activeOptions.push(newActiveOption);
											}
											rangeSelectionIndexEnd = newActiveOptionIndex;
											activeOptions = activeOptions;
										}
									} else {
										activeOptions = newActiveOption ? [newActiveOption] : [];
									}

									break;
								}
								case 'ArrowUp': {
									let newActiveOptionIndex: number | null = activeOptionIndex - 1;
									if (newActiveOptionIndex < 0) {
										newActiveOptionIndex = event.shiftKey ? null : options.length - 1;
									}
									const newActiveOption =
										newActiveOptionIndex != null ? options.at(newActiveOptionIndex)! : null;

									if (event.shiftKey) {
										if (newActiveOption != null) {
											newActiveOptionIndex = newActiveOptionIndex!;
											console.log(rangeSelectionIndexEnd, newActiveOptionIndex);
											if (activeOptions.includes(newActiveOption)) {
												if (event.ctrlKey) {
													activeOptions = activeOptions.sort((a, b) => {
														if (a === newActiveOption) {
															return 1;
														} else if (b === newActiveOption) {
															return -1;
														} else {
															return 0;
														}
													});
												} else {
													activeOptions = options.slice(
														rangeSelectionIndexStart!,
														rangeSelectionIndexEnd!
													);
												}
											} else {
												activeOptions.push(newActiveOption);
											}
											rangeSelectionIndexEnd = newActiveOptionIndex;
											activeOptions = activeOptions;
										}
									} else {
										activeOptions = newActiveOption ? [newActiveOption] : [];
									}
									break;
								}
								case 'Home': {
									const newActiveOptionIndex = 0;
									const newActiveOption = options.at(newActiveOptionIndex);

									if (newActiveOption) {
										if (event.shiftKey) {
											const firstActiveOptionIndex = getFirstActiveOptionIndex();
											activeOptions = options
												.slice(newActiveOptionIndex, firstActiveOptionIndex + 1)
												.reverse();
										} else {
											activeOptions = [newActiveOption];
										}
									}
									break;
								}
								case 'End': {
									const newActiveOptionIndex = options.length - 1;
									const newActiveOption = options.at(newActiveOptionIndex);

									if (newActiveOption) {
										if (event.shiftKey) {
											const firstActiveOptionIndex = getFirstActiveOptionIndex();
											activeOptions = options.slice(firstActiveOptionIndex);
										} else {
											activeOptions = [newActiveOption];
										}
									}
									break;
								}
							}

							if (activeOptions.length > 0) {
								const activeOptionEl = document.getElementById(getOptionId(activeOptions.at(-1)!));
								if (activeOptionEl && !(await elementInViewChecker.check(activeOptionEl))) {
									activeOptionEl.scrollIntoView({ block: 'nearest' });
								}
							}
							break;

						case 'Enter':
						case ' ':
							toggleOptions(activeOptions);
							break;
					}

					break;
				default:
					if (event.key.match(printableCharRegex)) {
						temporaryFilter.addChar(event.key);
						const newActiveOption = options.find((item) =>
							item.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase())
						);
						activeOptions = newActiveOption ? [newActiveOption] : [];
					}
					break;
			}
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		switch (event.key) {
			case 'Control':
				isCtrlPressed = false;
				break;
			case 'Shift':
				isShiftPressed = false;
		}
	}

	function handleClick(option: string) {
		if (!isShiftPressed) {
			rangeSelectionIndexEnd = rangeSelectionIndexStart = null;
		}

		if (isCtrlPressed) {
			if (isShiftPressed) {
				rangeSelectionIndexStart = rangeSelectionIndexStart!;
				const newActiveOptionIndex = options.indexOf(option);
				if (rangeSelectionIndexStart < newActiveOptionIndex) {
					activeOptions = Array.from(
						new Set(
							[
								activeOptions,
								options.slice(rangeSelectionIndexStart, newActiveOptionIndex + 1)
							].flat()
						)
					);
				} else {
					activeOptions = Array.from(
						new Set(
							[
								activeOptions,
								options.slice(newActiveOptionIndex, rangeSelectionIndexStart + 1).reverse()
							].flat()
						)
					);
				}
			} else {
				if (activeOptions.includes(option)) {
					activeOptions = activeOptions.filter((item) => item !== option);
				} else {
					activeOptions.push(option);
					activeOptions = activeOptions;
				}
			}
		} else {
			if (isShiftPressed) {
				rangeSelectionIndexStart = rangeSelectionIndexStart!;
				const newActiveOptionIndex = options.indexOf(option);
				if (rangeSelectionIndexStart < newActiveOptionIndex) {
					activeOptions = options.slice(rangeSelectionIndexStart, newActiveOptionIndex + 1);
				} else {
					activeOptions = options
						.slice(newActiveOptionIndex, rangeSelectionIndexStart + 1)
						.reverse();
				}
			} else {
				activeOptions = [option];
			}
		}
	}
</script>

<div {id}>
	<span id={labelId}>Listbox label</span>
	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<menu
		bind:this={el}
		class="Listbox"
		role="listbox"
		tabindex={0}
		aria-labelledby={labelId}
		aria-multiselectable="true"
		aria-activedescendant={lastActiveOption ? getOptionId(lastActiveOption) : ''}
		on:keydown={handleKeyDown}
		on:keyup={handleKeyUp}
	>
		{#each options as option}
			{@const isSelected = value.includes(option)}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li
				id={getOptionId(option)}
				class="Listbox__option"
				class:Listbox__option--active={activeOptions.includes(option)}
				class:Listbox__option--selected={isSelected}
				class:Listbox__option--focus={activeOptions.at(-1) === option}
				role="option"
				aria-selected={isSelected}
				on:click={() => handleClick(option)}
			>
				{option}
			</li>
		{/each}
	</menu>
</div>

<style>
	.Listbox {
		list-style: none;
		border: 1px solid black;
		padding: 0;
		margin: 0;
		height: 300px;
		width: 500px;
		overflow-y: auto;
	}

	.Listbox:focus {
		outline: 2px solid black;
	}

	.Listbox__option {
		padding: 8px 32px;
		cursor: pointer;
		user-select: none;
		background: transparent;
		border: none;
	}

	.Listbox .Listbox__option--active {
		background-color: lightcoral;
	}

	.Listbox:focus .Listbox__option--active {
		background-color: coral;
	}

	.Listbox:focus .Listbox__option--focus {
		outline: 2px solid black;
	}

	.Listbox__option--selected {
		background-color: orange;
	}
</style>
