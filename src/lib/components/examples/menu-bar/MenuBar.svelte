<script lang="ts">
	import { onMount, tick } from 'svelte';

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

	let hoverEl: Element | undefined = undefined;

	onMount(() => {
		console.log(menuBar);

		function createMappedDOM(menuBar: MenuItem[]) {
			const objRefMap = new WeakMap<Element, any>();
			const domRefMap = new WeakMap<any, Element>();

			const dom = document.implementation.createDocument('', 'menubar', null);

			function convert(el: Element, menu: MenuItem[]) {
				menu.forEach((menuItem) => {
					const virtualDomMenuItem = dom.createElement('menuitem' as string);
					virtualDomMenuItem.setAttribute('value', menuItem.value);
					el.appendChild(virtualDomMenuItem);
					objRefMap.set(virtualDomMenuItem, menuItem);
					domRefMap.set(menuItem, virtualDomMenuItem);

					if (menuItem.submenu) {
						const virtualDomMenu = dom.createElement('menu');
						virtualDomMenuItem.appendChild(virtualDomMenu);
						objRefMap.set(virtualDomMenu, menuItem.submenu);
						domRefMap.set(menuItem.submenu, virtualDomMenu);
						convert(virtualDomMenu, menuItem.submenu);
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

		console.log(mapped.virtualDomMenuBar);
		console.log(mapped.getObj(mapped.virtualDomMenuBar.children[1]!.firstElementChild!));
		console.log(mapped.getDom(menuBar[2]!));

		mapped.focusableMenuItem;
	});

	class MappedDOM {
		canMenuOpen = false;

		constructor(
			public virtualDom: Document,
			private objRefMap: WeakMap<Element, any>,
			private domRefMap: WeakMap<any, Element>
		) {}

		get virtualDomMenuBar() {
			return this.virtualDom.firstElementChild!;
		}

		get virtualDomFocusableMenuItem() {
			let focusable = this.virtualDomMenuBar.getElementsByClassName('focusable')[0] ?? null;

			if (!focusable) {
				focusable = this.virtualDomMenuBar.firstElementChild;
				focusable?.classList.add('focusable');
			}

			return focusable;
		}

		get focusableMenuItem() {
			const focusable = this.virtualDomFocusableMenuItem;
			return focusable ? this.getObj(focusable) : undefined;
		}

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

			let activeEl = this.virtualDomFocusableMenuItem;

			if (!activeEl) {
				return false;
			}

			const isActiveElInMenuBar = activeEl.parentElement === this.virtualDomMenuBar;
			let elToActivate: Element | null = null;
			let menuElToOpen: Element | null = null;

			if (event.key === 'Escape') {
				elToActivate = activeEl.closest('menubar > menuitem');
			} else if (isActiveElInMenuBar) {
				switch (event.key) {
					case 'ArrowUp':
					case 'ArrowDown':
					case 'Enter':
					case ' ':
						menuElToOpen = activeEl.firstElementChild;
						break;
				}

				switch (event.key) {
					case 'ArrowRight':
						elToActivate = activeEl.nextElementSibling;
						break;
					case 'ArrowLeft':
						elToActivate = activeEl.previousElementSibling;
						break;
					case 'ArrowDown':
					case 'Enter':
					case ' ':
						if (menuElToOpen) {
							elToActivate = menuElToOpen.firstElementChild;
						}
						break;
					case 'ArrowUp':
						if (menuElToOpen) {
							elToActivate = activeEl.previousElementSibling;
						}
						break;
				}
			} else {
				switch (event.key) {
					case 'ArrowRight':
					case 'Enter':
					case ' ':
						menuElToOpen = activeEl.firstElementChild;
						break;
				}

				switch (event.key) {
					case 'ArrowDown':
						elToActivate = activeEl.nextElementSibling;
						break;
					case 'ArrowUp':
						elToActivate = activeEl.previousElementSibling;
						break;
					case 'ArrowRight':
					case 'Enter':
					case ' ':
						if (menuElToOpen) {
							elToActivate = menuElToOpen.firstElementChild;
						}
						break;
					case 'ArrowLeft':
						elToActivate = activeEl.closest('menu menuitem:has(:scope)');
						break;
				}
			}

			switch (event.key) {
				case 'Home':
					elToActivate = activeEl.parentElement?.firstElementChild ?? null;
					break;
				case 'End':
					elToActivate = activeEl.parentElement?.lastElementChild ?? null;
					break;
			}

			if (!menuElToOpen) {
				switch (event.key) {
					case 'ArrowRight':
					case 'ArrowLeft':
						const highestMenuItemElFromActiveEl = activeEl.closest('menubar > menuitem')!;

						if (!isActiveElInMenuBar && !elToActivate) {
							switch (event.key) {
								case 'ArrowRight':
									elToActivate = highestMenuItemElFromActiveEl.nextElementSibling;
									break;
								case 'ArrowLeft':
									elToActivate = highestMenuItemElFromActiveEl.previousElementSibling;
									break;
							}
						}

						if (elToActivate && this.canMenuOpen) {
							this.closeAllVirtualDomMenus(activeEl);
							menuElToOpen = elToActivate.firstElementChild;
						}

						break;
				}
			}

			if (menuElToOpen) {
				this.openVirtualDomMenu(menuElToOpen);
				this.canMenuOpen = true;
			} else if (event.key === 'Escape') {
				this.closeAllVirtualDomMenus();
				this.canMenuOpen = false;
			}

			if (elToActivate) {
				if (event.key === 'ArrowLeft') {
					const activeElMenu = activeEl.parentElement;
					if (activeElMenu) {
						this.closeVirtualDomMenu(activeElMenu);
					}
				}

				activeEl.classList.remove('focusable');
				activeEl = elToActivate;
				activeEl.classList.add('focusable');
			}

			return true;
		}

		private openVirtualDomMenu(el: Element) {
			this.closeVirtualDomMenuAtItemLevel(el.parentElement!);
			el.classList.add('open');
		}

		private closeVirtualDomMenuAtItemLevel(el: Element) {
			const allSameMenuAtCurrentLevel = el.parentElement?.querySelectorAll('menuitem > menu');
			if (allSameMenuAtCurrentLevel) {
				for (let menu of allSameMenuAtCurrentLevel) {
					this.closeVirtualDomMenu(menu);
				}
			}
		}

		private closeVirtualDomMenu(el: Element) {
			let activeEl = el.getElementsByClassName('focusable')[0];
			if (activeEl) {
				activeEl.classList.remove('focusable');
				let elToActivate =
					activeEl.closest('menuitem:has(:scope)') ?? activeEl.closest('menubar > menuitem');
				if (elToActivate) {
					elToActivate.classList.add('focusable');
				}
			}

			el.classList.remove('open');
		}

		private closeAllVirtualDomMenus(menu?: Element) {
			const menus = (menu ?? this.virtualDomMenuBar).querySelectorAll('menu');
			if (menus) {
				for (let menu of menus) {
					this.closeVirtualDomMenu(menu);
				}
			}
		}

		isMenuOpen(menu: MenuItem[]) {
			return this.domRefMap.get(menu)?.classList.contains('open');
		}

		openMenuFromItem(item: MenuItem) {
			const itemEl = this.domRefMap.get(item);
			if (!itemEl) {
				return;
			}

			this.closeVirtualDomMenuAtItemLevel(itemEl);
			if (itemEl.firstElementChild) {
				this.openVirtualDomMenu(itemEl.firstElementChild);
			}
		}

		openMenu(menu: MenuItem[]) {
			const el = this.domRefMap.get(menu);
			if (el) {
				this.openVirtualDomMenu(el);
			}
		}

		closeAllMenus() {
			this.closeAllVirtualDomMenus();
		}

		setActive(elToActivate: MenuItem) {
			let activeEl = this.virtualDomFocusableMenuItem;
			activeEl?.classList.remove('focusable');
			activeEl = this.domRefMap.get(elToActivate) ?? null;
			activeEl?.classList.add('focusable');
		}
	}

	async function handleKeyDown(event: KeyboardEvent) {
		const mutated = mapped!.navigate(event);
		if (mutated) {
			mapped = mapped;
		}

		await tick();
		mapped?.focusableMenuItem.el.focus();
	}

	async function handlePointerOver(event: PointerEvent, item: MenuItem) {
		mapped?.setActive(item);
		if (menuBarEl.contains(document.activeElement)) {
			mapped?.openMenuFromItem(item);
			mapped = mapped;
			await tick();
			mapped?.focusableMenuItem.el.focus();
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
		mapped?.setActive(item);
		if (menuBarEl.contains(document.activeElement)) {
			mapped?.openMenuFromItem(item);
			mapped = mapped;
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
		{@const activeItem = mapped ? mapped.focusableMenuItem : menuBar[0]}
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
					class:MenuBar__submenu--open={mapped.isMenuOpen(menuitem.submenu)}
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
									class:MenuBar__submenu--open={mapped.isMenuOpen(submenuitem.submenu)}
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
													class:MenuBar__submenu--open={mapped.isMenuOpen(subsubmenuitem.submenu)}
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
