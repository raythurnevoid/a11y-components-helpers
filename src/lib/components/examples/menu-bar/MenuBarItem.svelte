<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MenuItem } from './MenuBar.svelte';

	export let menuItem: MenuItem;
	export let activeItem: MenuItem;
	export let openItems: Set<MenuItem>;

	const dispatch = createEventDispatcher<{
		click: { menuItem: MenuItem };
		pointerover: { menuItem: MenuItem };
	}>();

	function handlePointerOver(e: PointerEvent, menuItem: MenuItem) {
		dispatch('pointerover', { menuItem });
	}

	function handleClick(e: MouseEvent, menuItem: MenuItem) {
		dispatch('click', { menuItem });
	}
</script>

<li class="MenuBar__li" role="none">
	<button
		bind:this={menuItem.el}
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
