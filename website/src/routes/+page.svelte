<svelte:options immutable={true} />

<script lang="ts">
	import ShellSnippet from '$lib/components/shell-snippet/ShellSnippet.svelte';
	import TopAppBar from '$lib/components/layout/top-app-bar/TopAppBar.svelte';
	import Page from '$lib/components/layout/Page.svelte';
	import ExampleResultPanel from '$lib/components/example-result-panel/ExampleResultPanel.svelte';
	import Autocomplete from '$lib/components/examples/Autocomplete.svelte';
	import CodeSnippet from '../lib/components/code-snippet/CodeSnippet.svelte';
	import type { PageData } from './$types.js';

	export let data: PageData;
</script>

<TopAppBar />

<Page>
	<section>
		<h1>Installation</h1>
		<ShellSnippet>npm i -D @raythurnevoid/a11y-components-helpers</ShellSnippet>
	</section>
	<section>
		<h1>Getting Started</h1>
		<CodeSnippet
			fileName="Autocomplete.svelte"
			source={data.snippets['Autocomplete.svelte']}
			showFullSourceButton
		/>
		<ExampleResultPanel>
			<Autocomplete />
		</ExampleResultPanel>
	</section>
</Page>
