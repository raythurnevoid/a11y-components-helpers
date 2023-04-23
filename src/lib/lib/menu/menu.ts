export class TemporaryOnKeyDownFilterStore {
	#filter: string = '';
	#timeout: ReturnType<typeof setTimeout> | null = null;
	#isWordCharRegex: RegExp = /\w/;

	/**
	 * The current filter string. This is reset after 1 second of inactivity.
	 */
	get filter(): string {
		return this.#filter;
	}

	#addChar(char: string): void {
		this.#filter += char;

		if (this.#timeout) {
			clearTimeout(this.#timeout);
		}

		this.#timeout = setTimeout(() => {
			this.#filter = '';
		}, 1000);
	}

	/**
	 * handle word character keydown events and return true.
	 * @param event
	 * @returns `true` if the event was fired with a valid word character. Otherwise `false`.
	 */
	handleOnKeyDown(event: KeyboardEvent): boolean {
		if (event.key !== 'Tab' && event.key.match(this.#isWordCharRegex)) {
			this.#addChar(event.key);
			return true;
		}

		return false;
	}
}
