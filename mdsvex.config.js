import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import GithubSlugger from 'github-slugger';
import { bundledThemes, createHighlighter } from 'shiki';

/*
 * Build-time table of contents
 * ----------------------------
 * The TOC used to be assembled in the browser by querying the DOM after the
 * article mounted. That had three costs worth naming:
 *   1. It was absent from the prerendered HTML entirely, so it did not exist
 *      for crawlers, for readers with JS blocked, or during the first paint.
 *   2. It appeared a frame late, shifting the layout on every article load.
 *   3. It could only ever produce a FLAT list, because reconstructing nesting
 *      from a DOM query means re-deriving structure the Markdown already had.
 *
 * Extracting the headings here — while the Markdown syntax tree is still a
 * tree — fixes all three. The result is attached to the post's frontmatter as
 * `headings`, so it travels with the rest of the metadata and the component
 * just renders it.
 *
 * Slug parity: we use github-slugger, the same library rehype-slug uses, and
 * run it over the headings in document order. That produces byte-identical
 * ids, including the `-1`, `-2` suffixes it appends to duplicate headings —
 * so TOC links and heading anchors can never drift apart.
 */

/** Recursively collect the visible text of a Markdown node. */
function nodeText(node) {
	// Leaf nodes carry the text directly ('text', 'inlineCode').
	if (typeof node.value === 'string') return node.value;
	// Branch nodes ('strong', 'emphasis', 'link'…) hold it in their children.
	if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
	return '';
}

/** Walk every node in an mdast tree, applying `fn`. Avoids a unist-util dep. */
function walk(node, fn) {
	fn(node);
	if (Array.isArray(node.children)) for (const child of node.children) walk(child, fn);
}

/**
 * Nest a flat [{level, ...}] list so each h3 becomes a child of the h2 above
 * it. An h3 that appears before any h2 is promoted to top level rather than
 * dropped — a malformed article should still get a usable contents list.
 */
function nestHeadings(flat) {
	const roots = [];
	for (const heading of flat) {
		const parent = roots[roots.length - 1];
		if (heading.level === 3 && parent) parent.children.push(heading);
		else roots.push(heading);
	}
	return roots;
}

/**
 * rehype plugin: make KaTeX output safe for the Svelte compiler.
 *
 * mdsvex hands its HTML to Svelte, which treats `{` as the start of a template
 * expression. KaTeX output contains braces in two distinct places, and both
 * break the build with errors that name the maths rather than the cause:
 *
 *   1. <annotation encoding="application/x-tex"> stores the ORIGINAL TeX, so
 *      `\text{Var}` survives verbatim and Svelte reports "Var is not defined".
 *      The annotation is only a machine-readable copy of the source; nothing
 *      about rendering or accessibility uses it, so it is removed.
 *
 *   2. Genuine mathematical braces — set-builder notation like `\{p_i > λ\}`
 *      — are rendered as MathML <mo>{</mo>. These are real content and cannot
 *      be deleted, so they are rewritten to `{'{'}`, a Svelte expression whose
 *      value is the literal character. The rendered page is identical.
 *
 * The escaping is scoped to KaTeX subtrees. Applying it document-wide would
 * corrupt every code block on the site, since a Python dict or an R list is
 * full of braces that mdsvex already escapes correctly by another route.
 */
function rehypeKatexForSvelte() {
	const isKatex = (node) => {
		if (node.type !== 'element') return false;
		if (node.tagName === 'math') return true;
		const className = node.properties?.className ?? [];
		const list = Array.isArray(className) ? className : [className];
		return list.some((c) => typeof c === 'string' && c.startsWith('katex'));
	};

	return (tree) => {
		const walk = (node, insideMath) => {
			if (!Array.isArray(node.children)) return;

			node.children = node.children.filter(
				(child) => !(child.type === 'element' && child.tagName === 'annotation')
			);

			for (const child of node.children) {
				const within = insideMath || isKatex(child);

				if (within && child.type === 'text' && /[{}]/.test(child.value)) {
					/*
					 * ONE pass, via a replacer function. Two chained replaces
					 * corrupt each other: the first inserts `{'{'}`, which
					 * itself contains a brace, and the second then rewrites
					 * that, producing `{'{'{'}'}`.
					 */
					child.value = child.value.replace(/[{}]/g, (ch) =>
						ch === '{' ? "{'{'}" : "{'}'}"
					);
				}

				walk(child, within);
			}
		};
		walk(tree, false);
	};
}

/** remark plugin: attach a nested h2/h3 tree to the file's frontmatter. */
function remarkCollectHeadings() {
	return (tree, file) => {
		const slugger = new GithubSlugger();
		const flat = [];

		// Document order matters: the slugger's duplicate counter depends on it.
		walk(tree, (node) => {
			if (node.type !== 'heading') return;
			if (node.depth !== 2 && node.depth !== 3) return; // h1 is the title

			const text = nodeText(node).trim();
			if (!text) return; // skip empty or purely decorative headings

			flat.push({ id: slugger.slug(text), text, level: node.depth, children: [] });
		});

		// mdsvex exposes parsed frontmatter at file.data.fm; guard in case a
		// post has no frontmatter block at all.
		file.data.fm ??= {};
		file.data.fm.headings = nestHeadings(flat);
	};
}

/*
 * Syntax highlighting strategy
 * ----------------------------
 * We use Shiki because it highlights with the same TextMate grammars VS Code
 * uses (so R, Python, SQL, etc. are accurate) and because it can emit BOTH a
 * light and a dark colour for every token in a single pass. The two colours are
 * written as CSS custom properties (`--shiki-light` / `--shiki-dark`), and
 * app.css picks which one to show based on the `.dark` class on <html>. That
 * means code recolours instantly when the reader flips the theme, with no
 * re-highlighting and no flicker.
 */

// Themes: Material Ocean at night, as in the studio's apps; GitHub's light
// default by day. Both sit on the --tile surface (see app.css), not on the
// background each theme ships with.
const DARK_THEME = 'material-theme-ocean';
const LIGHT_THEME = 'github-light-default';

/*
 * Colour overrides, measured on the studio tiles. Each theme's comment
 * colour is too faint to read on the tile (2.04:1 dark, 4.40:1 light), so
 * comments take the site's --muted token, and Material Ocean's deepest JSON
 * key colour (3.73:1) takes the theme's own foreground. A var() is written
 * straight into the style Shiki emits, so comments follow the token.
 * contrast.test.js checks every colour in the built pages against the tile.
 */
const COLOR_REPLACEMENTS = {
	[DARK_THEME]: { '#464b5d': 'var(--muted)', '#916b53': '#babed8' },
	[LIGHT_THEME]: { '#6e7781': 'var(--muted)' }
};

// Comments are italic in both themes; github-light-default sets no style.
async function lightTheme() {
	const theme = (await bundledThemes[LIGHT_THEME]()).default;
	return {
		...theme,
		tokenColors: theme.tokenColors.map((rule) =>
			rule.settings?.foreground?.toLowerCase() === '#6e7781'
				? { ...rule, settings: { ...rule.settings, fontStyle: 'italic' } }
				: rule
		)
	};
}

// Languages bundled into the highlighter. Keep this list to what you actually
// write about — each language adds a little to the build. `text` is the
// fallback for unlabelled or unknown fences.
const LANGUAGES = ['python', 'r', 'sql', 'bash', 'javascript', 'json', 'julia', 'yaml', 'text'];

// One per code block; lib/copy-code.js handles every click with one listener.
// Both icons are drawn; CSS shows the tick for a moment after a copy.
const COPY_BUTTON =
	'<button type="button" class="copy" aria-label="Copy code" title="Copy code" hidden>' +
	'<svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
	'<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/></svg>' +
	'<svg class="icon-done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
	'<path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' +
	'</button>';

// Shiki is expensive to start, so we create one highlighter and reuse it for
// every code block in the build instead of recreating it per fence.
let highlighterPromise;
async function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = lightTheme().then((light) =>
			createHighlighter({ themes: [light, DARK_THEME], langs: LANGUAGES })
		);
	}
	return highlighterPromise;
}

/*
 * mdsvex inserts the highlighter's return value straight into a Svelte template.
 * Svelte would try to read `{` and `}` as expression delimiters and a backtick
 * could close the template literal we wrap the HTML in, so we escape those three
 * characters to HTML entities. The browser renders the entities back to the
 * literal characters, so the displayed code is unchanged.
 */
function escapeForSvelte(html) {
	return html
		.replace(/\\/g, '&#92;') // first: a literal \n in sample code must not become a real newline
		.replace(/[{}]/g, (char) => (char === '{' ? '&#123;' : '&#125;')) // also defuses `${` interpolation
		.replace(/`/g, '&#96;');
}

const config = defineConfig({
	extensions: ['.md'],

	// Runs on the Markdown tree, before it becomes HTML: pulls the h2/h3
	// structure into frontmatter so the TOC is prerendered, not assembled in
	// the browser.
	/*
	 * remark-math parses $inline$ and $$display$$ into math nodes; rehype-katex
	 * renders them to HTML at BUILD time. Nothing math-related ships to the
	 * reader as JavaScript — the KaTeX library itself stays in devDependencies
	 * and only its stylesheet is served, which is the same zero-runtime stance
	 * the Shiki highlighting takes.
	 */
	remarkPlugins: [remarkCollectHeadings, remarkMath],

	// Adds a stable id to every heading (slug of its text) so the table of
	// contents — and anyone sharing a link — can deep-link to sections.
	// Same slugger as above, so ids and TOC links always match.
	rehypePlugins: [
		rehypeSlug,
		/*
		 * `strict: false` downgrades KaTeX's warnings (unknown commands,
		 * Unicode it would rather you escaped) from build-breaking errors to
		 * console notes. A single stray character in one post should not fail
		 * a deploy; `throwOnError: false` renders the offending expression in
		 * red instead, so the problem is visible on the page rather than
		 * silently swallowed.
		 */
		[rehypeKatex, { strict: false, throwOnError: false }],
		// Must run AFTER rehypeKatex: it rewrites nodes that plugin creates.
		rehypeKatexForSvelte
	],

	highlight: {
		highlighter: async (code, lang = 'text') => {
			const highlighter = await getHighlighter();

			// Fall back to plain `text` if a fence uses a language we did not bundle.
			const loaded = highlighter.getLoadedLanguages();
			const safeLang = loaded.includes(lang) ? lang : 'text';

			// `defaultColor: false` => emit both colours as CSS variables and let
			// app.css decide which is visible. The wrapping <pre> carries the
			// `.shiki` class our stylesheet targets.
			const html = highlighter.codeToHtml(code, {
				lang: safeLang,
				themes: { light: LIGHT_THEME, dark: DARK_THEME },
				defaultColor: false,
				colorReplacements: COLOR_REPLACEMENTS
			});

			// Line numbers are a CSS counter (app.css); the gutter is as wide as
			// the largest number, so a 120-line block gets three digits.
			const digits = String(code.split('\n').length).length;

			// The wrapper div lets CSS render a language chip (via attr()) on every
			// block, and lets <CodeTabs> discover its child blocks and their labels.
			// The copy button is `hidden` until lib/copy-code.js is running, so a
			// reader without JavaScript never sees a button that does nothing.
			return (
				`<div class="code-block" data-language="${safeLang}" style="--line-digits: ${digits}">` +
				`{@html \`${escapeForSvelte(html)}\`}` +
				COPY_BUTTON +
				`</div>`
			);
		}
	}
});

export default config;
