const cancelMap = new WeakMap<object, DebounceState>();

/**
 * @param delay
 * @returns a promise that resolves to a function that returns `true` if the execution has been overlapped by another execution with the same key
 */
export function debounce(options: {
	delay?: number;
	key?: Function | symbol | object;
}): PromiseLike<() => HasOverlap> {
	const p = new Promise<() => HasOverlap>((resolve) => {
		const key = (options.key ?? Symbol('debounce default key')) as any;

		if (cancelMap.has(key)) {
			const state = cancelMap.get(key)!;
			// an existing execution with the defined key already exists
			state.hasOverlap = true;
			state.resolve(() => state.hasOverlap);
			clearTimeout(state.timeout!);
		}

		const state: DebounceState = {
			resolve,
			hasOverlap: false
		};

		cancelMap.set(key, state);

		if (options.delay) {
			state.timeout = setTimeout(() => {
				state.timeout = null;

				resolve(() => state.hasOverlap);
			}, options.delay);
		} else {
			resolve(() => state.hasOverlap);
		}
	});

	return p;
}

interface DebounceState {
	resolve: (v: () => HasOverlap) => void;
	timeout?: ReturnType<typeof setTimeout> | null;
	hasOverlap: HasOverlap;
}

export type HasOverlap = boolean;
