<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let value: [number, number] = [30, 70];

	let step: number = 1;
	let min: number = 0;
	let max: number = 100;

	const dispatch = createEventDispatcher<{
		change: { value: [number, number] };
	}>();

	let el: HTMLElement;
	let lastTouched: number | undefined = undefined;

	function handleThumbFocus(id: number) {
		lastTouched = id;
	}

	function getValueRatio(singleValue: number | undefined) {
		return (singleValue! / (max - min)).toFixed(2);
	}

	function handleChange() {
		dispatch('change', { value });
	}
</script>

<div
	bind:this={el}
	class="SliderRange"
	style:--SliderRange--inline-size={'600px'}
	style:--SliderRange--block-size={'40px'}
	style:--SliderRange--thumb-size={'40px'}
	style:--SliderRange--value1-ratio={getValueRatio(value.at(0))}
	style:--SliderRange--value2-ratio={getValueRatio(value.at(1))}
>
	<input
		class="SliderRange__slider"
		class:SliderRange__slider--touched={lastTouched === 1}
		bind:value={value[0]}
		type="range"
		{min}
		{max}
		{step}
		on:focus={() => handleThumbFocus(1)}
		on:change={handleChange}
	/>
	<div class="SliderRange__thumb SliderRange__thumb1" />
	<input
		class="SliderRange__slider SliderRange__slider2"
		class:SliderRange__slider--touched={lastTouched === 2}
		bind:value={value[1]}
		type="range"
		min="0"
		max="100"
		step="1"
		on:focus={() => handleThumbFocus(2)}
		on:change={handleChange}
	/>
	<div class="SliderRange__thumb SliderRange__thumb2" />
	<div class="SliderRange__track">
		<div class="SliderRange__active-track" />
	</div>
</div>

<style>
	.SliderRange {
		--SliderRange--inline-size: 200px;
		--SliderRange--block-size: 1rem;

		--SliderRange__track--inline-size: calc(
			var(--SliderRange--inline-size) + var(--SliderRange--thumb-size) -
				var(--SliderRange--thumb-size)
		);

		--SliderRange__active-track--margin: calc(var(--SliderRange--thumb-size) / 2);

		--SliderRange__active-track--value-ratio: calc(
			var(--SliderRange--value2-ratio) - var(--SliderRange--value1-ratio)
		);
		--SliderRange__active-track--margin-alpha: calc(
			(var(--SliderRange--thumb-size) - var(--SliderRange__active-track--margin))
		);

		--SliderRange__active-track--inline-size: calc(
			var(--SliderRange__track--inline-size) - (var(--SliderRange__active-track--margin) * 2)
		);

		position: relative;
		inline-size: var(--SliderRange--inline-size);
		block-size: var(--SliderRange--block-size);
		/* padding-block-start: var(--SliderRange--block-size); */

		display: inline-flex;
		align-items: center;
	}

	.SliderRange__slider {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;

		appearance: none;
		pointer-events: none;
		margin: 0;
		block-size: inherit;
		inline-size: inherit;
		background: transparent;
	}

	.SliderRange__slider:hover,
	.SliderRange__slider:hover + .SliderRange__thumb {
		z-index: 3;
	}

	.SliderRange__slider:focus-visible + .SliderRange__thumb {
		outline: black 2px solid;
	}

	.SliderRange__slider::-webkit-slider-runnable-track {
		position: absolute;
		border-radius: 2px;
		inline-size: var(--SliderRange--inline-size);
		block-size: var(--SliderRange--block-size);
	}

	.SliderRange__slider::-webkit-slider-thumb {
		inline-size: var(--SliderRange--thumb-size);
		block-size: 100%;

		appearance: none;

		position: relative;
		pointer-events: all;
		cursor: pointer;
		inset-block-start: 50%;
		transform: translateY(-50%);
	}

	.SliderRange__thumb {
		pointer-events: none;
		position: absolute;
		inline-size: var(--SliderRange--thumb-size);
		block-size: 100%;
		z-index: 1;
	}

	.SliderRange__thumb1 {
		background-color: blue;

		transform: translateX(
			calc(
				(var(--SliderRange--value1-ratio) * var(--SliderRange--inline-size)) -
					(var(--SliderRange--thumb-size) * var(--SliderRange--value1-ratio))
			)
		);
	}

	.SliderRange__thumb2 {
		background-color: orangered;
		transform: translateX(
			calc(
				(var(--SliderRange--value2-ratio) * var(--SliderRange--inline-size)) -
					(var(--SliderRange--thumb-size) * var(--SliderRange--value2-ratio))
			)
		);
	}

	.SliderRange__slider--touched:not(:hover),
	.SliderRange__slider--touched:not(:hover) + .SliderRange__thumb {
		z-index: 2;
	}

	.SliderRange__track {
		position: relative;
		inline-size: inherit;
		block-size: inherit;
		background: lightgrey;
		pointer-events: none;
	}

	.SliderRange__active-track {
		inline-size: var(--SliderRange__active-track--inline-size);
		block-size: 100%;
		margin-inline-start: calc(
			(var(--SliderRange__track--inline-size) - var(--SliderRange__active-track--inline-size)) / 2
		);

		background: orange;
		transform: translateX(
				calc(
					(var(--SliderRange__active-track--inline-size) * var(--SliderRange--value1-ratio)) +
						(var(--SliderRange__active-track--margin) * var(--SliderRange--value1-ratio)) -
						(var(--SliderRange__active-track--margin-alpha) * (var(--SliderRange--value1-ratio)))
				)
			)
			scaleX(var(--SliderRange__active-track--value-ratio));
		transform-origin: left;
	}
</style>
