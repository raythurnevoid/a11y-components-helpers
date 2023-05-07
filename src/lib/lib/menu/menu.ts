export class TemporaryOnKeyDownFilterStore {
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
}
