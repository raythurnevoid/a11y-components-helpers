<script lang="ts">
	import CopyButton from '$lib/components/copy-button/CopyButton.svelte';

	export let targetEl: HTMLElement;
</script>

<div class="CodeActions">
	<CopyButton copyFromEl={targetEl} />
</div>

<style lang="scss">
	.CodeActions {
		position: absolute;
		display: block;
	}
</style>
