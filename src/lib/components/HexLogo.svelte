<script>
	/**
	 * HexLogo — the site mark, an R-package hex sticker, drawn as a line icon:
	 * an ink outline and ink points, with the fitted line as a muted second
	 * stroke, and no fill.
	 *
	 * Same geometry as static/favicon.svg (pointy-top regular hexagon, the
	 * 2/sqrt(3) ratio of R's canonical 43.9x50.8mm sticker), but drawn with the
	 * site's CSS variables instead of literal colours. The two files are kept
	 * separate on purpose: a favicon is rendered by the browser chrome, where
	 * the stylesheet does not reach, so it must carry its own palette. This one
	 * lives inside the page and should follow the theme toggle like everything
	 * else — one shape, two colour strategies, for two different contexts.
	 *
	 * @param {number} size - rendered height in px (width follows the ratio)
	 */
	let { size = 26 } = $props();
</script>

<svg
	class="hex"
	viewBox="0 0 100 115.47"
	height={size}
	width={size / 1.1547}
	aria-hidden="true"
	focusable="false"
>
	<!-- inset by half the stroke so the outline is not clipped by the viewBox -->
	<polygon class="outline" points="50,4 96.5,30.85 96.5,84.62 50,111.47 3.5,84.62 3.5,30.85" />
	<path class="line" d="M20 78 L44 60 L60 68 L80 38" />
	<circle class="point" cx="20" cy="78" r="7" />
	<circle class="point" cx="44" cy="60" r="7" />
	<circle class="point" cx="60" cy="68" r="7" />
	<circle class="point" cx="80" cy="38" r="7" />
</svg>

<style>
	.hex {
		display: block;
		flex: none; /* never let a flex row squash the mark out of ratio */
	}
	/* The studio's icon rule: page background, ink drawing, muted second
	   stroke. No filled plate. */
	.outline {
		fill: none;
		stroke: var(--ink);
		stroke-width: 7;
		stroke-linejoin: round;
	}
	.line {
		fill: none;
		stroke: var(--muted);
		stroke-width: 6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.point {
		fill: var(--ink);
	}
</style>
