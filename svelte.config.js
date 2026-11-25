import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import { figureImports } from './figure-imports.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Treat `.md` files as compilable Svelte components so posts can be written
	// in Markdown yet still embed interactive components (CodeTabs, Callout...).
	extensions: ['.svelte', '.md'],

	// mdsvex turns Markdown + frontmatter into Svelte components and runs Shiki
	// for syntax highlighting (configured in mdsvex.config.js).
	preprocess: [mdsvex(mdsvexConfig), figureImports()],

	kit: {
		// adapter-static prerenders the whole site to plain HTML/CSS/JS so it can
		// be hosted for free on GitHub Pages, Netlify, Vercel, etc. A blog has no
		// server-side needs, so this is the lightest, fastest, cheapest option.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			// GitHub Pages serves 404.html for any address it cannot find, so
			// mistyped and stale links get the site's own error page (with ways
			// back) instead of GitHub's.
			fallback: '404.html',
			precompress: false,
			strict: true
		}),

		prerender: {
			// Pages no other page links to, so the crawl from / never finds them:
			// the app privacy policies Google Play links to.
			entries: ['*', '/apps/sudoku/privacy/'],

			// Post, tag and series pages exist only once a post (or a series in
			// src/lib/site.js) does, so on an empty blog these routes legitimately
			// render nothing. Any other route that goes unseen is still an error.
			handleUnseenRoutes: ({ routes, message }) => {
				const empty = new Set(['/blog/[slug]', '/tags/[tag]', '/series/[id]']);
				if (routes.some((route) => !empty.has(route))) throw new Error(message);
			}
		}
	}
};

export default config;
