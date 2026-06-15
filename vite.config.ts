import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dsv from "@rollup/plugin-dsv";

export default defineConfig({
	plugins: [
		enhancedImages(),
		sveltekit(),
		dsv({
			processRow: (row) => {
				Object.keys(row).forEach((key) => {
					const value = row[key];
					// @ts-ignore - intentionally converting numeric strings to numbers
					row[key] = isNaN(+value) ? value : +value;
				});
			}
		})
	]
});
