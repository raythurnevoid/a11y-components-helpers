<script lang="ts">
	import { onMount } from 'svelte';

	const initMenuBar = [
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
	] as Partial<MenuItem>[];

	let mapped: MappedDOM | undefined = undefined;

	onMount(() => {
		console.log(initMenuBar);

		function createMappedDOM(initMenuBar: Partial<MenuItem>[]) {
			const objRefMap = new WeakMap<Element, object>();
			const domRefMap = new WeakMap<object, Element>();

			const dom = document.implementation.createDocument('', 'menubar', null);
			const menuBar = [] as MenuItem[];

			let firstMenuItemHandled = false;

			function convert(el: Element, value: any) {
				JSON.stringify(value, (key, value) => {
					const isMenuItem = Object.hasOwn(value, 'value');

					if (isMenuItem) {
						const objMenuItem = Object.assign(
							{
								tabindex: -1
							},
							value
						) as MenuItem;
						const menuItem = dom.createElement('menuitem' as string);
						menuItem.setAttribute('value', value.value);

						if (!firstMenuItemHandled) {
							menuItem.classList.add('tabbable');
							objMenuItem.tabindex = 0;
						}

						el.appendChild(menuItem);
						menuBar.push(objMenuItem);
						objRefMap.set(menuItem, objMenuItem);
						domRefMap.set(objMenuItem, menuItem);

						if (value.submenu && objMenuItem.submenu) {
							const menu = dom.createElement('menu');
							menuItem.appendChild(menu);
							objRefMap.set(menu, objMenuItem.submenu);
							domRefMap.set(objMenuItem.submenu, menu);
							convert(menu, value.submenu);
							return;
						}
					}

					return value;
				});
			}

			const root = dom.firstElementChild!;
			objRefMap.set(root, initMenuBar);
			domRefMap.set(initMenuBar, root);
			convert(root, initMenuBar);

			return new MappedDOM(dom, menuBar, objRefMap, domRefMap);
		}

		mapped = createMappedDOM(initMenuBar);

		console.log(mapped.virtualDomMenuBar);
		console.log(mapped.getObj(mapped.virtualDomMenuBar.children[1]!.firstElementChild!));
		console.log(mapped.getDom(initMenuBar[2]!));

		mapped.tabbableMenuItem;
	});

	class MappedDOM {
		constructor(
			public virtualDom: Document,
			public menuBar: MenuItem[],
			private objRefMap: WeakMap<Element, object>,
			private domRefMap: WeakMap<object, Element>
		) {}

		get virtualDomMenuBar() {
			return this.virtualDom.firstElementChild!;
		}

		get tabbableMenuItem() {
			let firstTabbable = this.virtualDomMenuBar.getElementsByClassName('tabbable')[0];

			if (!firstTabbable) {
				firstTabbable = this.virtualDomMenuBar.firstElementChild ?? undefined;
				firstTabbable?.classList.add('tabbable');
			}

			return firstTabbable ? this.getObj(firstTabbable) : undefined;
		}

		getDom(obj: object) {
			return this.domRefMap.get(obj);
		}

		getObj(el: Element) {
			return this.objRefMap.get(el);
		}
	}

	interface MenuItem {
		value: string;
		tabindex: number;
		submenu?: MenuItem[];
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<menu class="MenuBar" role="menubar">
	{#each initMenuBar as menuitem}
		{@const tabbableMenuItem = mapped ? mapped.tabbableMenuItem : initMenuBar[0]}
		<li class="MenuBar__li" role="none">
			<button
				class="MenuBar__menuitem"
				role="menuitem"
				type="button"
				tabindex={menuitem === tabbableMenuItem ? 0 : -1}
			>
				{menuitem.value}
			</button>
			{#if menuitem.submenu && mapped}
				<!-- svelte-ignore a11y-no-redundant-roles -->
				<menu class="MenuBar__submenu" role="menu">
					{#each menuitem.submenu as submenuitem}
						<li class="MenuBar__li" role="none">
							<button class="MenuBar__menuitem" role="menuitem" type="button" tabindex="-1">
								{submenuitem.value}
							</button>
							{#if submenuitem.submenu}
								<!-- This should be a recursive component but for the sake of the example all the depths are declared here -->
								<!-- svelte-ignore a11y-no-redundant-roles -->
								<menu class="MenuBar__submenu" role="menu">
									{#each submenuitem.submenu as subsubmenuitem}
										<li class="MenuBar__li" role="none">
											<button class="MenuBar__menuitem" role="menuitem" type="button" tabindex="-1">
												{subsubmenuitem.value}
												<span class="MenuBar__menuitem-arrow">{'>'}</span>
											</button>
											{#if subsubmenuitem.submenu}
												<!-- svelte-ignore a11y-no-redundant-roles -->
												<menu class="MenuBar__submenu" role="menu">
													{#each subsubmenuitem.submenu as subsubsubmenuitem}
														<li class="MenuBar__li" role="none">
															<button
																class="MenuBar__menuitem"
																role="menuitem"
																type="button"
																tabindex="-1"
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
	}

	.MenuBar__submenu .MenuBar__submenu {
		top: 0;
		left: 100%;
	}
</style>
