<script lang="ts">
	import * as api from './suggestions.js';
	import Autocomplete, {
		AutocompleteOption
	} from '$lib/components/examples/autocomplete/Autocomplete.svelte';
	import { debounce } from '../../lib/debounce.js';
	import { tick } from 'svelte';
	import { createPromiseWithResolvers } from '../../lib/promise-with-resolvers.js';

	let autocompleteComp: Autocomplete;

	let value: string = '';
	let selectedValue: string = value;
	let suggestions: string[] | undefined = undefined;

	let cachedFilter: string | null | undefined = undefined;
	let errorMessage: string | null = null;
	let loading: boolean = false;

	let computeOptionsIsRunning: boolean = false;
	let computeOptionsPromise: Promise<boolean> | null = null;

	async function computeOptions(filter: string | null): Promise<boolean> {
		computeOptionsIsRunning = true;

		computeOptionsPromise = new Promise(async (resolve) => {
			try {
				if (filter === cachedFilter) return resolve(false);

				errorMessage = null;

				loading = true;

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
				computeOptionsIsRunning = false;
				loading = false;
				await handleOptionsChange();
				resolve(true);
			}
		});

		return computeOptionsPromise;
	}

	function handleChange(event: Autocomplete['$$events_def']['change']) {
		selectedValue = suggestions?.find((suggestion) => suggestion === event.detail.value) ?? '';
	}

	function handleBeforeOpen(event: Autocomplete['$$events_def']['before-open']) {
		if (!computeOptionsIsRunning) computeOptions(value);
	}

	async function handleOpen(event: Autocomplete['$$events_def']['open']) {
		if (!computeOptionsIsRunning) return;

		const promise = createPromiseWithResolvers<void>();
		event.detail.waitForToProceed(promise.promise);
		while (!(await computeOptionsPromise)) {}
		promise.resolve();
	}

	function handleInput() {
		computeOptions(value);
	}

	function handleOptionsToBeReadyRequest(
		event: Autocomplete['$$events_def']['options-to-be-ready-request']
	) {
		computeOptionsPromise?.then((canContinue) => {
			if (canContinue) event.detail.proceed();
		});
	}
</script>

<main>
	<Autocomplete
		bind:this={autocompleteComp}
		bind:value
		label="State"
		autocomplete="both"
		on:before-open={handleBeforeOpen}
		on:open={handleOpen}
		on:change={handleChange}
		on:input={handleInput}
		on:options-to-be-ready-request={handleOptionsToBeReadyRequest}
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
	<button>test </button>
</main>

<style>
	main {
		display: flex;
	}
</style>
