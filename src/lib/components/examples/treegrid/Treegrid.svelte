<script lang="ts" context="module">
	let count = 0;

	type TreeGridRows = TreeGridRow[];

	interface TreeGridRow {
		cells: TreeGridCell[];
		rows?: TreeGridRows;
	}

	type TreeGridCell = string;

	type RowPath = number[];
	type RowPathStr = string;
	type CellIndex = number;
	type CellPathStr = `${RowPathStr}_${CellIndex}`;
	interface CellPath {
		rowPath: RowPathStr;
		cellIndex: CellIndex;
	}

	type TreeGridItem =
		| {
				row: TreeGridRow;
		  }
		| {
				cell: TreeGridCell;
		  };
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
				},
				{
					cells: ['A2', 'B2', 'C2', 'D2']
				}
			]
		},
		{ cells: ['E', 'F', 'G', 'H'] }
	];

	let pathStrRowMap = new Map<RowPathStr, TreeGridRow>();
	let rowPathMap = new Map<TreeGridRow, RowPath>();
	let rowPathStrMap = new Map<TreeGridRow, RowPathStr>();
	let pathCellMap = new Map<CellPathStr, TreeGridCell>();
	let cellPathMap = new Map<TreeGridCell, CellPath>();
	let cellPathStrMap = new Map<TreeGridCell, CellPathStr>();
	let itemAncestryMap = new Map<TreeGridCell | TreeGridRow, TreeGridRow[]>();
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
			itemAncestryMap.set(row, ancestors);
			row.cells.forEach((cell, cellIndex) => {
				const cellPath: CellPath = { rowPath: pathStr, cellIndex };
				const cellPathStr = `${pathStr}_${cellIndex}` as CellPathStr;
				pathCellMap.set(cellPathStr, cell);
				cellPathMap.set(cell, cellPath);
				cellPathStrMap.set(cell, cellPathStr);
				itemAncestryMap.set(cell, ancestryIncludingSelf);
			});
			if (row.rows) {
				rowsAcc.push(...flatAndMapRows(row.rows, path, ancestryIncludingSelf));
			}

			return rowsAcc;
		});

		return flatRowsValue;
	})(rows);

	let openRowsSet: Set<TreeGridRow> = new Set();

	$: showedRows = flatRows.filter((row) => {
		return (
			rowPathMap.get(row)!.length === 1 ||
			itemAncestryMap.get(row)?.every((ancestor) => openRowsSet.has(ancestor))
		);
	});

	$: numRows = showedRows.length;
	let numCols = Math.max(...flatRows.map((row) => row.cells.length));

	let activeItemPath: string = '';
	let selectedCell: string = '';
	let elementInViewChecker: ElementInViewChecker;
	let activeItem: TreeGridItem | null | undefined = undefined;

	onMount(() => {
		elementInViewChecker = new ElementInViewChecker(el);

		return () => {
			elementInViewChecker.destroy();
		};
	});

	function openRow(row: TreeGridRow) {
		openRowsSet.add(row);
		openRowsSet = openRowsSet;
	}

	function closeRow(row: TreeGridRow) {
		openRowsSet.delete(row);
		openRowsSet = openRowsSet;
	}

	function closeRows() {
		openRowsSet.clear();
		openRowsSet = openRowsSet;
	}

	function selectCell(newValue: string) {
		selectedCell = newValue;
		dispatch('change', { value: newValue });
	}

	function getCellId(cell: TreeGridCell) {
		return `${id}-cell--${cellPathStrMap.get(cell)}`;
	}

	function getRowId(row: TreeGridRow) {
		return `${id}-row--${rowPathStrMap.get(row)}`;
	}

	function getItemId(item: TreeGridItem) {
		if ('row' in item) return getRowId(item.row);
		else if ('cell' in item) return getCellId(item.cell);
	}

	function getRowFromItem(item: TreeGridItem) {
		if ('row' in item) return item.row;
	}

	function getCellFromItem(item: TreeGridItem) {
		if ('cell' in item) return item.cell;
	}

	function getParent(rowOrCell: TreeGridRow | TreeGridCell) {
		return itemAncestryMap.get(rowOrCell)?.at(-1);
	}

	function getNextRowToActivate(activeRow: TreeGridRow, direction: 'prev' | 'next') {
		const activeRowIndex = showedRows.indexOf(activeRow);
		const towToActivateIndex =
			direction === 'next'
				? activeRowIndex < numRows - 1
					? activeRowIndex + 1
					: 0
				: activeRowIndex - 1;
		const rowToActivate = showedRows.at(towToActivateIndex);
		return rowToActivate;
	}

	function getNextCellToActivate(
		activeCell: TreeGridCell,
		direction: 'prev' | 'next' | 'up' | 'down'
	) {
		let cellToActivate: TreeGridCell | undefined = undefined;

		const activeCellRow = getParent(activeCell)!;
		const activeCellIndex = activeCellRow.cells.indexOf(activeCell);

		if (direction === 'prev' || direction === 'next') {
			const cellToActivateIndex =
				direction === 'next'
					? activeCellIndex < numCols - 1
						? activeCellIndex + 1
						: 0
					: activeCellIndex - 1;
			cellToActivate = activeCellRow.cells.at(cellToActivateIndex);
		} else {
			const activeCellRowIndex = showedRows.indexOf(activeCellRow);
			const cellRowIndexToActivate =
				direction === 'down'
					? activeCellRowIndex < numRows - 1
						? activeCellRowIndex + 1
						: 0
					: activeCellRowIndex - 1;
			const cellRowToActivate = showedRows.at(cellRowIndexToActivate);
			cellToActivate = cellRowToActivate?.cells.at(activeCellIndex)!;
		}

		return cellToActivate;
	}

	async function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'PageUp':
			case 'PageDown':
			case 'Home':
			case 'End':
			case 'Enter':
			case ' ':
			case 'Escape':
				event.preventDefault();

				let activeEl: HTMLElement | undefined | null = undefined;

				let rowToActivate: TreeGridRow | undefined = undefined;
				let cellToActivate: TreeGridCell | undefined = undefined;
				let itemToActivate: TreeGridItem | null | undefined = undefined;
				let rowToOpen: TreeGridRow | undefined = undefined;
				let rowToClose: TreeGridRow | undefined = undefined;

				switch (event.key) {
					case 'ArrowLeft':
					case 'ArrowRight':
					case 'ArrowUp':
					case 'ArrowDown':
					case 'PageUp':
					case 'PageDown':
					case 'Home':
					case 'End':
						const activeCell = activeItem ? getCellFromItem(activeItem) : undefined;
						const activeCellRow = activeCell ? getParent(activeCell) : undefined;
						const activeRow = activeItem ? getRowFromItem(activeItem) : undefined;

						switch (event.key) {
							case 'ArrowLeft':
								if (activeRow) {
									if (activeRow.rows && openRowsSet.has(activeRow)) {
										rowToClose = activeRow;
									} else {
										rowToActivate = getParent(activeRow);
									}
								} else if (activeCell && activeCellRow) {
									const activeCellIndex = activeCellRow.cells.indexOf(activeCell);
									if (activeCellIndex > 0) {
										cellToActivate = getNextCellToActivate(activeCell, 'prev');
									} else {
										rowToActivate = activeCellRow;
									}
								} else {
									rowToActivate = showedRows.at(0);
								}
								break;
							case 'ArrowRight':
								if (activeRow) {
									if (activeRow.rows && !openRowsSet.has(activeRow)) {
										rowToOpen = activeRow;
									} else {
										cellToActivate = activeRow.cells.at(0);
									}
								} else if (activeCell) {
									cellToActivate = getNextCellToActivate(activeCell, 'next');
								} else {
									rowToActivate = showedRows.at(0);
								}
								break;
							case 'ArrowUp':
								if (activeRow) {
									rowToActivate = getNextRowToActivate(activeRow, 'prev');
								} else if (activeCell) {
									cellToActivate = getNextCellToActivate(activeCell, 'up');
								} else {
									rowToActivate = showedRows.at(-1);
								}
								break;
							case 'ArrowDown':
								if (activeRow) {
									rowToActivate = getNextRowToActivate(activeRow, 'next');
								} else if (activeCell) {
									cellToActivate = getNextCellToActivate(activeCell, 'down');
								} else {
									rowToActivate = showedRows.at(0);
								}
								break;
							case 'PageUp':
								if (activeRow) {
									rowToActivate = (getParent(activeRow)?.rows ?? rows)?.at(0);
								} else if (activeCell && activeCellRow) {
									cellToActivate = activeCellRow.cells.at(0);
								} else {
									rowToActivate = showedRows.at(0);
								}
								break;
							case 'PageDown':
								if (activeRow) {
									rowToActivate = (getParent(activeRow)?.rows ?? rows)?.at(-1);
								} else if (activeCell && activeCellRow) {
									cellToActivate = activeCellRow.cells.at(-1);
								} else {
									rowToActivate = showedRows.at(-1);
								}

								break;

							case 'Home':
								if (activeCell && activeCellRow) {
									cellToActivate = activeCellRow.cells.at(0);
								} else {
									rowToActivate = showedRows.at(0);
								}
								break;

							case 'End':
								if (activeCell && activeCellRow) {
									cellToActivate = activeCellRow.cells.at(-1);
								} else {
									rowToActivate = showedRows.at(-1);
								}
								break;
						}

						break;
					case 'Enter':
					case ' ':
						selectCell(activeItemPath);
						break;
					case 'Escape':
						if (activeItem) {
							itemToActivate = null;
						} else {
							closeRows();
						}
						break;
				}

				if (rowToActivate !== undefined) {
					itemToActivate = {
						row: rowToActivate
					};
				}

				if (cellToActivate !== undefined) {
					itemToActivate = {
						cell: cellToActivate
					};
				}

				if (itemToActivate !== undefined) {
					activeItem = itemToActivate;
				}

				if (rowToOpen) {
					openRow(rowToOpen);
				}

				if (rowToClose) {
					closeRow(rowToClose);
				}

				if (activeItem) {
					const id = getItemId(activeItem);
					activeEl = id ? document.getElementById(id) : undefined;
				}

				if (activeEl && !(await elementInViewChecker.check(activeEl))) {
					activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
				}
				break;
		}
	}

	let dblClickTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	function handleClick(clickedCell: TreeGridCell) {
		const cellRow = getParent(clickedCell)!;

		dblClickTimeout = setTimeout(() => {
			activeItem = {
				row: cellRow
			};
		});
	}

	function handleDblClick(clickedCell: TreeGridCell) {
		clearTimeout(dblClickTimeout);
		const cellRow = getParent(clickedCell)!;

		if (openRowsSet.has(cellRow)) {
			closeRow(cellRow);
		} else {
			openRow(cellRow);
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<table
	bind:this={el}
	{id}
	class="Treegrid"
	role="treegrid"
	tabindex={0}
	aria-activedescendant={activeItem ? getItemId(activeItem) : ''}
	on:keydown={handleKeyDown}
>
	{#each showedRows as row, rowIndex}
		{@const ancestors = itemAncestryMap.get(row)}

		{#if ancestors}
			{@const activeRow = activeItem ? getRowFromItem(activeItem) : undefined}
			<tr
				id={getRowId(row)}
				class="Treegrid__row"
				class:Treegrid__row--active={activeRow && row === activeRow}
				aria-level={ancestors.length + 1}
				aria-expanded={row.rows ? openRowsSet.has(row) : undefined}
			>
				{#each row.cells as cell, colIndex}
					<td
						id={getCellId(cell)}
						class="Treegrid__cell"
						class:Treegrid__cell--active={activeItem &&
							'cell' in activeItem &&
							cell === activeItem.cell}
						role="gridcell"
						aria-rowindex={rowIndex + 1}
						aria-colindex={colIndex + 1}
						on:click={() => handleClick(cell)}
						on:dblclick={() => handleDblClick(cell)}
					>
						{cell}
					</td>
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
		cursor: pointer;
	}

	.Treegrid__cell--active {
		background-color: lightcoral;
	}

	.Treegrid__row:not(.Treegrid__row--active):hover {
		background-color: lightgray;
	}

	.Treegrid__row:hover .Treegrid__cell--active {
		background-color: orange;
	}

	.Treegrid__row--active {
		background-color: lightcoral;
	}

	.Treegrid__row--active:hover {
		background-color: orange;
	}
</style>
