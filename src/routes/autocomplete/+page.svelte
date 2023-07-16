<script lang="ts">
	import * as api from './suggestions.js';
	import Autocomplete, {
		AutocompleteOption
	} from '$lib/components/examples/autocomplete/Autocomplete.svelte';
	import { debounce } from '../../lib/debounce.js';

	let value: string = '';
	let selectedValue: string = value;
	let suggestions: string[] | undefined = undefined;

	let cachedFilter: string | undefined = undefined;
	let errorMessage: string | null = null;
	let loading: boolean = false;

	async function computeOptions(filter: string | undefined) {
		try {
			if (filter === cachedFilter) return false;

			errorMessage = null;

			loading = true;

			const checkIfOverlap = await debounce({
				key: computeOptions,
				delay: 300
			});

			const response = await api.fetchSuggestions(filter ?? '');
			if (checkIfOverlap()) return false;

			if (response.status === 404) {
				loading = false;
				throw new Error('No results found');
			} else if (response.status >= 500) {
				throw new Error('Error fetching results', {
					cause: response.body
				});
			}

			const responseBody = await response.json();

			loading = false;
			cachedFilter = filter;
			suggestions = responseBody;

			return responseBody.length > 1;
		} catch (e) {
			const error = e as Error;
			errorMessage = error.message;
			loading = false;

			return false;
		}
	}

	function handleChange(event: Autocomplete['$$events_def']['change']) {
		selectedValue = suggestions?.find((suggestion) => suggestion === event.detail.value) ?? '';
	}

	function handleBeforeOpen(event: Autocomplete['$$events_def']['before-open']) {
		if (selectedValue && selectedValue === value) {
			event.preventDefault();
		}
	}
</script>

<main>
	<Autocomplete
		bind:value
		label="State"
		autocomplete="both"
		{computeOptions}
		on:before-open={handleBeforeOpen}
		on:change={handleChange}
	>
		{#if errorMessage}
			<li role="option" aria-selected="false" aria-disabled>{errorMessage}</li>
		{:else if loading}
			<li role="option" aria-selected="false" aria-disabled>Loading...</li>
		{:else if suggestions?.length}
			{#each suggestions as option}
				<AutocompleteOption value={option} />
			{/each}
		{/if}
	</Autocomplete>
</main>

<style>
	main {
		display: flex;
	}
</style>
