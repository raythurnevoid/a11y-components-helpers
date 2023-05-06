<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { open } from '../../../lib/autocomplete/autocomplete.js';

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

	let mapped: MappedDOM | undefined = undefined;

	let canOpenMultipleItems = false;
	let openItems = new Set<MenuItem>();
	let itemPathMap = new Map<MenuItem, number[]>();
	let activeItem: MenuItem | undefined = menuBar.at(0);

	onMount(() => {
		console.log(menuBar);

		function createMappedDOM(menuBar: MenuItem[]) {
			const objRefMap = new WeakMap<Element, any>();
			const domRefMap = new WeakMap<any, Element>();

			const dom = document.implementation.createDocument('', 'menubar', null);

			function convert(el: Element, menu: MenuItem[], path: number[] = []) {
				menu.forEach((menuItem, index) => {
					const virtualDomMenuItem = dom.createElement('menuitem' as string);
					virtualDomMenuItem.setAttribute('value', menuItem.value);
					el.appendChild(virtualDomMenuItem);
					objRefMap.set(virtualDomMenuItem, menuItem);
					domRefMap.set(menuItem, virtualDomMenuItem);
					itemPathMap.set(menuItem, [...path, index]);

					if (menuItem.submenu) {
						const virtualDomMenu = dom.createElement('menu');
						virtualDomMenuItem.appendChild(virtualDomMenu);
						objRefMap.set(virtualDomMenu, menuItem.submenu);
						domRefMap.set(menuItem.submenu, virtualDomMenu);
						convert(virtualDomMenu, menuItem.submenu, [...path, index]);
					}
				});
			}

			const root = dom.firstElementChild!;
			objRefMap.set(root, menuBar);
			domRefMap.set(menuBar, root);
			convert(root, menuBar);

			return new MappedDOM(dom, objRefMap, domRefMap);
		}

		mapped = createMappedDOM(menuBar);
	});

	class MappedDOM {
		canMenuOpen = false;

		constructor(
			public virtualDom: Document,
			private objRefMap: WeakMap<Element, any>,
			private domRefMap: WeakMap<any, Element>
		) {}

		getDom(obj: any) {
			return this.domRefMap.get(obj);
		}

		getObj(el: Element) {
			return this.objRefMap.get(el);
		}

		navigate(event: KeyboardEvent): boolean {
			let isToHandle: boolean = false;
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
					isToHandle = true;
					event.preventDefault();
					break;
				default:
					return false;
			}

			if (!activeItem) {
				return false;
			}

			const activeItemPath = itemPathMap.get(activeItem)!;
			const isActiveElInMenuBar = activeItemPath.length === 1;
			let itemToActivate: MenuItem | null = null;
			let itemToOpen: MenuItem | null = null;

			if (event.key === 'Escape') {
				itemToActivate = menuBar.at(activeItemPath.at(0)!)!;
			} else if (isActiveElInMenuBar) {
				switch (event.key) {
					case 'ArrowUp':
					case 'ArrowDown':
					case 'Enter':
					case ' ':
						if (activeItem.submenu) {
							itemToOpen = activeItem;
						}
						break;
				}

				switch (event.key) {
					case 'ArrowRight':
						itemToActivate = menuBar.at(activeItemPath.at(0)! + 1)!;
						break;
					case 'ArrowLeft':
						itemToActivate = menuBar.at(activeItemPath.at(0)! - 1)!;
						break;
					case 'ArrowDown':
					case 'Enter':
					case ' ':
						if (itemToOpen && itemToOpen.submenu!.at(0)) {
							itemToActivate = itemToOpen.submenu!.at(0)!;
						}
						break;
					case 'ArrowUp':
						if (itemToOpen && itemToOpen.submenu!.at(-1)) {
							itemToActivate = itemToOpen.submenu!.at(-1)!;
						}
						break;
				}

				switch (event.key) {
					case 'ArrowRight':
					case 'ArrowLeft':
						if (openItems.size > 0) {
							openItems.clear();
							openItems = openItems;
						}
						if (itemToActivate && this.canMenuOpen) {
							if (itemToActivate.submenu) {
								itemToOpen = itemToActivate;
							}
						}
				}
			} else {
				switch (event.key) {
					case 'ArrowDown':
						itemToActivate =
							this.getItemFromPath([...activeItemPath.slice(0, -1), activeItemPath.at(-1)! + 1]) ??
							null;
						break;
					case 'ArrowUp':
						itemToActivate =
							this.getItemFromPath([...activeItemPath.slice(0, -1), activeItemPath.at(-1)! - 1]) ??
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
							itemToActivate = itemToOpen = menuBar.at(activeItemPath.at(0)! + 1) ?? null;
						}
						break;
					case 'ArrowLeft':
						if (activeItemPath.length > 2) {
							itemToActivate = this.getItemFromPath(activeItemPath.slice(0, -1)) ?? null;
							itemToOpen = this.getItemFromPath(activeItemPath.slice(0, -2)) ?? null;
						} else {
							itemToActivate = menuBar.at(activeItemPath.at(0)! - 1) ?? null;
							if (itemToActivate && this.canMenuOpen && itemToActivate.submenu) {
								itemToOpen = itemToActivate;
							}
						}
						break;
				}
			}

			switch (event.key) {
				case 'Home':
					itemToActivate = this.getItemFromPath([...activeItemPath.slice(0, -1), 0]) ?? null;
					break;
				case 'End':
					itemToActivate = this.getItemFromPath([...activeItemPath.slice(0, -1), -1]) ?? null;
					break;
			}

			if (itemToOpen) {
				this.openMenuFromItem(itemToOpen);
			} else if (event.key === 'Escape') {
				openItems.clear();
				openItems = openItems;
				this.canMenuOpen = false;
			}

			return true;
		}

		private getItemFromPath(path: number[]) {
			let pointer: MenuItem | undefined = undefined;
			for (const index of path) {
				if (!pointer) {
					pointer = menuBar.at(index);
				} else {
					pointer = pointer.submenu?.at(index);
				}

				if (!pointer) {
					break;
				}
			}

			return pointer;
		}

		openMenuFromItem(itemToOpen: MenuItem) {
			openItems.clear();
			const itemToOpenPath = itemPathMap.get(itemToOpen)!;
			let pointer: MenuItem | undefined = undefined;
			for (const index of itemToOpenPath) {
				if (!pointer) {
					pointer = menuBar.at(index);
				} else {
					pointer = pointer.submenu?.at(index);
				}

				if (!pointer) {
					break;
				}

				openItems.add(pointer);
			}
			openItems = openItems;
			this.canMenuOpen = true;
		}

		closeAllMenus() {
			openItems.clear();
			openItems = openItems;
		}
	}

	async function handleKeyDown(event: KeyboardEvent) {
		const mutated = mapped!.navigate(event);
		if (mutated) {
			mapped = mapped;
		}

		await tick();
		activeItem?.el.focus();
	}

	async function handlePointerOver(event: PointerEvent, item: MenuItem) {
		activeItem = item;
		if (menuBarEl.contains(document.activeElement)) {
			mapped?.openMenuFromItem(item);
			mapped = mapped;
			await tick();
			activeItem?.el.focus();
		}
	}

	function handleFocusOut(event: FocusEvent) {
		if (!document.hasFocus() || menuBarEl?.contains(event.relatedTarget as Element)) {
			return;
		}

		mapped?.closeAllMenus();
		mapped = mapped;
	}

	function handleClick(event: MouseEvent, item: MenuItem) {
		activeItem = item;
		if (menuBarEl.contains(document.activeElement)) {
			mapped?.openMenuFromItem(item);
			mapped = mapped;
		}
	}

	// function openItem(item: MenuItem) {
	// 	this.closeVirtualDomMenuAtItemLevel(itemEl);
	// 	if (itemEl.firstElementChild) {
	// 		this.openVirtualDomMenu(itemEl.firstElementChild);
	// 	}
	// }

	interface MenuItem {
		value: string;
		el: HTMLElement;
		submenu?: MenuItem[];
	}
</script>

{JSON.stringify(openItems)}

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
			{#if menuitem.submenu && mapped}
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
