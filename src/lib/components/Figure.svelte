<script>
	/**
	 * Figure — embed a ggplot2/matplotlib figure that scales with the screen
	 * and follows the light/dark theme.
	 *
	 * Usage in a post:
	 *
	 *   <Figure
	 *     src="mass-by-species.svg"
	 *     alt="Jittered body masses by species with group means"
	 *     caption="Every observation behind the group means." />
	 *
	 * Put the exported file in the post's own folder, beside its index.md.
	 * SVGs are inlined and re-themed (see lib/figures.js); PNG/JPG/WebP fall
	 * back to a plain responsive image, with an optional `darkSrc` second
	 * export swapped in by CSS when the dark theme is active.
	 *
	 * Props
	 *   src     : a file in the post's folder (e.g. "fig1.svg")
	 *   alt     : REQUIRED — what the figure shows, for screen readers
	 *   caption : optional visible caption under the figure
	 *   darkSrc : raster only — a dark-theme variant filename
	 *   colors  : SVG only — extra { '#hex': 'css-value' } recolouring rules
	 *             for figures that use non-default chrome colours
	 *
	 * Set by the build (figure-imports.js), never by hand, from the files in
	 * the post's folder:
	 *   markup  : an SVG's text
	 *   url     : a raster's asset URL
	 *   darkUrl : the dark-theme raster's asset URL
	 * None of them set means the file was not found.
	 */
	import { dev } from '$app/environment';
	import { prepareSvg } from '$lib/figures.js';

	let {
		src,
		alt = '',
		caption = '',
		darkSrc = '',
		colors = {},
		markup = '',
		url = '',
		darkUrl = ''
	} = $props();

	// A figure with no text alternative leaves screen-reader users with nothing.
	// Writing locally it is a warning; a production build (which prerenders
	// every page, and so reads this) stops on it.
	function requireAlt(src, alt) {
		if (alt.trim()) return alt;
		const message = `Figure "${src}" has no alt text.`;
		if (dev) console.warn(message);
		else throw new Error(message);
		return '';
	}
	const label = $derived(requireAlt(src, alt));

	const figure = $derived(
		markup ? { kind: 'svg', markup } : url ? { kind: 'raster', url } : null
	);
	const darkFigure = $derived(darkUrl ? { kind: 'raster', url: darkUrl } : null);
	const svgMarkup = $derived(
		figure?.kind === 'svg' ? prepareSvg(figure.markup, colors, src, label) : ''
	);
</script>

<figure class="figure">
	{#if !figure}
		<!-- loud, not silent: a missing file should be obvious during writing -->
		<p class="missing meta">Figure not found: {src} (put it in this post's folder)</p>
	{:else if figure.kind === 'svg'}
		<div class="svg-host">
			{@html svgMarkup}
		</div>
	{:else}
		<img class:light-only={darkFigure} src={figure.url} alt={label} loading="lazy" decoding="async" />
		{#if darkFigure}
			<img class="dark-only" src={darkFigure.url} alt={label} loading="lazy" decoding="async" />
		{/if}
	{/if}

	{#if caption}
		<figcaption class="meta">{caption}</figcaption>
	{/if}
</figure>

<style>
	.figure {
		margin: 2rem 0;
	}

	/*
	 * Default colours for the inlined figure.
	 *
	 * These exist because colour SUBSTITUTION alone cannot theme a figure:
	 * it can only rewrite a colour that is actually written down. matplotlib
	 * omits `fill` on <text> entirely when the colour is default black,
	 * relying on SVG's initial `fill: black`. There is no hex to match, so
	 * every axis label, tick label and legend entry stayed black — invisible
	 * against the dark theme — while the strokes around them recoloured
	 * correctly. That asymmetry is exactly what "the palette does not change"
	 * looks like in practice.
	 *
	 * A stylesheet rule fixes it without touching the figures: any text that
	 * declares its own colour does so in an inline `style` attribute, which
	 * wins over this rule by CSS precedence. So deliberately-coloured labels
	 * (the value annotations on a heatmap, say) keep their fixed colour, and
	 * only the ones that never specified one inherit the theme.
	 *
	 * `:global` is required — the SVG arrives through {@html}, so Svelte's
	 * scoping never sees these elements to add its class to them.
	 */
	.svg-host :global(text),
	.svg-host :global(tspan) {
		fill: var(--ink);
	}

	/* Reapplies the two properties matplotlib ships in a <style> block that
	   prepareSvg strips. Left in place, that block's universal selector
	   escaped the figure and restyled every other SVG on the page. */
	.svg-host :global(svg) {
		stroke-linejoin: round;
		stroke-linecap: butt;
	}

	/* The inlined SVG kept its viewBox but lost its fixed size, so it scales
	   fluidly to the prose column — sharp at any width and pixel density. */
	.svg-host :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}

	img {
		width: 100%;
		height: auto;
		display: block;
		border-radius: var(--radius-card);
	}

	/* Raster light/dark pair: CSS swaps which one is visible.
	   (Both files download — one of the honest costs of the raster fallback.) */
	:global(html.dark) .light-only {
		display: none;
	}
	.dark-only {
		display: none;
	}
	:global(html.dark) .dark-only {
		display: block;
	}

	figcaption {
		margin-top: 0.6rem;
		text-align: center;
	}

	.missing {
		border: 1px dashed var(--error);
		border-radius: var(--radius-card);
		padding: 1rem;
	}
</style>
