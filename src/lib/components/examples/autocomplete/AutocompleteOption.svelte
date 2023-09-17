<script lang="ts" context="module">
	let count: number = 0;
</script>

<script lang="ts">
	import { getContext } from 'svelte';
	import type { AutocompleteContext } from './Autocomplete.svelte';

	export let id: string = `Autocomplete-${count++}`;

	export let value: string;
	export let disabled: boolean = false;

	let el: HTMLElement;

	const { activeOption$, value$, handleOptionClick } = getContext<AutocompleteContext>('select');

	$: isSelected = $value$ === value;
	$: isActive = $activeOption$ === el;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	bind:this={el}
	{id}
	class="AutocompleteOption"
	class:AutocompleteOption--selected={isSelected}
	class:AutocompleteOption--active={isActive}
	data-value={value}
	role="option"
	aria-selected={isActive}
	aria-disabled={disabled || undefined}
	on:click={(e) => handleOptionClick(e.currentTarget)}
>
	{value}
</li>

<style>
	.AutocompleteOption {
		cursor: pointer;
	}

	.AutocompleteOption:where(:hover) {
		background-color: whitesmoke;
	}

	.AutocompleteOption--selected {
		background-color: lightblue;
	}

	.AutocompleteOption--active {
		background-color: lightgray;
	}
</style>
