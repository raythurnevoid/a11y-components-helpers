<svelte:options immutable={true} />

<script lang="ts">
	import './TopAppBar.scss';
	import { base } from '$app/paths';
	import GitHubLink from '../github-link/GitHubLink.svelte';
	import { MDCTopAppBar } from '@material/top-app-bar';
	import { onMount } from 'svelte';
	import Menu from './Menu.svelte';

	let el: HTMLElement;

	let isMenuOpen: boolean = false;

	onMount(() => {
		const topAppBar = new MDCTopAppBar(el);

		return () => {
			topAppBar.destroy();
		};
	});

	function handleSearchFocus() {
		isMenuOpen = true;
	}

	function handleSearchBlur() {
		isMenuOpen = false;
	}
</script>

<div class="TopAppBar">
	<header bind:this={el} class="mdc-top-app-bar mdc-top-app-bar--fixed">
		<div class="mdc-top-app-bar__row">
			<section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
				<a class="TopAppBar__title mdc-top-app-bar__title" href="{base}/">
					A11y components helpers
				</a>
			</section>
			<section class="TopAppBar__search-section mdc-top-app-bar__section">
				<input
					class="TopAppBar__search"
					type="text"
					placeholder="Search"
					on:focus={handleSearchFocus}
					on:blur={handleSearchBlur}
				/>
			</section>
			<section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end" role="toolbar">
				<GitHubLink />
			</section>
		</div>
	</header>
	<div class="TopAppBar__menu-container">
		<div class="TopAppBar__menu-wrapper">
			<Menu open={isMenuOpen} />
		</div>
	</div>
</div>

<style lang="scss">
	.TopAppBar {
		display: flex;
		flex-direction: column;
		height: 100vb;

		@media (prefers-color-scheme: dark) {
			:global(.mdc-top-app-bar--fixed-scrolled) {
				box-shadow: 0px 2px 4px -1px rgba(199, 0, 0, 0.4), 0px 4px 5px 0px rgba(199, 0, 0, 0.34),
					0px 1px 10px 0px rgba(199, 0, 0, 0.32);
			}
		}
	}

	.TopAppBar__menu-container {
		flex: 1;
		position: relative;
		z-index: 1;
	}

	.TopAppBar__menu-wrapper {
		contain: paint;
		height: 100%;
	}

	.mdc-top-app-bar {
		position: sticky;
		inset-block-start: 0;
		z-index: 1;
	}

	.TopAppBar__title {
		line-height: 64px;
		margin: 0;
		text-decoration: none;
		color: inherit;
		padding-inline: 20px;

		&:focus-visible {
			outline: none;
			text-decoration: underline;
		}
	}

	.mdc-top-app-bar__section {
		flex: 1 1 0;
	}

	.TopAppBar__search-section {
		flex: 2 0 0;
	}

	.TopAppBar__search {
		appearance: none;
		border: none;
		background-color: var(--color--primary-darker);
		color: #fff;
		height: calc(16px * 2);
		border-radius: 8px;
		padding-inline: 16px;
		width: 100%;

		&::placeholder {
			color: #ffffff8f;
		}
	}
</style>
