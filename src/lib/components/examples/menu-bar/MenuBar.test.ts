if (import.meta.vitest) {
	const { describe, it } = import.meta.vitest;

	describe('MenuBar', () => {
		it('should log test', () => {
			console.log('test');
		});
	});
}
