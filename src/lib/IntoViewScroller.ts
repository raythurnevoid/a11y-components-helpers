import ElementInViewChecker from './ElementInViewChecker.js';

export class IntoViewScroller {
	elementInViewChecker?: ElementInViewChecker;

	constructor(root: Element) {
		if (!('scrollIntoViewIfNeeded' in document.body)) {
			this.elementInViewChecker = new ElementInViewChecker(root);
		}
	}

	async scrollIntoView(el: HTMLElement) {
		if ('scrollIntoViewIfNeeded' in el) {
			(el as any).scrollIntoViewIfNeeded();
		} else {
			if (await this.elementInViewChecker!.check(el)) {
				el.scrollIntoView({
					block: 'nearest'
				});
			}
		}
	}

	destroy() {
		this.elementInViewChecker?.destroy();
	}
}
