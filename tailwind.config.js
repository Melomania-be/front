/** @type {import('tailwindcss').Config} */
import { addDynamicIconSelectors } from '@iconify/tailwind';

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				customGray: '#989898',
				bgGray: '#ECECEC'
			}
		}
	},
	plugins: [
		addDynamicIconSelectors(),
		require('@tailwindcss/typography')
	]
};
