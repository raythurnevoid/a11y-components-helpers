<script lang="ts">
	import * as api from './suggestions.js';
	import Autocomplete, {
		AutocompleteOption
	} from '$lib/components/examples/autocomplete/Autocomplete.svelte';
	import { debounce } from '../../lib/debounce.js';
	import { onMount, tick } from 'svelte';

	let autocompleteComp: Autocomplete;

	let value: string = '';
	let selectedValue: string = value;
	let suggestions: string[] | undefined = undefined;

	let cachedFilter: string | null | undefined = undefined;
	let errorMessage: string | null = null;
	let isLoading: boolean = false;

	let areOptionsReady = false;
	let computeOptionsPromise: Promise<boolean> | null = null;

	$: asyncOptions = {
		checkIfAreReady: () => areOptionsReady,
		getPromise: () =>
			new Promise<void>(async (resolve) => {
				computeOptionsPromise?.then((canContinue) => {
					console.log(canContinue);
					if (canContinue) resolve();
				});
			})
	} as Autocomplete['$$props_def']['asyncOptions'];

	onMount(() => {
		computeOptions(value);
	});

	async function computeOptions(filter: string): Promise<boolean> {
		areOptionsReady = false;

		computeOptionsPromise = new Promise(async (resolve) => {
			try {
				if (filter === cachedFilter) return handleCompletition();

				errorMessage = null;

				isLoading = true;

				const checkIfOverlap = await debounce({
					key: computeOptions,
					delay: 300
				});

				const response = await api.fetchSuggestions(filter ?? '');
				if (checkIfOverlap()) return resolve(false);

				if (response.status === 404) {
					throw new Error('No results found');
				} else if (response.status >= 500) {
					throw new Error('Error fetching results', {
						cause: response.body
					});
				}

				const responseBody = await response.json();

				cachedFilter = filter;
				suggestions = responseBody;
			} catch (e) {
				const error = e as Error;
				errorMessage = error.message;
			}

			return handleCompletition();

			async function handleOptionsChange() {
				await tick();
				autocompleteComp.handleOptionsChange();
			}

			async function handleCompletition() {
				areOptionsReady = true;
				isLoading = false;
				await handleOptionsChange();
				resolve(true);
			}
		});

		return computeOptionsPromise;
	}

	function handleChange(event: Autocomplete['$$events_def']['change']) {
		selectedValue = suggestions?.find((suggestion) => suggestion === event.detail.value) ?? '';
	}

	function handleInput() {
		computeOptions(value);
	}
</script>

<main>
	<Autocomplete
		bind:this={autocompleteComp}
		bind:value
		label="State"
		autocomplete="both"
		{asyncOptions}
		on:focus={handleFocus}
		on:change={handleChange}
		on:input={handleInput}
	>
		{#if errorMessage}
			<li role="option" aria-selected="false" aria-disabled>{errorMessage}</li>
		{:else if isLoading}
			<li role="option" aria-selected="false" aria-disabled>Loading...</li>
		{:else if suggestions?.length}
			{#each suggestions as option}
				<AutocompleteOption value={option} />
			{/each}
		{/if}
	</Autocomplete>
	<button>test </button>
</main>

<style>
	main {
		display: flex;
	}
</style>
