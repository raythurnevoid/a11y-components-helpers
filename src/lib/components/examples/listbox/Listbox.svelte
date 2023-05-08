<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import { createEventDispatcher, tick } from 'svelte';

	let el: HTMLElement;
	let id: string = `MenuButton--${index++}`;

	let menuItems: string[] = ['A', 'B', 'C'];

	let activeItem: string | null | undefined = undefined;
	let selectedItem: string | null | undefined = undefined;
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new TemporaryOnKeyDownFilterStore();

	const dispatch = createEventDispatcher<{
		select: { value: string };
	}>();

	function focusActiveItem() {
		(el.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
	}

	function selectItem(value: string) {
		selectedItem = activeItem = value;
		dispatch('select', { value });
	}

	async function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case ' ':
			case 'Escape':
			case 'Home':
			case 'End':
				event.preventDefault();

				switch (event.key) {
					case 'Escape':
						break;
					default:
						switch (event.key) {
							case 'Home':
								activeItem = menuItems.at(0) ?? null;
								break;
							case 'End':
								activeItem = menuItems.at(-1) ?? null;
								break;
							case 'ArrowDown':
							case 'ArrowUp':
								const activeItemIndex = menuItems.indexOf(selectedItem!);
								switch (event.key) {
									case 'ArrowDown':
										activeItem = menuItems.at(activeItemIndex + 1) ?? menuItems.at(0) ?? null;
										null;
										break;
									case 'ArrowUp':
										activeItem = menuItems.at(activeItemIndex - 1) ?? null;
										break;
								}
								break;
							case 'Enter':
							case ' ':
								// selectItem(activeItem ?? '');
								break;
						}
						selectItem(activeItem ?? '');
						break;
				}
				break;
			default:
				if (event.key.match(printableCharRegex)) {
					temporaryFilter.addChar(event.key);
					activeItem =
						menuItems.find((item) =>
							item.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase())
						) ?? activeItem;
				}
				break;
		}

		await tick();
		focusActiveItem();
	}

	function handleClick(menuItem: string) {
		selectItem(menuItem);
	}
</script>

<label
	>test
	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<menu
		bind:this={el}
		class="MenuButton"
		role="listbox"
		tabindex={!activeItem ? 0 : -1}
		on:keydown={handleKeyDown}
	>
		{#each menuItems as menuItem}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li class="MenuButton__li" role="presentation">
				<button
					class="MenuButton__menuitem"
					class:MenuButton__menuitem--selected={selectedItem === menuItem}
					role="option"
					aria-selected={selectedItem === menuItem}
					tabindex={activeItem === menuItem ? 0 : -1}
					on:click={() => handleClick(menuItem)}
				>
					{menuItem}
				</button>
			</li>
		{/each}
	</menu>
</label>

<style>
	.MenuButton {
		list-style: none;
		border: 1px solid black;
		flex-direction: column;
		width: max-content;
		padding: 0;
		margin: 0;
	}

	.MenuButton:focus-within {
		outline: 2px solid black;
	}

	.MenuButton__li {
		padding: 0;
	}

	.MenuButton__menuitem {
		padding: 8px 32px;
		cursor: pointer;
		user-select: none;
		appearance: none;
		background: transparent;
		border: none;
	}

	.MenuButton__menuitem--selected {
		background-color: orange;
	}

	.MenuButton__menuitem:focus {
		background-color: lightcoral;
	}

	.MenuButton__menuitem:focus-visible {
		outline: 2px solid black;
	}

	.MenuButton__li:has(.MenuButton__menuitem:empty),
	.MenuButton__menuitem:empty {
		height: 0;
		opacity: 0;
		pointer-events: none;
	}
</style>
