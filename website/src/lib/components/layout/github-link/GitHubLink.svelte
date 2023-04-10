<script lang="ts">
	import githubSvg from './github-mark-white.svg?raw';
	import IconButton from '$lib/components/icon-button/IconButton.svelte';
</script>

<div class="GitHubLink">
	<IconButton
		href="https://github.com/raythurnevoid/svelte-group-components"
		target="_blank"
		title="GitHub Repository"
	>
		{@html githubSvg}
	</IconButton>
</div>

<style lang="scss">
	.GitHubLink {
		display: contents;
	}
</style>
