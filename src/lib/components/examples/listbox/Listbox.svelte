<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import { createEventDispatcher, onMount } from 'svelte';
	import ElementInViewChecker from '$lib/ElementInViewChecker.js';

	let el: HTMLElement;
	let id: string = `Listbox--${index++}`;
	let labelId: string = `${id}__label`;

	let options: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
	let value: string = '';

	const dispatch = createEventDispatcher<{
		change: { value: string };
	}>();

	let activeOption: string | null | undefined = undefined;
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new TemporaryOnKeyDownFilterStore();

	let elementInViewChecker: ElementInViewChecker;

	onMount(() => {
		elementInViewChecker = new ElementInViewChecker(el);

		() => {
			elementInViewChecker.destroy();
		};
	});

	function selectOption(optionValue: string) {
		value = optionValue;
		dispatch('change', { value: optionValue });
	}

	function getOptionId(option: string) {
		return `${id}__option--${option}`;
	}

	async function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case ' ':
			case 'Home':
			case 'End':
			case 'Escape':
				event.preventDefault();

				switch (event.key) {
					case 'Home':
						activeOption = options.at(0) ?? null;
						break;
					case 'End':
						activeOption = options.at(-1) ?? null;
						break;
					case 'ArrowDown':
					case 'ArrowUp':
						const activeOptionIndex = activeOption
							? options.indexOf(activeOption)
							: value
							? options.indexOf(value)
							: null;
						switch (event.key) {
							case 'ArrowDown':
								activeOption =
									options.at(activeOptionIndex != null ? activeOptionIndex + 1 : 0) ??
									options.at(0) ??
									null;
								null;
								break;
							case 'ArrowUp':
								activeOption =
									options.at(activeOptionIndex != null ? activeOptionIndex - 1 : -1) ?? null;
								break;
						}
						break;
					case 'Enter':
					case ' ':
						if (activeOption) {
							selectOption(activeOption);
						}
						break;
					case 'Escape':
						if (value) {
							value = '';
						} else if (activeOption) {
							activeOption = null;
						}
						break;
				}
				break;
			default:
				if (event.key.match(printableCharRegex)) {
					temporaryFilter.addChar(event.key);
					activeOption =
						options.find((item) =>
							item.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase())
						) ?? activeOption;
				}
				break;
		}

		if (activeOption) {
			const activeOptionEl = document.getElementById(getOptionId(activeOption));
			if (activeOptionEl && !(await elementInViewChecker.check(activeOptionEl))) {
				activeOptionEl.scrollIntoView({ block: 'nearest' });
			}
		}
	}

	function handleClick(option: string) {
		activeOption = option;
		selectOption(option);
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
		aria-activedescendant={activeOption ? getOptionId(activeOption) : ''}
		on:keydown={handleKeyDown}
		on:focus
	>
		{#each options as option}
			{@const isSelected = value === option}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li
				id={getOptionId(option)}
				class="Listbox__option"
				class:Listbox__option--active={activeOption === option}
				class:Listbox__option--selected={isSelected}
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

	.Listbox:focus .Listbox__option--active {
		background-color: lightcoral;
	}

	.Listbox__option--selected {
		background-color: orange;
	}
</style>
