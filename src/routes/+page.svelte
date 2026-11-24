<script>
	/**
	 * Home page.
	 *
	 * The hero is the site's signature: a small residual plot (points, a fitted
	 * line, and the vertical residual segments) — what's left over once the
	 * model has had its say. It is static: points in ink, residuals as muted
	 * dashes, axes as dividers, and the fitted line in the accent, because the
	 * model is the one live element.
	 */
	import { site, themes } from '$lib/site.js';
	import { posts } from '$lib/posts.js';
	import PostCard from '$lib/components/PostCard.svelte';
	import SocialLinks from '$lib/components/SocialLinks.svelte';

	// Plot data: (x, y) points and their fitted values on the line y = 20 + 0.5x.
	// Residual segments connect each observed point to its fitted value.
	const pts = [
		{ x: 30, y: 118 }, { x: 75, y: 82 }, { x: 120, y: 96 },
		{ x: 165, y: 55 }, { x: 210, y: 68 }, { x: 255, y: 30 }
	];
	const fit = (x) => 130 - 0.38 * x; // the "model": a simple downward trend
	const recent = posts.slice(0, 3);
</script>

<svelte:head>
	<title>{site.name} — {site.tagline}</title>
	<meta name="description" content={site.description} />
</svelte:head>

<section class="hero">
	<div class="copy">
		<p class="meta"><span aria-hidden="true">#</span> a data-science blog for researchers</p>
		<h1>{site.name}</h1>
		<p class="tagline">
			{site.tagline} — tutorials, paper reviews, visualisation and coding
			challenges, in <strong>R</strong> and <strong>Python</strong> side by side.
		</p>
		<div class="socials-row">
			<SocialLinks />
		</div>

		<p class="meta themes-line">
			{#each themes as t, i}{i ? ' · ' : ''}<a href={`/topics/${t.id}/`}>{t.label.toLowerCase()}</a>{/each}
		</p>
	</div>

	<!-- the residual plot: decorative, so hidden from assistive tech -->
	<svg class="plot" viewBox="0 0 290 160" aria-hidden="true">
		<!-- axes -->
		<line x1="10" y1="150" x2="285" y2="150" class="axis" />
		<line x1="10" y1="150" x2="10" y2="5" class="axis" />
		<!-- residual segments: observed point -> fitted value -->
		{#each pts as p}
			<line x1={p.x} y1={p.y} x2={p.x} y2={fit(p.x)} class="residual" />
		{/each}
		<!-- fitted line -->
		<line x1="20" y1={fit(20)} x2="270" y2={fit(270)} class="fitline" />
		<!-- observed points -->
		{#each pts as p}
			<circle cx={p.x} cy={p.y} r="4.5" class="point" />
		{/each}
	</svg>
</section>

<section>
	<h2 class="section-title"><span class="meta"></span><span aria-hidden="true">##</span> Latest posts</h2>
	{#each recent as post}
		<PostCard {post} />
	{/each}
	<p class="all-link"><a href="/blog/">All posts →</a></p>
</section>

<style>
	.socials-row {
		margin: 1.25rem 0 0.25rem;
	}

	.hero {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 2.5rem;
		align-items: center;
		padding-block: 2rem 3.5rem;
		border-bottom: 1px solid var(--divider);
	}

	h1 {
		font-size: var(--type-display);
		letter-spacing: var(--tracking-display);
		margin: 0.4rem 0 0.8rem;
	}

	.tagline {
		font-size: var(--type-body-l);
		color: var(--muted);
		max-width: 32rem;
	}

	.themes-line a {
		color: var(--ink);
		text-decoration: none;
	}
	.themes-line a:hover {
		text-decoration-line: underline;
	}

	/* --- the plot ---------------------------------------------------------- */
	.plot {
		width: 100%;
		max-width: 22rem;
		justify-self: end;
	}
	.axis {
		stroke: var(--divider);
		stroke-width: 1.5;
	}
	.point {
		fill: var(--ink);
	}
	.residual {
		stroke: var(--muted);
		stroke-width: 1.5;
		stroke-dasharray: 3 3;
	}
	.fitline {
		stroke: var(--accent);
		stroke-width: 2;
	}

	.section-title {
		font-size: var(--type-headline);
		margin-top: 2.5rem;
	}

	.all-link {
		margin-top: 1.4rem;
	}

	@media (max-width: 720px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.plot {
			justify-self: start;
			max-width: 18rem;
		}
	}
</style>
