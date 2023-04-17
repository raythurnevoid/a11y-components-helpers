<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	let snackbars = writable<OpenSnackbarParams[]>([]);

	export function openSnackbar(content: string) {
		snackbars.update((snackbars) => {
			return [
				...snackbars,
				{
					content
				}
			];
		});
	}

	export interface OpenSnackbarParams {
		content: string;
	}
</script>

<script lang="ts">
	import './Snackbar.scss';

	let el: HTMLElement;

	function handleClosed(snackbar: OpenSnackbarParams) {
		snackbars.update((snackbars) => {
			return snackbars.filter((s) => s !== snackbar);
		});
	}
</script>

<aside bind:this={el} class="Snackbars">
	{#each $snackbars as snackbar, index (snackbar)}
		<div style:--Snackbar-position={$snackbars.length - index - 1}>
			{#await import('./Snackbar.svelte') then { default: Snackbar }}
				<Snackbar
					content={snackbar.content}
					on:closed={() => {
						handleClosed(snackbar);
					}}
				/>
			{/await}
		</div>
	{/each}
</aside>
