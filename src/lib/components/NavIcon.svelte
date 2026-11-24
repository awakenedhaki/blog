<script>
	/**
	 * NavIcon — the small glyph beside each header link.
	 *
	 * Drawn inline rather than pulled from Font Awesome, which is what your
	 * Hugo theme uses. FixIt loads the whole Font Awesome kit from a CDN for
	 * what is, here, five glyphs: that is an external request on every page
	 * load, a render-blocking stylesheet, and a third party in the critical
	 * path — a poor trade for a static site that currently downloads no fonts
	 * at all. These are the same shapes, as paths.
	 *
	 * Icons are stroked, not filled, so they inherit `currentColor` and match
	 * the weight of the text they sit beside at any size.
	 *
	 * @param {string} name - one of the keys in ICONS
	 * @param {number} size - edge length in px
	 */
	let { name, size = 15 } = $props();

	// One 24x24 grid for every glyph so they align optically on a single row.
	const ICONS = {
		// Posts — an archive box (FixIt's menu default for the posts entry)
		posts: 'M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M3 4h18v3H3zM10 12h4',
		// Topics — stacked layers, for the several ways to slice the archive
		topics: 'M12 3 3 7.5l9 4.5 9-4.5L12 3ZM3 12.5 12 17l9-4.5M3 17l9 4.5 9-4.5',
		// About — a person
		about: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
		// Series — an ordered list, because a series has a reading order
		series: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
		// Tag — a luggage tag with its eyelet
		tag: 'M11 3H4a1 1 0 0 0-1 1v7l9.5 9.5a1.5 1.5 0 0 0 2.1 0l6.9-6.9a1.5 1.5 0 0 0 0-2.1L11 3ZM7 7h.01',
		// Year — a calendar
		year: 'M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6ZM3 10h18M8 3v4M16 3v4'
	};
</script>

<svg
	class="nav-icon"
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	<path d={ICONS[name]} />
</svg>

<style>
	.nav-icon {
		display: block;
		flex: none;
		opacity: 0.75; /* the label leads; the glyph supports it */
	}
</style>
