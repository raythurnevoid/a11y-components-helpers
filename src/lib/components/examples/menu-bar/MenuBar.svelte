<script lang="ts">
	import { tick } from 'svelte';

	let menuBarEl: HTMLElement;

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

	let canOpenMultipleItems = false;
	let openItems = new Set<MenuItem>();
	let itemPathMap = new Map<MenuItem, number[]>();
	let activeItem: MenuItem | undefined = menuBar.at(0);
	let canMenuOpen = false;

	(function mapItemsId(items: MenuItem[], path: number[] = []) {
		items.forEach((item, i) => {
			itemPathMap.set(item, [...path, i]);

			if (item.submenu) {
				mapItemsId(item.submenu, [...path, i]);
			}
		});
	})(menuBar);

	function digThroughItems(path: number[], cb?: (item: MenuItem, index: number) => void) {
		let pointer: MenuItem | undefined = path.length ? menuBar.at(path.at(0)!) : undefined;
		if (pointer) {
			for (let i = 0; i < path.length; i++) {
				if (i > 0) {
					const index = path.at(i)!;
					pointer = pointer.submenu?.at(index);
				}
				if (!pointer) break;
				cb?.(pointer, i);
			}
		}

		return pointer;
	}

	function openItem(itemToOpen: MenuItem) {
		openItems.clear();
		const itemToOpenPath = itemPathMap.get(itemToOpen)!;

		digThroughItems(itemToOpenPath, (pointer) => {
			openItems.add(pointer);
		});

		openItems = openItems;
		canMenuOpen = true;
	}

	async function handleKeyDown(event: KeyboardEvent) {
		if (!activeItem) {
			return;
		}

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
				const isActiveElInMenuBar = activeItemPath.length === 1;
				let itemToActivate: MenuItem | null = null;
				let itemToOpen: MenuItem | null = null;

				switch (event.key) {
					case 'Escape':
						itemToActivate = menuBar.at(activeItemPath.at(0)!)!;
						if (openItems.size > 0) {
							openItems.clear();
							openItems = openItems;
						}
						canMenuOpen = false;
						break;
					case 'Home':
						itemToActivate = digThroughItems([...activeItemPath.slice(0, -1), 0]) ?? null;
						break;
					case 'End':
						itemToActivate = digThroughItems([...activeItemPath.slice(0, -1), -1]) ?? null;
						break;
					default:
						if (isActiveElInMenuBar) {
							switch (event.key) {
								case 'ArrowRight':
								case 'ArrowLeft':
									if (event.key === 'ArrowRight') {
										itemToActivate =
											menuBar.at(activeItemPath.at(0)! + 1) ?? menuBar.at(0)! ?? null;
									} else {
										itemToActivate = menuBar.at(activeItemPath.at(0)! - 1) ?? null;
									}

									if (openItems.size > 0) {
										openItems.clear();
										openItems = openItems;
									}

									if (canMenuOpen && itemToActivate?.submenu) {
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
										digThroughItems([...activeItemPath.slice(0, -1), activeItemPath.at(-1)! + 1]) ??
										digThroughItems([...activeItemPath.slice(0, -1), 0]) ??
										null;
									break;
								case 'ArrowUp':
									itemToActivate =
										digThroughItems([...activeItemPath.slice(0, -1), activeItemPath.at(-1)! - 1]) ??
										null;
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
										itemToActivate = itemToOpen =
											menuBar.at(activeItemPath.at(0)! + 1) ?? menuBar.at(0) ?? null;
									}
									break;
								case 'ArrowLeft':
									if (activeItemPath.length > 2) {
										itemToActivate = digThroughItems(activeItemPath.slice(0, -1)) ?? null;
										itemToOpen = digThroughItems(activeItemPath.slice(0, -2)) ?? null;
									} else {
										itemToActivate = menuBar.at(activeItemPath.at(0)! - 1) ?? null;
										if (itemToActivate && canMenuOpen && itemToActivate.submenu) {
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
		}

		await tick();
		activeItem?.el.focus();
	}

	async function handlePointerOver(event: PointerEvent, item: MenuItem) {
		activeItem = item;
		if (menuBarEl.contains(document.activeElement)) {
			openItem(item);
			await tick();
			activeItem?.el.focus();
		}
	}

	function handleFocusOut(event: FocusEvent) {
		if (!document.hasFocus() || menuBarEl?.contains(event.relatedTarget as Element)) {
			return;
		}

		openItems.clear();
		openItems = openItems;
	}

	function handleClick(event: MouseEvent, item: MenuItem) {
		activeItem = item;
		if (menuBarEl.contains(document.activeElement)) {
			openItem(item);
		}
	}

	interface MenuItem {
		value: string;
		el: HTMLElement;
		submenu?: MenuItem[];
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<menu
	bind:this={menuBarEl}
	class="MenuBar"
	role="menubar"
	on:keydown={handleKeyDown}
	on:focusout={handleFocusOut}
>
	{#each menuBar as menuitem}
		<li class="MenuBar__li" role="none">
			<button
				bind:this={menuitem.el}
				class="MenuBar__menuitem"
				class:MenuBar__menuitem--active={menuitem === activeItem}
				role="menuitem"
				type="button"
				tabindex={menuitem === activeItem ? 0 : -1}
				on:pointerover={(e) => handlePointerOver(e, menuitem)}
				on:click={(e) => handleClick(e, menuitem)}
			>
				{menuitem.value}
			</button>
			{#if menuitem.submenu}
				<!-- svelte-ignore a11y-no-redundant-roles -->
				<menu
					class="MenuBar__submenu"
					class:MenuBar__submenu--open={openItems.has(menuitem)}
					role="menu"
				>
					{#each menuitem.submenu as submenuitem}
						<li class="MenuBar__li" role="none">
							<button
								bind:this={submenuitem.el}
								class="MenuBar__menuitem"
								role="menuitem"
								type="button"
								tabindex={submenuitem === activeItem ? 0 : -1}
								on:pointerover={(e) => handlePointerOver(e, submenuitem)}
								on:click={(e) => handleClick(e, submenuitem)}
							>
								{submenuitem.value}

								{#if submenuitem.submenu}
									<span class="MenuBar__menuitem-arrow">{'>'}</span>
								{/if}
							</button>
							{#if submenuitem.submenu}
								<!-- This should be a recursive component but for the sake of the example all the depths are declared here -->
								<!-- svelte-ignore a11y-no-redundant-roles -->
								<menu
									class="MenuBar__submenu"
									class:MenuBar__submenu--open={openItems.has(submenuitem)}
									role="menu"
								>
									{#each submenuitem.submenu as subsubmenuitem}
										<li class="MenuBar__li" role="none">
											<button
												bind:this={subsubmenuitem.el}
												class="MenuBar__menuitem"
												role="menuitem"
												type="button"
												tabindex={subsubmenuitem === activeItem ? 0 : -1}
												on:pointerover={(e) => handlePointerOver(e, subsubmenuitem)}
												on:click={(e) => handleClick(e, subsubmenuitem)}
											>
												{subsubmenuitem.value}
												{#if subsubmenuitem.submenu}
													<span class="MenuBar__menuitem-arrow">{'>'}</span>
												{/if}
											</button>
											{#if subsubmenuitem.submenu}
												<!-- svelte-ignore a11y-no-redundant-roles -->

												<menu
													class="MenuBar__submenu"
													class:MenuBar__submenu--open={openItems.has(subsubmenuitem)}
													role="menu"
												>
													{#each subsubmenuitem.submenu as subsubsubmenuitem}
														<li class="MenuBar__li" role="none">
															<button
																bind:this={subsubsubmenuitem.el}
																class="MenuBar__menuitem"
																role="menuitem"
																type="button"
																tabindex={menuitem === activeItem ? 0 : -1}
																on:pointerover={(e) => handlePointerOver(e, subsubsubmenuitem)}
																on:click={(e) => handleClick(e, subsubsubmenuitem)}
															>
																{subsubsubmenuitem.value}
															</button>
														</li>
													{/each}
												</menu>
											{/if}
										</li>
									{/each}
								</menu>
							{/if}
						</li>
					{/each}
				</menu>
			{/if}
		</li>
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

	.MenuBar__submenu .MenuBar__submenu {
		top: 0;
		left: 100%;
	}
</style>
