import { describe, it, afterAll, expect } from 'vitest';
import { Bench } from 'tinybench';

describe('dom vs array benchmarks', () => {
	let arr: Item[] = [
		{
			value: '1',
			subitems: [
				{
					value: '1.1',
					subitems: [
						{
							value: '1.1.1'
						},
						{
							value: '1.1.2'
						}
					]
				},
				{
					value: '1.2',
					subitems: [
						{
							value: '1.2.1'
						},
						{
							value: '1.2.2'
						}
					]
				}
			]
		}
	];

	let openItems: Item[] = [];

	const dom = document.implementation.createDocument('', 'root', null);
	const domOpenItems = dom.documentElement.getElementsByClassName('open');

	const idMap = new WeakMap<Item, number[]>();
	const itemToDomMap = new WeakMap<Item, Element>();
	const domToItemMap = new WeakMap<Element, Item>();

	// populate idMap
	(function populateIdMap(items: Item[], path: number[] = []) {
		items.forEach((item, i) => {
			idMap.set(item, [...path, i]);
			if (item.subitems) {
				populateIdMap(item.subitems, [...path, i]);
			}
		});
	})(arr);

	// populate dom
	(function populateDom(items: Item[], parent: Element) {
		items.forEach((item, i) => {
			const el = dom.createElement('item');
			el.setAttribute('value', item.value);
			parent.appendChild(el);
			itemToDomMap.set(item, el);
			domToItemMap.set(el, item);
			if (item.subitems) {
				populateDom(item.subitems, el);
			}
		});
	})(arr, dom.documentElement);

	const startingPoint = arr[0]!.subitems![0]!.subitems![0]!;
	const itemToOpen1 = arr[0]!.subitems![0]!.subitems![0]!;
	const itemToOpen2 = arr[0]!.subitems![1]!.subitems![0]!;

	function getAt(index: number[]) {
		let pointer: any = undefined;
		index.forEach((i, index) => {
			if (index === 0) {
				pointer = arr[i]!;
			} else {
				pointer = pointer.subitems![i]!;
			}
		});
		return pointer;
	}

	function getChain(index: number[]) {
		let result: Item[] = [];
		let pointer: any = undefined;
		index.forEach((i, index) => {
			if (index === 0) {
				pointer = arr[i]!;
			} else {
				pointer = pointer.subitems![i]!;
			}
			result.push(pointer);
		});
		return result;
	}

	function nextSibling_array() {
		const index = idMap.get(startingPoint);

		const nextSiblingIndex = index?.slice();
		nextSiblingIndex![nextSiblingIndex!.length - 1]++;
		const nextSibling: Item = getAt(nextSiblingIndex!);

		return nextSibling;
	}

	function nextSibling_dom() {
		const domStartingPoint = itemToDomMap.get(startingPoint);
		const domNextSibling = domStartingPoint!.nextElementSibling;
		const nextSibling = domToItemMap.get(domNextSibling!);
		return nextSibling;
	}

	function parentAndNextSibling_array() {
		const index = idMap.get(startingPoint);

		const resultIndex = index?.slice(0, -1);
		resultIndex![resultIndex!.length - 1]++;
		const result: Item = getAt(resultIndex!);

		return result;
	}

	function parentAndNextSibling_dom() {
		const domStartingPoint = itemToDomMap.get(startingPoint);
		const domResult = domStartingPoint!.parentElement!.nextElementSibling!;
		const result = domToItemMap.get(domResult!);
		return result;
	}

	function closest_array() {
		const index = idMap.get(startingPoint);

		const resultIndex = index?.slice(0, 1);
		const result: Item = getAt(resultIndex!);

		return result;
	}

	function closest_dom() {
		const domStartingPoint = itemToDomMap.get(startingPoint);
		const domResult = domStartingPoint!.closest('root > item')!;
		const result = domToItemMap.get(domResult!);
		return result;
	}

	function openItems__array(itemToOpen: Item) {
		openItems = [];
		const index = idMap.get(itemToOpen);
		getChain(index!)?.forEach((item) => {
			openItems.push(item);
		});

		return openItems;
	}

	function openItems__dom(itemToOpen: Item) {
		const domItemToOpen = itemToDomMap.get(itemToOpen!)!;

		while (true) {
			if (domOpenItems.length === 0) break;
			domOpenItems.item(0)!.classList.remove('open');
		}

		domItemToOpen.classList.add('open');
		const parents: Element[] = [];
		let pointer: Element = domItemToOpen;
		while (pointer.parentElement !== dom.documentElement) {
			parents.push((pointer = pointer.parentElement!));
			pointer.classList.add('open');
		}

		let openItems: Item[] = [];
		for (const domItem of domOpenItems) {
			const item = domToItemMap.get(domItem);
			openItems.push(item!);
		}

		return openItems;
	}

	describe('nextSibling', () => {
		it('array', () => {
			const nextSibling = nextSibling_array();
			expect(arr[0]!.subitems![0]!.subitems![1]!).toStrictEqual(nextSibling);
		});

		it('dom', () => {
			const nextSibling = nextSibling_dom();
			expect(arr[0]!.subitems![0]!.subitems![1]!).toStrictEqual(nextSibling);
		});
	});

	describe('parent and nextSibling', () => {
		it('array', () => {
			const result = parentAndNextSibling_array();
			expect(arr[0]!.subitems![1]).toStrictEqual(result);
		});

		it('dom', () => {
			const result = parentAndNextSibling_dom();
			expect(arr[0]!.subitems![1]).toStrictEqual(result);
		});
	});

	describe('closest', () => {
		it('array', () => {
			const result = closest_array();
			expect(arr[0]!).toStrictEqual(result);
		});

		it('dom', () => {
			const result = closest_dom();
			expect(arr[0]!).toStrictEqual(result);
		});
	});

	describe('openItems1', () => {
		it('array', () => {
			const result = openItems__array(itemToOpen1);
			expect([arr[0]!, arr[0]!.subitems![0]!, arr[0]!.subitems![0]!.subitems![0]!]).toStrictEqual(
				result
			);
		});

		it('dom', () => {
			const result = openItems__dom(itemToOpen1);
			expect([arr[0]!, arr[0]!.subitems![0]!, arr[0]!.subitems![0]!.subitems![0]!]).toStrictEqual(
				result
			);
		});
	});

	describe('openItems2', () => {
		it('array', () => {
			const result = openItems__array(itemToOpen2);
			expect([arr[0]!, arr[0]!.subitems![1]!, arr[0]!.subitems![1]!.subitems![0]!]).toStrictEqual(
				result
			);
		});

		it('dom', () => {
			const result = openItems__dom(itemToOpen2);
			expect([arr[0]!, arr[0]!.subitems![1]!, arr[0]!.subitems![1]!.subitems![0]!]).toStrictEqual(
				result
			);
		});
	});

	afterAll(async () => {
		const bench = new Bench({
			time: 1000
		});
		bench.add('nextSibling > array', () => {
			nextSibling_array();
		});
		bench.add('nextSibling > dom', () => {
			nextSibling_dom();
		});
		bench.add('parent and nextSibling > array', () => {
			parentAndNextSibling_array();
		});
		bench.add('parent and nextSibling > dom', () => {
			parentAndNextSibling_dom();
		});
		bench.add('closest > array', () => {
			closest_array();
		});
		bench.add('closest > dom', () => {
			closest_dom();
		});
		bench.add('openItems1 > array', () => {
			openItems__array(itemToOpen1);
		});
		bench.add('openItems1 > dom', () => {
			openItems__dom(itemToOpen1);
		});
		bench.add('openItems2 > array', () => {
			openItems__array(itemToOpen2);
		});
		bench.add('openItems2 > dom', () => {
			openItems__dom(itemToOpen2);
		});
		await bench.run();
		console.table(bench.table());
	});
});

interface Item {
	value: string;
	subitems?: Item[];
}
