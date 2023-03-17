const cancelMap = new WeakMap<object, DebounceState>();

/**
 * @param delay
 * @returns a promise that resolves to a function that returns `true` if the execution has been overlapped by another execution with the same key
 */
export function debounce(options: {
	key?: Function | symbol | object;
	delay?: number;
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
			waitFor({ delay: options.delay }).then(() => {
				resolve(() => state.hasOverlap);
			});
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

export async function waitFor(
	options:
		| {
				dependency: () => Promise<CanContinue>;
		  }
		| {
				delay: number;
		  }
) {
	if ('dependency' in options) {
		while (!(await options.dependency())) {}
	} else if ('delay' in options) {
		await new Promise((resolve) => setTimeout(resolve, options.delay));
	}
}

export type CanContinue = boolean;
