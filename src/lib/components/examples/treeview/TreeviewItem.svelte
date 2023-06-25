<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import type { TreeViewContext, TreeviewItemI } from './Treeview.svelte';

	export let id: string;
	export let treeViewItem: TreeviewItemI;
	export let activeItem: TreeviewItemI | null | undefined;
	export let selectedItem: TreeviewItemI | null | undefined;
	export let openItems: Set<TreeviewItemI>;

	const treeViewContext = getContext<TreeViewContext>('treeview');

	const dispatch = createEventDispatcher<{
		click: { treeViewItem: TreeviewItemI; originalEvent: MouseEvent };
		pointerover: { treeViewItem: TreeviewItemI; originalEvent: PointerEvent };
	}>();

	function handlePointerOver(e: PointerEvent, treeViewItem: TreeviewItemI) {
		dispatch('pointerover', { treeViewItem, originalEvent: e });
	}

	function handleClick(e: MouseEvent, treeViewItem: TreeviewItemI) {
		dispatch('click', { treeViewItem, originalEvent: e });
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	{id}
	class="TreeviewItem"
	class:TreeviewItem--active={treeViewItem === activeItem}
	class:TreeviewItem--selected={treeViewItem === selectedItem}
	role="treeitem"
	aria-expanded={treeViewItem.subitems
		? openItems.has(treeViewItem)
			? 'true'
			: 'false'
		: undefined}
	aria-selected={treeViewItem.subitems
		? undefined
		: selectedItem === treeViewItem
		? 'true'
		: 'false'}
	on:pointerover={(e) => handlePointerOver(e, treeViewItem)}
	on:click={(e) => handleClick(e, treeViewItem)}
>
	<span>
		{treeViewItem.value}
		{#if treeViewItem.subitems}
			<span class="Treeview__menuitem-arrow">{'>'}</span>
		{/if}
	</span>
	{#if treeViewItem.subitems}
		<!-- svelte-ignore a11y-no-redundant-roles -->
		<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
		<menu
			class="TreeviewItem__subitems"
			class:TreeviewItem__subitems--open={openItems.has(treeViewItem)}
			role="group"
		>
			{#each treeViewItem.subitems as subitemsitem}
				<svelte:self
					id={treeViewContext.getItemId(subitemsitem)}
					treeViewItem={subitemsitem}
					{activeItem}
					{selectedItem}
					{openItems}
					on:click
					on:pointerover
				/>
			{/each}
		</menu>
	{/if}
</li>

<style>
	.TreeviewItem {
		position: relative;
		cursor: pointer;
		background: lightyellow;
	}

	.TreeviewItem:hover {
		background: lightgoldenrodyellow;
	}

	.TreeviewItem--active {
		background: lightblue;
	}

	.TreeviewItem--selected {
		background: orange;
	}

	.TreeviewItem--selected.TreeviewItem--active {
		background: lightcoral;
	}

	.TreeviewItem--selected:hover {
		background: orangered;
	}

	.TreeviewItem--active:hover {
		background: deepskyblue;
	}

	.TreeviewItem__subitems {
		list-style: none;
		padding: 0 0 0 10px;
		margin: 0;
		top: 100%;
		left: 0;
		border: solid gray;
		border-width: 1px;
		display: none;
		background: lightyellow;
	}

	.TreeviewItem__subitems--open {
		display: block;
	}

	.TreeviewItem__subitems :global(.Treeview__subitems) {
		top: 0;
		left: 100%;
	}
</style>
