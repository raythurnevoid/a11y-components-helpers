import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const entry = ['./src/lib/lib/combobox/autocomplete.ts'];

export default defineConfig({
	plugins: [
		dts({
			include: entry
		})
	],
	build: {
		lib: {
			entry,
			formats: ['es']
		},
		target: 'esnext',
		ssr: true,
		minify: false,
		rollupOptions: {
			output: {
				preserveModules: true
			}
		}
	}
});
