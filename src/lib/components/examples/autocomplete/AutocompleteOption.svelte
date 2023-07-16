<script lang="ts" context="module">
	let count: number = 0;
</script>

<script lang="ts">
	import { getContext } from 'svelte';
	import type { AutocompleteContext } from './Autocomplete.svelte';

	export let id: string = `Autocomplete-${count++}`;

	export let value: string;
	export let disabled: boolean = false;

	const { activeOption$, value$, handleOptionClick } = getContext<AutocompleteContext>('select');
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	{id}
	class="Autocomplete"
	class:Autocomplete--active={$activeOption$ === value}
	class:Autocomplete--selected={$value$ === value}
	data-value={value}
	role="option"
	aria-selected={$activeOption$ === value}
	aria-disabled={disabled}
	on:click={(e) => handleOptionClick(e.currentTarget)}
>
	{value}
</li>

<style>
	.Autocomplete {
		cursor: pointer;
	}

	.Autocomplete:where(:hover) {
		background-color: whitesmoke;
	}

	.Autocomplete--selected {
		background-color: lightblue;
	}

	.Autocomplete--active {
		background-color: lightgray;
	}
</style>
