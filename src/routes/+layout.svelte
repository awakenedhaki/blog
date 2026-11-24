<script>
	/**
	 * Root layout: loads global CSS once, frames every page with the header
	 * and footer.
	 *
	 * No font imports. The type stack is the reader's own system UI font (see
	 * --font-body in app.css), matching FixIt. That removes four @fontsource
	 * packages and every webfont request: nothing to download, nothing to
	 * block first paint, no flash of fallback type.
	 */
	/*
	 * KaTeX's stylesheet. Self-hosted through the npm package rather than a CDN
	 * link, so there is no third-party request and the version is pinned by the
	 * lockfile.
	 *
	 * This is the one webfont concession on the site: KaTeX ships its own math
	 * faces and there is no system fallback that renders integrals and matrices
	 * acceptably. Browsers fetch only the few faces a page actually references,
	 * so a post with no math downloads no math fonts.
	 */
	import 'katex/dist/katex.min.css';
	import '../app.css';

	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SearchScrim from '$lib/components/SearchScrim.svelte';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { handleCopyButtons, revealCopyButtons } from '$lib/copy-code.js';

	let { children } = $props();

	// Code-block copy buttons: one listener for the site, and each page's
	// buttons revealed once it is on screen. The outcome is read out through
	// the status line at the bottom of this file.
	let copyStatus = $state('');
	$effect(() =>
		handleCopyButtons((message) => {
			copyStatus = '';
			// A fresh string each time, so copying twice is announced twice.
			setTimeout(() => (copyStatus = message), 30);
		})
	);
	afterNavigate(() => revealCopyButtons());

	/*
	 * Page change: a short crossfade, through the View Transitions API where
	 * the browser has it. Elsewhere, or for readers who ask for reduced
	 * motion, the page simply swaps. The browser's own crossfade is used; its
	 * length is set in app.css.
	 */
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<!-- First in the tab order: past the header straight to the page. Hidden
     until focused. -->
<a class="skip" href="#content">Skip to content</a>
<SearchScrim />
<Header />

<!-- Same `.wrap` as the header and footer: one container governs the site's
     left and right edges, so the article text, the navbar wordmark and the
     footer all start on the same vertical line. -->
<!-- tabindex="-1" lets the skip link move focus here, not just scroll. -->
<main class="wrap" id="content" tabindex="-1">
	{@render children()}
</main>

<Footer />

<p class="visually-hidden" role="status">{copyStatus}</p>

<style>
	main {
		padding-block: 3.75rem;  /* was 2.5rem — the page felt pinned to the header */
		min-height: 60vh;
	}
	/* Focus lands on main only by the skip link, so no ring around the page. */
	main:focus {
		outline: none;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.skip {
		position: absolute;
		left: var(--space-4);
		top: var(--space-2);
		z-index: 40; /* above the header (10) and the search popup (30) */
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 0 var(--space-4);
		border-radius: var(--radius-pill);
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
		text-decoration: none;
		transform: translateY(-200%);
	}
	.skip:focus {
		transform: none;
	}
</style>
