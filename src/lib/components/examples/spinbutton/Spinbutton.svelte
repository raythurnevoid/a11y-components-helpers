<script lang="ts">
	let options: string[] = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	let value = options[0]!;
	let valueMin = 1;
	let valueMax = options.length;

	$: valueIndex = options.indexOf(value);
	$: prevValue = options[valueIndex - 1] ?? '';
	$: nextValue = options[valueIndex + 1] ?? '';

	let el: HTMLElement;

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowUp':
			case 'ArrowDown':
			case 'Home':
			case 'End':
				event.preventDefault();

				switch (event.key) {
					case 'ArrowUp':
						if (prevValue) value = prevValue;
						break;
					case 'ArrowDown':
						if (nextValue) value = nextValue;
						break;
					case 'Home':
						value = options[0]!;
						break;
					case 'End':
						value = options[options.length - 1]!;
						break;
				}
				break;
		}
	}

	function handlePrevClick() {
		if (prevValue) value = prevValue;
	}

	function handleNextClick() {
		if (nextValue) value = nextValue;
	}

	function handleFocusin(e: FocusEvent) {
		const target = e.target as HTMLElement;
		if (target.getAttribute('role') === 'spinbutton') {
			return;
		}
		console.log(target);

		(el.querySelector('[role="spinbutton"]') as HTMLElement)?.focus();
	}
</script>

<div bind:this={el} class="Spinbutton" on:keydown={handleKeyDown} on:focusin={handleFocusin}>
	<button
		type="button"
		class="decrease"
		tabindex="-1"
		aria-label="Previous Month"
		on:click={handlePrevClick}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
			<polygon points="2,18 18,18 10,4" />
		</svg>
	</button>
	<div class="Spinbutton__prev" aria-hidden="true">
		{prevValue}
	</div>
	<div
		role="spinbutton"
		tabindex="0"
		aria-valuenow={valueIndex + 1}
		aria-valuetext={value}
		aria-valuemin={valueMin}
		aria-valuemax={valueMax}
		aria-label="Month"
	>
		{value}
	</div>
	<div class="Spinbutton__next" aria-hidden="true">
		{nextValue}
	</div>
	<button
		type="button"
		class="increase"
		tabindex="-1"
		aria-label="Next Month"
		on:click={handleNextClick}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
			<polygon points="2,4 18,4 10,18" />
		</svg>
	</button>
</div>

<style>
	.Spinbutton {
		display: inline-flex;
		flex-direction: column;
		width: 10ch;
	}

	.Spinbutton:has(:focus-visible) {
		outline: 2px solid #000;
	}

	[role='spinbutton']:focus-visible {
		outline: none;
		background-color: lightgray;
	}

	.Spinbutton__prev,
	.Spinbutton__next {
		height: 1lh;
	}
</style>
