<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import { createEventDispatcher, tick } from 'svelte';

	let el: HTMLElement;
	let id: string = `MenuButton--${index++}`;

	let menuItems: string[] = ['A', 'B', 'C'];

	let open: boolean = false;
	let activeItem: string | null | undefined = undefined;
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new TemporaryOnKeyDownFilterStore();

	const dispatch = createEventDispatcher<{
		select: { value: string };
	}>();

	function focusActiveItem() {
		(el.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
	}

	function openMenu() {
		open = true;
	}

	function closeMenu() {
		open = false;
		activeItem = null;
	}

	function selectItem(value: string) {
		dispatch('select', { value });
		closeMenu();
	}

	async function handleClick() {
		if (open) {
			closeMenu();
		} else {
			openMenu();
			activeItem = menuItems.at(0) ?? null;
		}

		await tick();
		focusActiveItem();
	}

	async function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case ' ':
			case 'Escape':
			case 'Home':
			case 'PageUp':
			case 'End':
			case 'PageDown':
				event.preventDefault();

				switch (event.key) {
					case 'Escape':
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
									activeItem = menuItems.at(0) ?? null;
									break;
								case 'ArrowUp':
									activeItem = menuItems.at(-1) ?? null;
									break;
							}
						} else {
							switch (event.key) {
								case 'Home':
								case 'PageUp':
									activeItem = menuItems.at(0) ?? null;
									break;
								case 'End':
								case 'PageDown':
									activeItem = menuItems.at(-1) ?? null;
									break;
								case 'ArrowDown':
								case 'ArrowUp':
									const activeItemIndex = menuItems.indexOf(activeItem!);
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
									if (activeItem) selectItem(activeItem);
									break;
							}
						}
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

	function handleFocusOut(event: FocusEvent) {
		if (!open || !document.hasFocus() || el?.contains(event.relatedTarget as Element)) {
			return;
		}

		closeMenu();
	}

	async function handlePointerOver(menuItem: string) {
		activeItem = menuItem;

		await tick();
		focusActiveItem();
	}
</script>

<div bind:this={el} class="MenuButton" on:focusout={handleFocusOut} on:keydown={handleKeyDown}>
	<button
		{id}
		class="MenuButton__button"
		on:click={handleClick}
		aria-haspopup="true"
		aria-expanded={open}
	>
		Menu
	</button>
	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<!-- svelte-ignore a11y-no-redundant-roles -->
	<menu class="MenuButton__menu" class:Menu--open={open} role="menu" aria-labelledby={id}>
		{#each menuItems as menuItem, index}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li class="MenuButton__li" role="presentation">
				<button
					class="MenuButton__menuitem"
					role="menuitem"
					tabindex={menuItem === activeItem ? 0 : -1}
					on:click={() => selectItem(menuItem)}
					on:pointerover={() => handlePointerOver(menuItem)}
				>
					{menuItem}
				</button>
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

	.MenuButton__li {
		padding: 0;
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
	}

	.MenuButton__menuitem:focus {
		background-color: lightgray;
	}

	.MenuButton__menuitem:focus-visible {
		outline: 2px solid black;
	}
</style>
