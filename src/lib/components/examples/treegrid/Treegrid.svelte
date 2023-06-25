<script lang="ts" context="module">
	let count = 0;

	type TreeGridRows = TreeGridRow[];

	interface TreeGridRow {
		cells: Cell[];
		rows?: TreeGridRows;
	}

	type Cell = string;

	type RowPath = number[];
	type RowPathStr = string;
	type CellIndex = number;
	type CellPathStr = `${RowPathStr}_${CellIndex}`;
	interface CellPath {
		rowPath: RowPathStr;
		cellIndex: CellIndex;
	}
</script>

<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import ElementInViewChecker from '$lib/ElementInViewChecker.js';

	const dispatch = createEventDispatcher();

	let el: HTMLElement;
	let id: string = `Treegrid--${count++}`;

	let rows: TreeGridRows = [
		{
			cells: ['A', 'B', 'C', 'D'],
			rows: [
				{
					cells: ['A1', 'B1', 'C1', 'D1']
				}
			]
		},
		{ cells: ['E', 'F', 'G', 'H'] }
	];

	let pathStrRowMap = new Map<RowPathStr, TreeGridRow>();
	let rowPathMap = new Map<TreeGridRow, RowPath>();
	let rowPathStrMap = new Map<TreeGridRow, RowPathStr>();
	let pathCellMap = new Map<CellPathStr, Cell>();
	let cellPathMap = new Map<Cell, CellPath>();
	let cellPathStrMap = new Map<Cell, CellPathStr>();
	let rowAncestryMap = new Map<Cell | TreeGridRow, TreeGridRow[]>();
	const flatRows = (function flatAndMapRows(
		toMap: TreeGridRows,
		rootPath: RowPath = [],
		ancestors: TreeGridRow[] = []
	): TreeGridRow[] {
		const flatRowsValue = toMap.flatMap((row, index) => {
			const ancestryIncludingSelf = [...ancestors, row];
			const path: RowPath = [...rootPath, index];
			const pathStr = path.join('-');
			const rowsAcc: TreeGridRow[] = [row];

			pathStrRowMap.set(pathStr, row);
			rowPathMap.set(row, path);
			rowPathStrMap.set(row, pathStr);
			rowAncestryMap.set(row, ancestors);
			row.cells.forEach((cell, cellIndex) => {
				const cellPath: CellPath = { rowPath: pathStr, cellIndex };
				const cellPathStr = `${pathStr}_${cellIndex}` as CellPathStr;
				pathCellMap.set(cellPathStr, cell);
				cellPathMap.set(cell, cellPath);
				cellPathStrMap.set(cell, cellPathStr);
				rowAncestryMap.set(cell, ancestryIncludingSelf);
			});
			if (row.rows) {
				rowsAcc.push(...flatAndMapRows(row.rows, path, ancestryIncludingSelf));
			}

			return rowsAcc;
		});

		return flatRowsValue;
	})(rows);

	let openRowsSet: Set<TreeGridRow> = new Set();

	$: showedRows = flatRows
		.map((row) => {
			const path = rowPathMap.get(row)!;
			if (path.length === 1) {
				return row;
			} else if (rowAncestryMap.get(row)?.some((ancestor) => openRowsSet.has(ancestor))) {
				return row;
			} else {
				return null;
			}
		})
		.filter(Boolean) as TreeGridRow[];

	let numRows = flatRows.length;
	let numCols = Math.max(...flatRows.map((row) => row.cells.length));

	let activeItemPath: string = rowPathStrMap.get(flatRows.at(0)!) ?? '';
	let selectedCell: string = '';
	let elementInViewChecker: ElementInViewChecker;

	$: activeRow = pathStrRowMap.get(activeItemPath) ?? null;
	$: activeCell = pathCellMap.get(activeItemPath as CellPathStr) ?? null;
	$: activeRowPath = activeRow ? rowPathMap.get(activeRow) : null;
	$: activeCellPath = activeCell ? cellPathMap.get(activeCell) : null;
	$: activeRowPathStr = activeRow ? rowPathStrMap.get(activeRow) : null;
	$: activeCellPathStr = activeCell ? cellPathStrMap.get(activeCell) : null;

	onMount(() => {
		elementInViewChecker = new ElementInViewChecker(el);

		return () => {
			elementInViewChecker.destroy();
		};
	});

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

				let activeEl: HTMLElement | undefined | null = undefined;

				if (activeRow && activeRowPath) {
					const rowIndex = showedRows.indexOf(activeRow);

					switch (event.key) {
						case 'ArrowLeft':
						case 'ArrowRight':
						case 'ArrowUp':
						case 'ArrowDown':
						case 'Home':
						case 'End':
							let rowIndexToActivate = rowIndex;

							switch (event.key) {
								case 'ArrowLeft':
									if (activeRow.rows && openRowsSet.has(activeRow)) {
										openRowsSet.delete(activeRow);
										openRowsSet = openRowsSet;
									}

									break;
								case 'ArrowRight':
									if (activeRow.rows && !openRowsSet.has(activeRow)) {
										openRowsSet.add(activeRow);
										openRowsSet = openRowsSet;
									} else {
										activeItemPath = cellPathStrMap.get(activeRow.cells.at(0)!)!;
									}

									break;
								case 'ArrowUp':
									if (rowIndex > 0) {
										rowIndexToActivate--;
										activeItemPath = rowPathStrMap.get(showedRows.at(rowIndexToActivate)!)!;
									}
									break;
								case 'ArrowDown':
									if (rowIndex < numRows) {
										rowIndexToActivate++;
										activeItemPath = rowPathStrMap.get(showedRows.at(rowIndexToActivate)!)!;
									}
									break;
								case 'Home':
									activeItemPath = rowPathStrMap.get(showedRows.at(0)!)!;
									break;
								case 'End':
									activeItemPath = rowPathStrMap.get(showedRows.at(-1)!)!;
									break;
							}

							break;
						case 'Enter':
						case ' ':
							setSelectedCell(activeItemPath);
							break;
					}
				} else if (activeCell && activeCellPath) {
					const row = rowAncestryMap.get(activeCell)!.at(-1)!;
					const rowIndex = showedRows.indexOf(row);

					switch (event.key) {
						case 'ArrowLeft':
						case 'ArrowRight':
						case 'ArrowUp':
						case 'ArrowDown':
						case 'Home':
						case 'End':
							let cellIndexToActivate = activeCellPath.cellIndex;
							let cellRowIndexToActivate = rowIndex;

							switch (event.key) {
								case 'ArrowLeft':
									cellIndexToActivate--;
									if (cellIndexToActivate < 0) {
										activeItemPath = activeCellPath.rowPath;
									} else {
										activeItemPath = cellPathStrMap.get(row.cells.at(cellIndexToActivate)!)!;
									}
									break;
								case 'ArrowRight':
									if (cellIndexToActivate < numCols - 1) {
										cellIndexToActivate++;
										activeItemPath = cellPathStrMap.get(row.cells.at(cellIndexToActivate)!)!;
									}
									break;
								case 'ArrowUp':
									if (rowIndex > 0) {
										cellRowIndexToActivate--;
										const cellRow = showedRows.at(cellRowIndexToActivate)!;
										activeItemPath = cellPathStrMap.get(cellRow.cells.at(cellIndexToActivate)!)!;
									}
									break;
								case 'ArrowDown':
									if (rowIndex < numRows) {
										cellRowIndexToActivate++;
										const cellRow = showedRows.at(cellRowIndexToActivate)!;
										activeItemPath = cellPathStrMap.get(cellRow.cells.at(cellIndexToActivate)!)!;
									}
									break;
								case 'Home':
									cellIndexToActivate = 0;
									break;
								case 'End':
									cellIndexToActivate = numCols - 1;
									break;
							}

							break;
						case 'Enter':
						case ' ':
							setSelectedCell(activeItemPath);
							break;
					}

					activeEl = document.getElementById(getCellId(activeItemPath as CellPathStr));
				}

				if (activeEl && !(await elementInViewChecker.check(activeEl))) {
					activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
				}
				break;
		}
	}

	function setSelectedCell(newValue: string) {
		selectedCell = newValue;
		dispatch('change', { value: newValue });
	}

	function getCellId(cellPath: CellPathStr) {
		return `${id}-cell--${cellPath}`;
	}

	function getRowId(rowPath: RowPathStr) {
		return `${id}-row--${rowPath}`;
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<table
	bind:this={el}
	{id}
	class="Treegrid"
	role="treegrid"
	tabindex={0}
	aria-activedescendant={activeRowPathStr
		? getRowId(activeRowPathStr)
		: activeCellPathStr
		? getCellId(activeCellPathStr)
		: ''}
	on:keydown={handleKeyDown}
>
	{#each showedRows as row, rowIndex}
		{@const rowPathStr = rowPathStrMap.get(row)}
		{@const ancestors = rowAncestryMap.get(row)}

		{#if rowPathStr && ancestors}
			<tr
				id={getRowId(rowPathStr)}
				class:Treegrid__row--active={row === activeRow}
				aria-level={ancestors.length + 1}
				aria-expanded={row.rows ? openRowsSet.has(row) : undefined}
			>
				{#each row.cells as cell, colIndex}
					{@const cellPathStr = cellPathStrMap.get(cell)}

					{#if cellPathStr}
						<td
							id={getCellId(cellPathStr)}
							class="Treegrid__cell"
							class:Treegrid__cell--active={cell === activeCell}
							role="gridcell"
							aria-rowindex={rowIndex + 1}
							aria-colindex={colIndex + 1}
						>
							{cell}
						</td>
					{/if}
				{/each}
			</tr>
		{/if}
	{/each}
</table>

<style>
	.Treegrid {
		border-collapse: collapse;
		width: 100%;
	}

	.Treegrid:focus {
		outline: 2px solid darkseagreen;
	}

	.Treegrid__cell {
		border: 1px solid black;
		padding: 8px;
		text-align: center;
	}

	.Treegrid__cell--active {
		background-color: lightcoral;
	}

	.Treegrid__row--active {
		background-color: lightcoral;
	}

	.Treegrid__cell--selected {
		background-color: orange;
	}
</style>
