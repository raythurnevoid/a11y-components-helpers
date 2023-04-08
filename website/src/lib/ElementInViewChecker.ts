export default class ElementInViewChecker {
	#observer: IntersectionObserver;
	#map = new WeakMap<Element, (isIntersecting: boolean) => void>();

	constructor(root: Element) {
		this.#observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (this.#map.has(entry.target)) {
						const callback = this.#map.get(entry.target)!;

						callback(entry.isIntersecting);

						this.#map.delete(entry.target);
					}

					this.#observer.unobserve(entry.target);
				});
			},
			{
				root,
				threshold: 1
			}
		);
	}

	async check(target: Element) {
		return new Promise<boolean>((resolve) => {
			this.#map.set(target, resolve);
			this.#observer.observe(target);
		});
	}

	destroy() {
		this.#observer.disconnect();
	}
}
