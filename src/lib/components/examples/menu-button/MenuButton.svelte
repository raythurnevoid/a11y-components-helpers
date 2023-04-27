<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import { createEventDispatcher } from 'svelte';

	let id: string = `MenuButton--${index++}`;
	let menuItems: string[] = ['Action 1', 'Action 2', 'Action 3'];

	let el: HTMLElement | undefined = undefined;
	let menuId: string = `${id}__menu`;

	let open: boolean = false;
	let activeOptionIndex: number | null = null;

	let wrapFocus: boolean = true;

	const temporaryOnKeyDownFilterStore = new TemporaryOnKeyDownFilterStore();

	const dispatch = createEventDispatcher<{
		select: { value: string };
	}>();

	function handleClick() {
		if (open) {
			closeMenu();
		} else {
			openMenu();
		}
	}

	function handleButtonKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.altKey || event.metaKey) {
			return;
		}

		switch (event.key) {
			case ' ':
			case 'Enter':
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Escape':
				event.preventDefault();
				break;
		}

		if (!open) {
			switch (event.key) {
				case ' ':
				case 'Enter':
				case 'ArrowDown':
				case 'ArrowUp':
					open = true;
					break;
			}

			switch (event.key) {
				case ' ':
				case 'Enter':
				case 'ArrowDown':
					activeOptionIndex = 0;
					break;

				case 'ArrowUp':
					activeOptionIndex = menuItems.length - 1;
					break;
			}
		} else {
			activeOptionIndex = activeOptionIndex as number;

			switch (event.key) {
				case 'Home':
				case 'PageUp':
				case 'End':
				case 'PageDown':
					event.preventDefault();
					break;
			}

			switch (event.key) {
				case 'Escape':
					closeMenu();
					break;

				case 'ArrowDown':
					if (wrapFocus && activeOptionIndex === menuItems.length - 1) {
						activeOptionIndex = 0;
					} else {
						activeOptionIndex = Math.min(activeOptionIndex + 1, menuItems.length - 1);
					}

					break;

				case 'ArrowUp':
					if (wrapFocus && activeOptionIndex === 0) {
						activeOptionIndex = menuItems.length - 1;
					} else {
						activeOptionIndex = Math.max(activeOptionIndex - 1, 0);
					}

					break;

				case 'Home':
				case 'PageUp':
					activeOptionIndex = 0;
					break;

				case 'End':
				case 'PageDown':
					activeOptionIndex = menuItems.length - 1;
					break;

				case ' ':
				case 'Enter':
					selectItem(menuItems[activeOptionIndex]);
					break;

				default:
					if (temporaryOnKeyDownFilterStore.handleOnKeyDown(event)) {
						event.preventDefault();

						const itemsToSearch = menuItems.slice(activeOptionIndex);
						let index = findIndexOfItemStartingWith(
							itemsToSearch,
							temporaryOnKeyDownFilterStore.filter
						);
						if (index === -1) {
							index = findIndexOfItemStartingWith(menuItems, temporaryOnKeyDownFilterStore.filter);
						}

						if (index !== -1) {
							activeOptionIndex = index;
						}
					}
			}
		}
	}

	function handleBackgroundPointerUp(event: PointerEvent) {
		const target = event.target as HTMLElement;

		if (!open || el?.contains(target)) {
			return;
		}

		closeMenu();
	}

	function handleFocusOut() {
		if (!open || !document.hasFocus() || el?.querySelector(':scope:hover, :hover')) {
			return;
		}

		closeMenu();
	}

	function findIndexOfItemStartingWith(items: string[], filter: string) {
		return items.findIndex((i) => i.startsWith(filter));
	}

	function getMenuItemId(index: number | null) {
		if (index === null) return undefined;
		return `${menuId}__item--${menuItems[index]}`;
	}

	function openMenu() {
		open = true;
		activeOptionIndex = 0;
	}

	function closeMenu() {
		open = false;
		activeOptionIndex = null;
	}

	function selectItem(value: string) {
		dispatch('select', { value });
		closeMenu();
	}
</script>

<svelte:window on:pointerup={handleBackgroundPointerUp} />

<div bind:this={el} class="MenuButton" on:focusout={handleFocusOut}>
	<button
		{id}
		class="MenuButton__button"
		on:click={handleClick}
		on:keydown={handleButtonKeyDown}
		aria-haspopup="true"
		aria-controls={menuId}
		aria-expanded={open}
	>
		Menu
	</button>
	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<!-- svelte-ignore a11y-no-redundant-roles -->
	<menu
		id={menuId}
		class="MenuButton__menu"
		class:Menu--open={open}
		role="menu"
		tabindex="-1"
		aria-labelledby={id}
		aria-activedescendant={getMenuItemId(activeOptionIndex)}
	>
		{#each menuItems as menuItem, index}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li
				id={getMenuItemId(index)}
				class="MenuButton__menu-item"
				class:MenuButton__menu-item--active={index === activeOptionIndex}
				role="menuitem"
				on:click={() => selectItem(menuItem)}
			>
				{menuItem}
			</li>
		{/each}
	</menu>
</div>

<style>
	.MenuButton {
		position: relative;
	}

	.MenuButton__button {
		cursor: pointer;
	}

	.MenuButton__button:focus-within {
		outline: 2px solid black;
	}

	.MenuButton__menu {
		display: none;
		position: absolute;
		list-style: none;
		border: 1px solid black;
		flex-direction: column;
		width: max-content;
		padding: 16px 0;
		margin: 0;
		background-color: lightyellow;
	}

	.Menu--open {
		display: block;
	}

	.MenuButton__menu-item {
		padding-inline: 16px;
		cursor: pointer;
		user-select: none;
	}

	.MenuButton__menu-item--active {
		background-color: lightgray;
	}
</style>
