import { findOptionToActivateWithFilter } from './find-option-to-activate-with-filter.js';

export class InputBackgroundTimedFilter {
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
		return findOptionToActivateWithFilter(options, startingPoint, true, filterFn);
	}
}
