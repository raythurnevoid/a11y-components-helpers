export function findOptionToActivateWithFilter(
	options: string[],
	startingPoint: string | null | undefined,
	lookForward: boolean,
	filterFn: (option: string) => boolean
) {
	let result: string | undefined = undefined;

	const indexModifier = lookForward ? 1 : 0;
	const itemsToSearchFirst = startingPoint
		? options.slice(options.indexOf(startingPoint) + indexModifier)
		: options;

	if (itemsToSearchFirst) {
		result = itemsToSearchFirst.find(filterFn);
	}

	if (!result && itemsToSearchFirst) {
		const itemsToSearchAfter = startingPoint
			? options.slice(0, options.indexOf(startingPoint) + indexModifier)
			: null;
		if (itemsToSearchAfter) {
			result = itemsToSearchAfter.find(filterFn);
		}
	}

	return result;
}
