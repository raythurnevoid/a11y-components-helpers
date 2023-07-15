<script lang="ts" context="module">
	let count: number = 0;
</script>

<script lang="ts">
	import { getContext } from 'svelte';
	import type { SelectContext } from './Select.svelte';

	export let id: string = `SelectOption-${count++}`;

	export let value: string;
	export let disabled: boolean = false;

	const { activeOption$, value$, handleOptionClick } = getContext<SelectContext>('select');
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	{id}
	class="SelectOption"
	class:SelectOption--active={$activeOption$ === value}
	class:SelectOption--selected={$value$ === value}
	data-value={value}
	role="option"
	aria-selected={$activeOption$ === value}
	aria-disabled={disabled}
	on:click={(e) => handleOptionClick(e.currentTarget)}
>
	{value}
</li>

<style>
	.SelectOption {
		cursor: pointer;
	}

	.SelectOption:where(:hover) {
		background-color: whitesmoke;
	}

	.SelectOption--selected {
		background-color: lightblue;
	}

	.SelectOption--active {
		background-color: lightgray;
	}
</style>
