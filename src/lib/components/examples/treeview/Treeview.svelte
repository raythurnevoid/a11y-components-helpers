<script lang="ts" context="module">
	type TreeviewItems = TreeviewItemI[];

	export interface TreeviewItemI {
		value: string;
		subitems?: TreeviewItemI[];
	}

	type ItemPathStr = string;
	type ItemPath = number[];

	export interface TreeViewContext {
		getItemId: (item: TreeviewItemI) => ItemPathStr;
	}
</script>

<script lang="ts">
	import { createEventDispatcher, setContext, tick } from 'svelte';
	import { TemporaryOnKeyDownFilterStore } from '$lib/lib/menu/menu.js';
	import TreeviewItem from './TreeviewItem.svelte';

	let el: HTMLElement;

	const items: TreeviewItems = [
		{
			value: 'File',
			subitems: [
				{
					value: 'Save'
				},
				{
					value: 'Open',
					subitems: [
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
					subitems: [
						{
							value: 'Profiles',
							subitems: [
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
			subitems: [
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
	];

	const dispatch = createEventDispatcher<{
		change: { value: string };
	}>();

	setContext<TreeViewContext>('treeview', {
		getItemId
	});

	let itemPathMap = new Map<TreeviewItemI, ItemPath>();
	let itemAncestryMap = new Map<TreeviewItemI, TreeviewItemI[]>();
	const printableCharRegex = /^[a-zA-Z0-9]$/;
	const temporaryFilter = new TemporaryOnKeyDownFilterStore();
	const flatItems = (function mapItems(
		items: TreeviewItemI[],
		path: number[] = [],
		ancestors: TreeviewItemI[] = []
	) {
		const flatItems = items.flatMap((item, i) => {
			const itemPath = [...path, i];
			const itemsAcc: TreeviewItemI[] = [item];

			itemPathMap.set(item, itemPath);
			itemAncestryMap.set(item, ancestors);

			if (item.subitems) {
				itemsAcc.push(...mapItems(item.subitems, itemPath, [...ancestors, item]));
			}

			return itemsAcc;
		});

		return flatItems;
	})(items);

	let openItemsSet = new Set<TreeviewItemI>();
	$: showedItems = flatItems.filter((item) => {
		return (
			itemPathMap.get(item)!.length === 1 ||
			itemAncestryMap.get(item)?.every((ancestor) => openItemsSet.has(ancestor))
		);
	});

	let activeItem: TreeviewItemI | null | undefined = undefined;
	let selectedItem: TreeviewItemI | null | undefined = undefined;

	function getItemId(item: TreeviewItemI) {
		return `Treeview__${itemPathMap.get(item)!.join('-')}`;
	}

	function openItem(itemToOpen: TreeviewItemI) {
		openItemsSet.add(itemToOpen);
		openItemsSet = openItemsSet;
	}

	function closeItem(itemToOpen: TreeviewItemI) {
		openItemsSet.delete(itemToOpen);
		openItemsSet = openItemsSet;
	}

	function getNextItemToActivate(currentItem: TreeviewItemI, direction: 'next' | 'prev') {
		const currentItemIndex = showedItems.indexOf(currentItem)!;
		const itemToActivateIndex = direction === 'next' ? currentItemIndex + 1 : currentItemIndex - 1;
		const itemToActivate =
			itemToActivateIndex >= 0 ? showedItems?.at(itemToActivateIndex) ?? null : null;

		return itemToActivate;
	}

	function focusActiveItem() {
		(el.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
	}

	function closeItems() {
		openItemsSet.clear();
		openItemsSet = openItemsSet;
	}

	function selectItem(itemToSelect: TreeviewItemI) {
		selectedItem = itemToSelect;

		dispatch('change', { value: itemToSelect.value });
	}

	async function handleKeyDown(event: KeyboardEvent) {
		const activeItemAncenstry = activeItem ? itemAncestryMap.get(activeItem)! : null;

		let itemToActivate: TreeviewItemI | null | undefined = undefined;
		let itemToSelect: TreeviewItemI | null | undefined = undefined;
		let itemToOpen: TreeviewItemI | undefined = undefined;
		let itemToClose: TreeviewItemI | undefined = undefined;

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'PageUp':
			case 'PageDown':
			case 'Home':
			case 'End':
			case 'Enter':
			case ' ':
			case 'Escape':
				event.preventDefault();

				switch (event.key) {
					case 'PageUp':
						itemToActivate = (activeItemAncenstry?.at(-1)?.subitems ?? items)?.at(0) ?? null;
						break;
					case 'PageDown':
						itemToActivate = (activeItemAncenstry?.at(-1)?.subitems ?? items)?.at(-1) ?? null;
						break;
					case 'Home':
						itemToActivate = showedItems.at(0)!;
						break;
					case 'End':
						itemToActivate = showedItems.at(-1)!;
						break;
					default:
						switch (event.key) {
							case 'ArrowDown':
								if (!activeItem) {
									itemToActivate = showedItems.at(0)!;
								} else {
									itemToActivate = getNextItemToActivate(activeItem, 'next');
								}
								break;
							case 'ArrowUp':
								if (!activeItem) {
									itemToActivate = showedItems.at(-1)!;
								} else {
									itemToActivate = getNextItemToActivate(activeItem, 'prev');
								}
								break;
							case 'Enter':
							case ' ':
								if (activeItem) {
									if (activeItem.subitems) {
										itemToOpen = activeItem;

										if (itemToOpen.subitems!.at(0)) {
											itemToActivate = itemToOpen.subitems!.at(0)!;
										}
									} else {
										itemToSelect = activeItem;
									}
								}
								break;
							case 'ArrowRight':
								if (!activeItem) {
									itemToActivate = showedItems.at(0)!;
								} else if (activeItem.subitems && !openItemsSet.has(activeItem)) {
									itemToOpen = activeItem;
								} else if (activeItem.subitems) {
									itemToActivate = activeItem.subitems!.at(0)!;
								}
								break;
							case 'ArrowLeft':
								if (!activeItem) {
									itemToActivate = showedItems.at(-1)!;
								} else if (activeItem.subitems && openItemsSet.has(activeItem)) {
									itemToClose = activeItem;
								} else if (activeItemAncenstry && activeItemAncenstry.length > 0) {
									itemToActivate = activeItemAncenstry.at(-1) ?? null;
								}
								break;
						}
						break;
					case 'Escape':
						itemToActivate = null;
						if (openItemsSet.size > 0) {
							closeItems();
						}
						break;
				}

				break;
			default:
				if (event.key.match(printableCharRegex)) {
					temporaryFilter.addChar(event.key);
					const currentMenu = activeItemAncenstry?.at(-1)?.subitems ?? items;
					let itemsToSearchFirst = activeItem
						? currentMenu.slice(currentMenu.indexOf(activeItem) + 1)
						: null;
					let itemsToSearchAfter =
						itemsToSearchFirst && activeItem
							? currentMenu.slice(0, currentMenu.indexOf(activeItem) + 1)
							: currentMenu;
					const filterFn = (item: TreeviewItemI) =>
						item.value.toLowerCase().startsWith(temporaryFilter.filter.toLowerCase());

					if (itemsToSearchFirst) {
						itemToActivate = itemsToSearchFirst.find(filterFn);
					}

					if (!itemToActivate) {
						itemToActivate = itemsToSearchAfter.find(filterFn) ?? activeItem;
					}
				}
				break;
		}

		if (itemToActivate !== undefined) activeItem = itemToActivate;
		if (itemToSelect !== undefined) selectItem(itemToSelect);
		if (itemToOpen) openItem(itemToOpen);
		if (itemToClose) closeItem(itemToClose);

		await tick();
		focusActiveItem();
	}

	function handleClick(event: TreeviewItem['$$events_def']['click']) {
		activeItem = event.detail.treeViewItem;

		if (activeItem.subitems) {
			if (openItemsSet.has(activeItem)) {
				closeItem(activeItem);
			} else {
				openItem(activeItem);
			}
		} else {
			selectItem(activeItem);
		}

		event.detail.originalEvent.stopPropagation();
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<menu
	bind:this={el}
	class="Treeview"
	role="tree"
	tabindex="0"
	on:keydown={handleKeyDown}
	aria-activedescendant={activeItem ? getItemId(activeItem) : ''}
>
	{#each items as treeViewItem}
		<TreeviewItem
			id={getItemId(treeViewItem)}
			{treeViewItem}
			{activeItem}
			{selectedItem}
			openItems={openItemsSet}
			on:click={handleClick}
		/>
	{/each}
</menu>

<style>
	.Treeview {
		display: flex;
		flex-direction: column;
		list-style: none;
		padding: 0;
		margin: 0;
		border-block-end: 1px solid gray;
	}
</style>
