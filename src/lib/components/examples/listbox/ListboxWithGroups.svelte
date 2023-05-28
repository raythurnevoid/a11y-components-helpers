<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import { createEventDispatcher, onMount } from 'svelte';
	import ElementInViewChecker from '../../../ElementInViewChecker.js';

	let el: HTMLElement;
	let id: string = `Listbox--${index++}`;
	let labelId: string = `${id}__label`;

	let options: { group: string; items: string[] }[] = [
		{
			group: 'group-1',
			items: ['A', 'B', 'C', 'D', 'E']
		},
		{
			group: 'group-2',
			items: ['F', 'G', 'H', 'I', 'J']
		},
		{
			group: 'group-3',
			items: ['K', 'L', 'M', 'N']
		}
	];
	let flatOptions: string[] = options.flatMap((option) => option.items);
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
				event.preventDefault();

				switch (event.key) {
					case 'Home':
						activeOption = flatOptions.at(0) ?? null;
						break;
					case 'End':
						activeOption = flatOptions.at(-1) ?? null;
						break;
					case 'ArrowDown':
					case 'ArrowUp':
						const activeOptionIndex = activeOption
							? flatOptions.indexOf(activeOption)
							: value
							? flatOptions.indexOf(value)
							: -1;
						switch (event.key) {
							case 'ArrowDown':
								activeOption = flatOptions.at(activeOptionIndex + 1) ?? flatOptions.at(0) ?? null;
								null;
								break;
							case 'ArrowUp':
								activeOption = flatOptions.at(activeOptionIndex - 1) ?? null;
								break;
						}
						break;
					case 'Enter':
					case ' ':
						if (activeOption) {
							selectOption(activeOption);
						}
						break;
				}
				break;
			default:
				if (event.key.match(printableCharRegex)) {
					temporaryFilter.addChar(event.key);
					activeOption =
						flatOptions.find((item) =>
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
	<div
		bind:this={el}
		class="Listbox"
		role="listbox"
		tabindex={0}
		aria-labelledby={labelId}
		aria-activedescendant={activeOption ? getOptionId(activeOption) : ''}
		on:keydown={handleKeyDown}
		on:focus
	>
		{#each options as group, groupIndex}
			{@const groupId = `Listbox__group--${groupIndex}`}
			<ul class="Listbox__group" role="group" aria-labelledby={groupId}>
				<li id={groupId} role="presentation" class="Listbox__group-label">{group.group}</li>
				{#each group.items as option}
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
			</ul>
		{/each}
	</div>
</div>

<style>
	.Listbox {
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

	.Listbox__group {
		margin: 0;
		list-style: none;
	}

	.Listbox__group-label {
		font-weight: bold;
	}
</style>
