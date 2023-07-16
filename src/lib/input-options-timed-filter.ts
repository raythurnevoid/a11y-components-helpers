export class InputOptionsTimedFilter {
	#filter: string = '';
	#timeout: ReturnType<typeof setTimeout> | null = null;

	/**
	 * The current filter string. This is reset after 1 second of inactivity.
	 */
	get filter(): string {
		return this.#filter;
	}

	addChar(char: string): void {
		this.#filter += char;

		if (this.#timeout) {
			clearTimeout(this.#timeout);
		}

		this.#timeout = setTimeout(() => {
			this.#filter = '';
		}, 1000);
	}

	find(
		options: string[],
		startingPoint: string | null | undefined,
		filterFn: (option: string) => boolean
	) {
		let result: string | undefined = undefined;

		const itemsToSearchFirst = startingPoint
			? options.slice(options.indexOf(startingPoint) + 1)
			: null;

		if (itemsToSearchFirst) {
			result = itemsToSearchFirst.find(filterFn);
		}

		if (!result && itemsToSearchFirst) {
			const itemsToSearchAfter = startingPoint
				? options.slice(0, options.indexOf(startingPoint) + 1)
				: options;
			result = itemsToSearchAfter.find(filterFn);
		}

		return result ?? startingPoint ?? undefined;
	}
}
