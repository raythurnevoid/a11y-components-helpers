<script lang="ts" context="module">
	export interface MenuItem {
		value: string;
		submenu?: MenuItem[];
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { InputBackgroundTimedFilter } from '$lib/input-background-timed-filter.js';
	import MenuBarItem from './MenuBarItem.svelte';

	let el: HTMLElement;

	const menuBar = [
		{
			value: 'File',
			submenu: [
				{
					value: 'Save'
				},
				{
					value: 'Open',
					submenu: [
						{
							value: 'From Folder'
						},
						{
							value: 'From Workspace File'
						}
					]
				},
				{
					value: 'Preferences',
					submenu: [
						{
							value: 'Profiles',
							submenu: [
								{
									value: 'Create'
								},
								{
									value: 'Edit'
								}
							]
						},
						{
							value: 'Settings'
						}
					]
				}
			]
		},
		{
			value: 'Edit',
			submenu: [
				{
					value: 'Undo'
				},
				{
					value: 'Redo'
				}
			]
		},
		{
			value: 'Help'
		}
	] as MenuItem[];

	let openItems = new Set<MenuItem>();
	let itemPathMap = new Map<MenuItem, number[]>();
	let itemAncestryMap = new Map<MenuItem, MenuItem[]>();
	let activeItem: MenuItem | undefined = menuBar.at(0);
	let canMenuAutoOpen = false;
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new InputBackgroundTimedFilter();

	(function mapItemsId(items: MenuItem[], path: number[] = [], ancestors: MenuItem[] = []) {
		items.forEach((item, i) => {
			const itemPath = [...path, i];
			itemPathMap.set(item, itemPath);
			itemAncestryMap.set(item, ancestors);

			if (item.submenu) {
				mapItemsId(item.submenu, itemPath, [...ancestors, item]);
			}
		});
	})(menuBar);

	function openItem(itemToOpen: MenuItem) {
		openItems.clear();
		const ancestorsToOpen = itemAncestryMap.get(itemToOpen)!;
		ancestorsToOpen.forEach((pointer) => {
			openItems.add(pointer);
		});
		openItems.add(itemToOpen);

		openItems = openItems;
		canMenuAutoOpen = true;
	}

	function focusActiveItem() {
		(el.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
	}

	function closeMenus() {
		openItems.clear();
		openItems = openItems;
		canMenuAutoOpen = false;
	}

	async function handleKeyDown(event: KeyboardEvent) {
		if (!activeItem) {
			return;
		}

		const activeItemAncenstry = itemAncestryMap.get(activeItem)!;

		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowLeft':
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

				const activeItemPath = itemPathMap.get(activeItem)!;

				const isActiveItemInMenuBar = activeItemPath.length === 1;
				let itemToActivate: MenuItem | null = null;
				let itemToOpen: MenuItem | null = null;

				switch (event.key) {
					case 'Escape':
						itemToActivate = activeItemAncenstry.at(0)!;
						if (openItems.size > 0) {
							closeMenus();
						}
						break;
					case 'Home':
					case 'PageUp':
						itemToActivate = activeItemAncenstry.at(-1)!.submenu?.at(0) ?? null;
						break;
					case 'End':
					case 'PageDown':
						itemToActivate = activeItemAncenstry.at(-1)!.submenu?.at(-1) ?? null;
						break;
					default:
						if (isActiveItemInMenuBar) {
							switch (event.key) {
								case 'ArrowRight':
								case 'ArrowLeft':
									if (event.key === 'ArrowRight') {
										itemToActivate =
											menuBar.at(activeItemPath.at(0)! + 1) ?? menuBar.at(0)! ?? null;
									} else {
										itemToActivate = menuBar.at(activeItemPath.at(0)! - 1) ?? null;
									}

									if (canMenuAutoOpen) {
										itemToOpen = itemToActivate;
									}

									break;
								case 'ArrowUp':
								case 'ArrowDown':
								case 'Enter':
								case ' ':
									if (activeItem.submenu) {
										itemToOpen = activeItem;
									}

									if (!itemToOpen) {
										break;
									}

									if (event.key === 'ArrowUp' && itemToOpen.submenu!.at(-1)) {
										itemToActivate = itemToOpen.submenu!.at(-1)!;
									} else if (itemToOpen.submenu!.at(0)) {
										itemToActivate = itemToOpen.submenu!.at(0)!;
									}

									break;
							}
						} else {
							switch (event.key) {
								case 'ArrowDown':
									itemToActivate =
										activeItemAncenstry.at(-1)!.submenu?.at(activeItemPath.at(-1)! + 1) ??
										activeItemAncenstry.at(-1)!.submenu?.at(0) ??
										null;
									null;
									break;
								case 'ArrowUp':
									itemToActivate =
										activeItemAncenstry.at(-1)!.submenu?.at(activeItemPath.at(-1)! - 1) ?? null;
									break;

								case 'Enter':
								case ' ':
									if (activeItem && activeItem.submenu) {
										itemToOpen = activeItem;

										if (itemToOpen.submenu!.at(0)) {
											itemToActivate = itemToOpen.submenu!.at(0)!;
										}
									}
									break;
								case 'ArrowRight':
									if (activeItem.submenu) {
										itemToOpen = activeItem;

										if (itemToOpen.submenu!.at(0)) {
											itemToActivate = itemToOpen.submenu!.at(0)!;
										}
									} else {
										itemToActivate = menuBar.at(activeItemPath.at(0)! + 1) ?? menuBar.at(0) ?? null;
										if (itemToActivate) {
											itemToOpen = itemToActivate;
										}
									}
									break;
								case 'ArrowLeft':
									if (activeItemAncenstry.length > 1) {
										itemToActivate = activeItemAncenstry.at(-1) ?? null;
										itemToOpen = activeItemAncenstry.at(-2) ?? null;
									} else {
										itemToActivate = menuBar.at(activeItemPath.at(0)! - 1) ?? null;
										if (itemToActivate) {
											itemToOpen = itemToActivate;
										}
									}
									break;
							}
						}
						break;
				}

				if (itemToActivate) {
					activeItem = itemToActivate;
				}

				if (itemToOpen) {
					openItem(itemToOpen);
				}

				break;
			default:
				if (event.key.match(printableCharRegex)) {
					temporaryFilter.addChar(event.key);
					const currentMenu = activeItemAncenstry.at(-1)?.submenu ?? menuBar;
					activeItem =
						currentMenu.find((item) =>
							item.value.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase())
						) ?? activeItem;
				}
				break;
		}

		await tick();
		focusActiveItem();
	}

	async function handlePointerOver(event: MenuBarItem['$$events_def']['pointerover']) {
		activeItem = event.detail.menuItem;
		if (el.contains(document.activeElement)) {
			openItem(activeItem);

			await tick();
			focusActiveItem();
		}
	}

	function handleFocusOut(event: FocusEvent) {
		if (!document.hasFocus() || el?.contains(event.relatedTarget as Element)) {
			return;
		}

		closeMenus();
		activeItem = itemAncestryMap.get(activeItem!)!.at(0)! ?? activeItem;
	}

	function handleClick(event: MenuBarItem['$$events_def']['click']) {
		activeItem = event.detail.menuItem;
		if (el.contains(document.activeElement)) {
			openItem(activeItem);
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<menu
	bind:this={el}
	class="MenuBar"
	role="menubar"
	on:keydown={handleKeyDown}
	on:focusout={handleFocusOut}
>
	{#each menuBar as menuItem}
		<MenuBarItem
			{menuItem}
			{activeItem}
			{openItems}
			on:click={handleClick}
			on:pointerover={handlePointerOver}
		/>
	{/each}
</menu>

<style>
	.MenuBar {
		display: flex;
		flex-direction: row;
		list-style: none;
		padding: 0;
		margin: 0;
		background: lightyellow;
		border-block-end: 1px solid gray;
	}
</style>
