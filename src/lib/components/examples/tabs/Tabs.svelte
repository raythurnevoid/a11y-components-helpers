<script lang="ts" context="module">
	let index: number = 0;
</script>

<script lang="ts">
	let id: string = `Tabs--${index++}`;
	let labelId: string = `${id}__label`;

	let tabs = ['tab-1', 'tab-2', 'tab-3'] as const;
	let selectedTab: (typeof tabs)[number] | '' = tabs[0];
	let activeTab: (typeof tabs)[number] | '' = selectedTab ?? '';

	function getTabId(tab: string) {
		return `${id}__${tab}`;
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
			case 'Home':
			case 'End':
			case 'Enter':
			case ' ':
				event.preventDefault();

				switch (event.key) {
					case 'ArrowLeft':
					case 'ArrowUp':
					case 'ArrowRight':
					case 'ArrowDown':
					case 'Home':
					case 'End':
						const activeTabIndex = activeTab ? tabs.indexOf(activeTab) : -1;
						switch (event.key) {
							case 'ArrowLeft':
							case 'ArrowUp':
								activeTab = tabs.at(activeTabIndex - 1) ?? tabs.at(tabs.length - 1)!;
								break;
							case 'ArrowRight':
							case 'ArrowDown':
								activeTab = tabs.at(activeTabIndex + 1) ?? tabs.at(0)!;
								break;
							case 'Home':
								activeTab = tabs.at(0)!;
								break;
							case 'End':
								activeTab = tabs.at(tabs.length - 1)!;
								break;
						}
						break;
					default:
						if (activeTab !== selectedTab) {
							selectedTab = activeTab;
						}
						break;
				}
		}
	}
</script>

<h1 id={labelId}>Tabs</h1>
<div
	{id}
	class="Tabs"
	tabindex="0"
	role="tablist"
	aria-labelledby={labelId}
	aria-activedescendant={getTabId(activeTab)}
	on:keydown={handleKeyDown}
>
	{#each tabs as tab}
		<button
			id={getTabId(tab)}
			class="Tabs__tab"
			class:Tabs__tab--active={tab === activeTab}
			role="tab"
			aria-selected={tab === selectedTab}
			aria-controls={getTabId(tab)}
			tabindex="-1"
		>
			{tab}
		</button>
	{/each}
</div>
{#each tabs as tab}
	<div
		id={getTabId(tab)}
		class="Tabs__panel"
		role="tabpanel"
		aria-labelledby={getTabId(tab)}
		hidden={tab !== selectedTab}
		tabindex="0"
	>
		{tab}
	</div>
{/each}

<style>
	.Tabs {
		display: flex;
	}

	.Tabs__tab {
		flex: 0 0 auto;
		background-color: gray;
		color: white;
		border-style: solid;
		border-width: 2px;
		border-color: black;
		cursor: pointer;
	}

	.Tabs__tab:hover {
		background-color: darkgray;
	}

	.Tabs:focus .Tabs__tab--active:not(:hover) {
		background-color: dimgray;
	}

	.Tabs:focus .Tabs__tab[aria-selected='true'].Tabs__tab--active:not(:hover) {
		background-color: whitesmoke;
	}

	.Tabs__tab[aria-selected='true'] {
		background-color: white;
		color: black;
		border-color: red;
		border-block-end-width: 0;
	}

	.Tabs__tab[aria-selected='true']:hover {
		background-color: lightgray;
	}
</style>
