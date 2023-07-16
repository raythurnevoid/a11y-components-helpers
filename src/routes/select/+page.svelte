<script lang="ts">
	import * as api from './suggestions.js';
	import Select, { SelectOption } from '$lib/components/examples/select/Select.svelte';

	let options: string[] | undefined = undefined;

	let errorMessage: string | null = null;
	let loading: boolean = false;

	async function computeOptions() {
		try {
			if (options) return true;

			errorMessage = null;

			loading = true;

			const response = await api.fetchOptions();
			if (response.status === 404) {
				loading = false;
				throw new Error('No results found');
			} else if (response.status >= 500) {
				throw new Error('Error fetching results', {
					cause: response.body
				});
			}

			const responseBody = await response.json();

			options = responseBody;
			loading = false;

			return true;
		} catch (e) {
			const error = e as Error;
			errorMessage = error.message;
			loading = false;

			return false;
		}
	}
</script>

<main>
	<Select label="State" {computeOptions}>
		{#if errorMessage}
			<li role="option" aria-selected="false" aria-disabled>{errorMessage}</li>
		{:else if loading}
			<li role="option" aria-selected="false" aria-disabled>Loading...</li>
		{:else if options?.length}
			{#each options as option}
				<SelectOption value={option} />
			{/each}
		{/if}
	</Select>
</main>

<style>
	main {
		display: flex;
	}
</style>
