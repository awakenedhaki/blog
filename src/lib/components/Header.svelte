<script>
	/**
	 * Site header. The wordmark sits on a short baseline rule with tick marks —
	 * a quiet nod to a chart axis that recurs across the site.
	 */
	import { site } from '$lib/site.js';
	import ThemeMenu from './ThemeMenu.svelte';
	import SearchBar from './SearchBar.svelte';
	import TopicsMenu from './TopicsMenu.svelte';
	import HexLogo from './HexLogo.svelte';
	import NavIcon from './NavIcon.svelte';
	import { page } from '$app/state';

	// The section the reader is in: the item's own page or anything under it.
	// Every href ends in a slash (trailingSlash: 'always'), so one prefix
	// test covers both.
	const isCurrent = (href) => page.url.pathname.startsWith(href);
</script>

<header>
	<div class="wrap bar">
		<a class="wordmark" href="/">
			<HexLogo size={28} />
			<span>{site.name}<span class="cursor" aria-hidden="true">_</span></span>
		</a>
		<nav aria-label="Main">
			{#each site.nav as item}
				{#if item.menu === 'browse'}
					<!-- Data-driven: an item carrying `menu` renders as a dropdown
					     rather than a plain link. Adding another menu later is a
					     site.js edit plus one branch, not a rewrite of this file. -->
					<TopicsMenu icon={item.icon} />
				{:else}
					<a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
						<NavIcon name={item.icon} />
						<span>{item.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Dotted rule: navigation on one side, controls on the other. The
			     two groups do different jobs, and a divider says so faster than
			     spacing alone. aria-hidden because it is purely visual — the
			     separation is already implied by the controls' own labels. -->
			<span class="divider" aria-hidden="true"></span>

			<SearchBar />
			<ThemeMenu />
		</nav>
	</div>
</header>

<style>
	header {
		position: sticky;
		/* Flat: the page colour with a hairline below, always opaque, so the
		   search scrim never shows through and nothing blurs underneath. */
		border-bottom: 1px solid var(--divider);
		background: var(--page);
		top: 0;
		z-index: 10;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-block: 0.8rem;
	}

	.wordmark {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: var(--type-title-l);
		color: var(--ink);
		text-decoration: none;
	}
	.cursor {
		color: var(--muted);
	}

	nav {
		display: flex;
		align-items: center;
		gap: 1.1rem;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		gap: 0.4rem;
		font-size: var(--type-body);
		color: var(--ink);
		text-decoration: none;
	}
	nav a:hover {
		text-decoration-line: underline;
	}
	/* The current section: a 2px accent underline under the label. */
	nav a[aria-current='page'] span {
		text-decoration: underline 2px var(--accent);
		text-underline-offset: 0.35em;
	}

	.divider {
		align-self: center;
		width: 0;
		height: 1.3rem;
		/* A dotted BORDER rather than a dotted background gradient: borders
		   render their dots at consistent spacing across browsers and scale
		   with the user's zoom, which background-image dots do not. */
		border-left: 2px dotted var(--divider);
		margin-inline: 0.3rem;
	}

	/* Narrow screens: the bar was wider than the viewport (the original cause
	   of mobile side-scroll). Let nav wrap onto a second row and tighten
	   spacing instead of overflowing. */
	@media (max-width: 640px) {
		.bar {
			flex-wrap: wrap;
			row-gap: 0.35rem;
			padding-block: 0.6rem;
		}
		nav {
			flex-wrap: wrap;
			gap: 0.7rem;
			margin-left: auto;
		}
		.divider {
			display: none;   /* no room for it once the bar wraps */
		}
	}
</style>
