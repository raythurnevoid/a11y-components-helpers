<script lang="ts" context="module">
	let count: number = 0;
</script>

<script lang="ts">
	import { InputOptionsTimedFilter } from '$lib/input-options-timed-filter.js';
	import { createEventDispatcher, onMount, tick } from 'svelte';

	let el: HTMLElement;
	let id: string = `MenuButton--${count++}`;

	const dispatch = createEventDispatcher<{
		select: { value: string };
	}>();

	let buttonEl: HTMLButtonElement;
	let menuEl: HTMLMenuElement;
	const menuId = `"${id}__menu"`;
	let menuItems: string[] = ['A', 'B', 'C'];
	let open: boolean = false;

	let activeMenuItem: string | null | undefined = undefined;
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new InputOptionsTimedFilter();

	onMount(() => {
		handleDomChange();
	});

	function openMenu() {
		open = true;
		tick().then(() => {
			menuEl.focus();
		});
	}

	function closeMenu() {
		open = false;
		activeMenuItem = null;
	}

	function selectItem(value: string) {
		dispatch('select', { value });
		closeMenu();
	}

	function findMenuItemId(value: string) {
		console.log('findMenuItemId', value, menuEl.querySelector(`[data-value="${value}"]`)?.id);
		return menuEl.querySelector(`[data-value="${value}"]`)?.id;
	}

	function handleDomChange() {
		menuItems = Array.from(menuEl.querySelectorAll('[role="menuitem"]')).map((el) => el.id);
	}

	function handleButtonClick() {
		if (open) {
			closeMenu();
		} else {
			openMenu();
			activeMenuItem = menuItems.at(0) ?? null;
		}
	}

	function handleMenuItemClick(menuItem: string) {
		selectItem(menuItem);
		buttonEl.focus();
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case ' ':
			case 'Escape':
			case 'Tab':
			case 'Home':
			case 'PageUp':
			case 'End':
			case 'PageDown':
				if (event.key !== 'Tab') event.preventDefault();

				switch (event.key) {
					case 'Escape':
					case 'Tab':
						closeMenu();
						break;
					default:
						if (!open) {
							switch (event.key) {
								case 'ArrowDown':
								case 'ArrowUp':
								case 'Enter':
								case ' ':
									openMenu();
									break;
							}

							switch (event.key) {
								case 'Enter':
								case ' ':
								case 'ArrowDown':
									activeMenuItem = menuItems.at(0) ?? null;
									break;
								case 'ArrowUp':
									activeMenuItem = menuItems.at(-1) ?? null;
									break;
							}
						} else {
							switch (event.key) {
								case 'Home':
								case 'PageUp':
									activeMenuItem = menuItems.at(0) ?? null;
									break;
								case 'End':
								case 'PageDown':
									activeMenuItem = menuItems.at(-1) ?? null;
									break;

								case 'ArrowDown': {
									const activeItemIndex = menuItems.indexOf(activeMenuItem!);
									activeMenuItem = menuItems.at(activeItemIndex + 1) ?? menuItems.at(0) ?? null;
									null;
									break;
								}
								case 'ArrowUp': {
									const activeItemIndex = menuItems.indexOf(activeMenuItem!);
									activeMenuItem = menuItems.at(activeItemIndex - 1) ?? null;
									break;
								}
								case 'Enter':
								case ' ':
									if (activeMenuItem) {
										selectItem(activeMenuItem);
										buttonEl.focus();
									}
									break;
							}
						}
						break;
				}
				break;
			default:
				if (event.key.match(printableCharRegex)) {
					temporaryFilter.addChar(event.key);
					activeMenuItem =
						menuItems.find((item) =>
							item.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase())
						) ?? activeMenuItem;
				}
				break;
		}
	}

	function handleFocusOut(event: FocusEvent) {
		if (!open || !document.hasFocus() || el.contains(event.relatedTarget as Element)) {
			return;
		}

		closeMenu();
	}

	function handlePointerOver(menuItem: string) {
		activeMenuItem = menuItem;
	}
</script>

<div {id} bind:this={el} class="MenuButton" on:keydown={handleKeyDown} on:focusout={handleFocusOut}>
	<button
		bind:this={buttonEl}
		class="MenuButton__button"
		on:click={handleButtonClick}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={menuId}
	>
		Menu
	</button>
	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<!-- svelte-ignore a11y-no-redundant-roles -->
	<menu
		bind:this={menuEl}
		id={menuId}
		class="MenuButton__menu"
		class:Menu--open={open}
		tabindex="-1"
		role="menu"
		aria-labelledby={id}
		aria-activedescendant={activeMenuItem ? findMenuItemId(activeMenuItem) ?? '' : ''}
	>
		{#each menuItems as menuItem}
			<!--svelte-ignore a11y-click-events-have-key-events -->
			<li
				id="{id}__menu-item--{menuItem}"
				class="MenuButton__menuitem"
				class:MenuButton__menuitem--active={menuItem === activeMenuItem}
				data-value={menuItem}
				role="menuitem"
				tabindex="-1"
				on:click={() => handleMenuItemClick(menuItem)}
				on:pointerover={() => handlePointerOver(menuItem)}
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

	.MenuButton__button:focus-visible {
		outline: 2px solid black;
	}

	.MenuButton__menu {
		display: none;
		position: absolute;
		list-style: none;
		border: 1px solid black;
		width: max-content;
		padding: 16px 0;
		margin: 0;
		background-color: lightyellow;
	}

	.MenuButton__menu:focus-visible {
		outline: 2px solid black;
	}

	.Menu--open {
		display: block;
	}

	.MenuButton__menuitem {
		padding-inline: 16px;
		cursor: pointer;
		user-select: none;
		appearance: none;
		background: transparent;
		border: none;
		padding: 0 16px;
	}

	.MenuButton__menuitem--active {
		background-color: lightgray;
	}
</style>
