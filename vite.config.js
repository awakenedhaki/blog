import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The SvelteKit plugin is all this blog needs from Vite; mdsvex is wired in
// through svelte.config.js as a Svelte preprocessor, not as a Vite plugin.
export default defineConfig({
	plugins: [sveltekit()]
});
