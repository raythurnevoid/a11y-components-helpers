<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import ElementInViewChecker from '$lib/ElementInViewChecker.js';

	const dispatch = createEventDispatcher();

	let el: HTMLElement;
	let id: string = `Grid--${Date.now()}`;

	let cells: string[][] = [
		['A', 'B', 'C', 'D'],
		['E', 'F', 'G', 'H']
	];

	let numRows = cells.length;
	let numCols = Math.max(...cells.map((row) => row.length));

	let indexCellMap = new Map<`${number}-${number}`, string>();
	let cellIndexMap = new Map<string, [number, number]>();
	let flatIndex = 0;
	cells.forEach((row, rowIndex) => {
		row.forEach((cell, colIndex) => {
			cellIndexMap.set(cell, [rowIndex, colIndex]);
			indexCellMap.set(`${rowIndex}-${colIndex}`, cell);
			flatIndex++;
		});
	});

	let activeCell: string = '';
	let selectedCell: string = '';
	let elementInViewChecker: ElementInViewChecker;

	onMount(() => {
		elementInViewChecker = new ElementInViewChecker(el);

		return () => {
			elementInViewChecker.destroy();
		};
	});

	function getCellId(row: number, col: number) {
		return `${id}__cell--${row}-${col}`;
	}

	async function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'Home':
			case 'End':
			case 'Enter':
			case ' ':
				event.preventDefault();
				break;
		}

		let [rowIndex, colIndex] = cellIndexMap.get(activeCell) ?? [-1, -1];

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'Home':
			case 'End':
				switch (event.key) {
					case 'ArrowLeft':
						if (rowIndex === -1) rowIndex = 0;

						colIndex--;
						if (colIndex < 0) colIndex = numCols - 1;
						break;
					case 'ArrowRight':
						if (rowIndex === -1) rowIndex = 0;
						if (colIndex === -1) {
							colIndex = 0;
						} else {
							colIndex++;
							if (colIndex >= numCols) colIndex = 0;
						}
						break;
					case 'ArrowUp':
						if (colIndex === -1) colIndex = 0;

						rowIndex--;
						if (rowIndex < 0) rowIndex = numRows - 1;
						break;
					case 'ArrowDown':
						if (colIndex === -1) colIndex = 0;
						if (rowIndex === -1) {
							rowIndex = 0;
						} else {
							rowIndex++;
							if (rowIndex >= numRows) rowIndex = 0;
						}
						break;
					case 'Home':
						colIndex = 0;
						break;
					case 'End':
						colIndex = numCols - 1;
						break;
				}

				setActiveCell(cells.at(rowIndex)!.at(colIndex)!);
				break;
			case 'Enter':
			case ' ':
				setSelectedCell(activeCell);
				break;
		}

		const activeCellEl = document.getElementById(getCellId(rowIndex, colIndex));
		if (activeCellEl && !(await elementInViewChecker.check(activeCellEl))) {
			activeCellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
	}

	function setActiveCell(newValue: string) {
		activeCell = newValue;
	}

	function setSelectedCell(newValue: string) {
		selectedCell = newValue;
		dispatch('change', { value: newValue });
	}
</script>

<div {id}>
	<table bind:this={el} class="Grid" role="grid" tabindex={0} on:keydown={handleKeyDown}>
		{#each cells as row, rowIndex}
			<tr>
				{#each row as cell, colIndex}
					<td
						id={getCellId(rowIndex, colIndex)}
						aria-rowindex={rowIndex + 1}
						aria-colindex={colIndex + 1}
						role="gridcell"
						class="Grid__cell"
						class:Grid__cell--active={cell === activeCell}
						class:Grid__cell--selected={cell === selectedCell}
					>
						{cell}
					</td>
				{/each}
			</tr>
		{/each}
	</table>
</div>

<style>
	.Grid {
		border-collapse: collapse;
		width: 100%;
	}

	.Grid:focus {
		outline: 2px solid darkseagreen;
	}

	.Grid__cell {
		border: 1px solid black;
		padding: 8px;
		text-align: center;
	}

	.Grid__cell--active {
		background-color: lightcoral;
	}

	.Grid__cell--selected {
		background-color: orange;
	}
</style>
