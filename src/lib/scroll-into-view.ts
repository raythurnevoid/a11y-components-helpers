const scrollIntoViewObserversMap = new WeakMap<HTMLElement, IntersectionObserver>();
const scrollIntoViewPendingMap = new WeakMap<HTMLElement, [() => void, HTMLElement]>();

export async function scrollIntoView(root: HTMLElement, el: HTMLElement) {
	if ('scrollIntoViewIfNeeded' in el) {
		(el as any).scrollIntoViewIfNeeded(false);
	} else {
		let intersectionObserver = scrollIntoViewObserversMap.get(root);

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
						scrollIntoViewPendingMap.get(root)![0]!();
					});
				},
				{
					root,
					threshold: 1
				}
			);

			scrollIntoViewObserversMap.set(root, intersectionObserver);
		}

		return new Promise<void>((resolve) => {
			const pending = scrollIntoViewPendingMap.get(root);
			const currentCb = pending?.[0];
			const currentTarget = pending?.[1];

			scrollIntoViewPendingMap.set(root, [
				() => {
					scrollIntoViewPendingMap.delete(root);
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
