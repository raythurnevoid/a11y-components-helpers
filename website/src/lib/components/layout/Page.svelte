<main class="Page">
	<div class="Page__content-container">
		<div class="content">
			<slot />
		</div>
	</div>
</main>

<style lang="scss">
	.Page {
		display: flex;
		justify-content: center;
		margin-inline: 16px;
	}

	.Page__content-container {
		width: 100ch;
		max-width: 100%;
	}

	.content {
		margin-block: 16px;
	}
</style>
