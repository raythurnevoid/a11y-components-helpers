<script lang="ts">
	export let open: boolean = false;
</script>

<nav class="Menu" class:Menu--open={open}>
	<ul>
		<li>Option 1</li>
		<li>Option 2</li>
		<li>Option 3</li>
		<li>Option 4</li>
		<li>Option 5</li>
	</ul>
</nav>

<style lang="scss">
	.Menu {
		--Menu--block-start--offset: 50px;
		--Menu--max-height: calc(100% + var(--Menu--block-start--offset));

		position: absolute;
		inset: calc(-1 * var(--Menu--block-start--offset)) 0 0 0;
		background-color: var(--color--primary);
		border-end-end-radius: 100%;
		transition: max-height 0.2s ease-out 0.1s, max-width 0.3s ease-out 0.2s,
			border-end-end-radius 0.3s ease-out;
		contain: paint;
		max-height: 0%;
		max-width: 70%;
		height: var(--Menu--max-height);
		pointer-events: all;
	}

	.Menu--open {
		max-height: var(--Menu--max-height);
		max-width: 100%;
		border-end-end-radius: 0%;

		transition: max-height 0.3s ease-out, max-width 0.2s ease-out,
			border-end-end-radius 0.3s ease-out 0.2s;
	}

	ul {
		list-style: none;
	}

	.Menu li {
		padding: 10px 20px;
		font-size: 16px;
		border: none;
		cursor: pointer;
	}

	.Menu li:hover {
		background-color: #f1f1f1;
	}
</style>
