<button class="TextButton" on:click>
	<div class="TextButton__touch-target-container">
		<div class="TextButton__touch-target" />
	</div>

	<slot />
</button>

<style lang="scss">
	.TextButton {
		all: unset;
		display: inline;
		cursor: pointer;
		color: var(--color--primary);
		position: relative;

		&:hover {
			text-decoration: underline;
		}
	}

	.TextButton__touch-target-container {
		position: absolute;
		inset: 0;
		display: flex;
		place-items: center;
	}

	.TextButton__touch-target {
		width: 100%;
		height: 100%;
		min-height: 48px;
		min-width: 48px;
	}
</style>
