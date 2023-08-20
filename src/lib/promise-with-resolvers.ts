export function createPromiseWithResolvers<T = unknown>() {
		let resolve: (value: T) => void = undefined as any;
		let reject: () => void = undefined as any;
		const promise = new Promise<T>((res, rej) => {
				resolve = res;
				reject = rej;
		});
		
		return {
				promise,
				resolve,
				reject
		};
}