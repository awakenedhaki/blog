/**
 * Svelte preprocessor: give each post its own figures, and only its own.
 *
 * A post is a folder (src/posts/<slug>/index.md) with its figures beside it.
 * This runs after mdsvex, on each post. For every <Figure> it imports the
 * files named by `src` and `darkSrc` from the post's own folder and passes
 * them to the component:
 *
 *   SVG     ->  markup={…}   the file's text (`?raw`), inlined and re-themed
 *   raster  ->  url={…}      the hashed asset URL (`?url`)
 *   darkSrc ->  darkUrl={…}  the same, for the dark-theme raster
 *
 * Because the imports are static and per post, Vite puts each figure in the
 * chunk of the post that shows it. (One eager glob of every figure once put
 * all of them, ~2MB, in every post.)
 *
 * After mdsvex, code samples are escaped (&lt;Figure), so only real
 * components match. A file that is not in the folder is left alone: Figure
 * then shows its "Figure not found" notice, and `npm run status` names it.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const RASTER = /\.(png|jpe?g|webp)$/i;

// One attribute: name, then optionally ="…", ='…' or {…} (no nested braces
// in Figure props, so a flat match is enough).
const ATTR = /\s*([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{[^}]*\}))?/y;

/** Every <Figure …> tag: where its name ends, and its string attributes. */
function figureTags(code) {
	const tags = [];
	for (const m of code.matchAll(/<Figure\b/g)) {
		let i = m.index + m[0].length;
		const attrs = {};
		for (;;) {
			ATTR.lastIndex = i;
			const a = ATTR.exec(code);
			if (!a || a[0].trim() === '') break;
			attrs[a[1]] = a[2] ?? a[3];
			i = ATTR.lastIndex;
		}
		tags.push({ at: m.index + m[0].length, attrs });
	}
	return tags;
}

export function figureImports() {
	return {
		name: 'figure-imports',
		markup({ content, filename }) {
			if (!filename?.endsWith('.md') || !content.includes('<Figure')) return;
			const folder = dirname(filename);

			const imports = [];
			const add = (file, query) => {
				const name = `__figure_${imports.length}`;
				imports.push(`import ${name} from './${file}?${query}';`);
				return name;
			};

			let out = content;
			// Right to left, so earlier insert positions stay valid.
			for (const { at, attrs } of figureTags(content).reverse()) {
				const props = [];
				const { src, darkSrc } = attrs;
				if (src && existsSync(join(folder, src))) {
					if (src.endsWith('.svg')) props.push(`markup={${add(src, 'raw')}}`);
					else if (RASTER.test(src)) props.push(`url={${add(src, 'url')}}`);
				}
				if (darkSrc && RASTER.test(darkSrc) && existsSync(join(folder, darkSrc))) {
					props.push(`darkUrl={${add(darkSrc, 'url')}}`);
				}
				if (props.length) out = `${out.slice(0, at)} ${props.join(' ')}${out.slice(at)}`;
			}
			if (!imports.length) return;

			// Into the instance <script> (not the module one mdsvex adds for the
			// frontmatter), or a new one.
			const instance = /<script(?![^>]*\b(?:context\s*=\s*["']module["']|module)\b)[^>]*>/.exec(out);
			const lines = `\n\t${imports.join('\n\t')}\n`;
			out = instance
				? out.slice(0, instance.index + instance[0].length) + lines + out.slice(instance.index + instance[0].length)
				: `<script>${lines}</script>\n${out}`;
			return { code: out };
		}
	};
}
