// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['svelte-chartjs', 'jspdf', 'jspdf-autotable']
	},
	build: {
		rollupOptions: {
			external: [],
			output: {
				globals: {}
			}
		}
	},
	ssr: {
		noExternal: ['svelte-chartjs']
	}
});
