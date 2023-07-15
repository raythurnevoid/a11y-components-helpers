const observersMap = new WeakMap<HTMLElement, IntersectionObserver>();
const pendingMap = new WeakMap<HTMLElement, [() => void, HTMLElement]>();

export async function scrollIntoView(root: HTMLElement, el: HTMLElement) {
	if ('scrollIntoViewIfNeeded' in el) {
		(el as any).scrollIntoViewIfNeeded(false);
	} else {
		let intersectionObserver = observersMap.get(root);

		if (!intersectionObserver) {
			intersectionObserver = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						const target = entry.target as HTMLElement;
						if (!entry.isIntersecting) {
							target.scrollIntoView({
								block: 'nearest'
							});
						}
						intersectionObserver?.unobserve(target);
						pendingMap.get(root)![0]!();
					});
				},
				{
					root,
					threshold: 1
				}
			);

			observersMap.set(root, intersectionObserver);
		}

		return new Promise<void>((resolve) => {
			const pending = pendingMap.get(root);
			const currentCb = pending?.[0];
			const currentTarget = pending?.[1];

			pendingMap.set(root, [
				() => {
					pendingMap.delete(root);
					currentCb?.();
					resolve();
				},
				el
			]);

			if (currentTarget !== el) {
				if (currentTarget) intersectionObserver?.unobserve(currentTarget);
				intersectionObserver?.observe(el);
			}
		});
	}
}
