<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MenuItem } from './MenuBar.svelte';

	export let menuItem: MenuItem;
	export let activeItem: MenuItem | undefined;
	export let openItems: Set<MenuItem>;

	const dispatch = createEventDispatcher<{
		click: { menuItem: MenuItem; originalEvent: MouseEvent };
		pointerover: { menuItem: MenuItem; originalEvent: PointerEvent };
	}>();

	function handlePointerOver(e: PointerEvent, menuItem: MenuItem) {
		dispatch('pointerover', { menuItem, originalEvent: e });
	}

	function handleClick(e: MouseEvent, menuItem: MenuItem) {
		dispatch('click', { menuItem, originalEvent: e });
	}
</script>

<li class="MenuBar__li" role="none">
	<button
		class="MenuBar__menuitem"
		class:MenuBar__menuitem--active={menuItem === activeItem}
		role="menuitem"
		type="button"
		tabindex={menuItem === activeItem ? 0 : -1}
		aria-haspopup={menuItem.submenu ? 'menu' : undefined}
		aria-expanded={menuItem.submenu ? (openItems.has(menuItem) ? 'true' : 'false') : undefined}
		on:pointerover={(e) => handlePointerOver(e, menuItem)}
		on:click={(e) => handleClick(e, menuItem)}
	>
		{menuItem.value}
		{#if menuItem.submenu}
			<span class="MenuBar__menuitem-arrow">{'>'}</span>
		{/if}
	</button>
	{#if menuItem.submenu}
		<!-- svelte-ignore a11y-no-redundant-roles -->
		<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
		<menu
			class="MenuBar__submenu"
			class:MenuBar__submenu--open={openItems.has(menuItem)}
			role="menu"
		>
			{#each menuItem.submenu as submenuitem}
				<svelte:self menuItem={submenuitem} {activeItem} {openItems} />
			{/each}
		</menu>
	{/if}
</li>

<style>
	.MenuBar__li {
		position: relative;
	}

	.MenuBar__menuitem {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		width: 100%;
		white-space: nowrap;
		appearance: none;
		background: none;
		border: none;
		padding: 8px 16px;
	}

	.MenuBar__menuitem:hover:not(:focus-visible) {
		outline: 1px solid black;
	}

	.MenuBar__submenu {
		position: absolute;
		list-style: none;
		padding: 0;
		margin: 0;
		top: 100%;
		left: 0;
		background: lightcoral;
		border: solid gray;
		border-width: 1px;
		display: none;
	}

	.MenuBar__submenu--open {
		display: block;
	}

	.MenuBar__submenu :global(.MenuBar__submenu) {
		top: 0;
		left: 100%;
	}
</style>
