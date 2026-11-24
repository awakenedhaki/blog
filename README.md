# Unchecked Expressions

*what remains after the model fits*: a data-science blog, live at
**https://awakenedhaki.dev**.

A static site built with **SvelteKit (Svelte 5) + mdsvex + Shiki**. Posts are
Markdown with YAML frontmatter and can embed Svelte components; the build
prerenders every page to plain HTML, with light/dark syntax highlighting,
multi-language code tabs, collapsible asides and theme-aware figures.

## Quick start

```bash
npm install
npm run sync:drafts   # copy your posts (drafts included) into src/posts
npm run dev           # http://localhost:5173
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run new "Title"` | Scaffold a draft at `content/posts/<slug>/index.md` (`-- --series <id> --part <n>` to join a series). |
| `npm run status` | Report every post and flag problems: missing description, unknown theme or series, unquoted date, missing figure. |
| `npm run sync` | Copy **published** posts from `content/posts/` into `src/posts/`. What the deploy runs. |
| `npm run sync:drafts` | Same, drafts included. Local preview only: the build refuses to run with a draft in `src/posts/`. |
| `npm run dev` | Dev server, drafts readable at their URLs. |
| `npm run build` | Static site in `build/`, after the prebuild checks (no drafts, figures intact with alt text) and the search index and sitemap. |
| `npm run preview:pages` | Serve `build/` the way GitHub Pages does, at http://localhost:4173. |
| `npm test` | Build against the archived example posts, then run the unit and browser tests (see [Testing](#testing)). |

## How posts flow

```
content/posts/<slug>/   ── npm run sync ──▶   src/posts/<slug>/   ── npm run build ──▶   build/
  index.md + figures         (published only)    (build artefact)
```

- **`content/posts/`** is the source of truth: one folder per post, `index.md`
  plus its figures. The folder name is the URL (`/blog/<slug>/`).
- **`src/posts/`** is a git-ignored copy that sync wipes and rewrites. Never
  edit it. Drafts are kept out of it because the search index would otherwise
  put their text in the shipped JavaScript.
- **`archive/`** holds the example posts the blog started with (and their
  series in `archive/series.js`). It is git-ignored: it stays on this machine,
  is never committed, and is never built. To publish one, move its folder into
  `content/posts/`.

`BLOG_CONTENT_DIR=../somewhere npm run sync` reads posts from another
directory, such as a separate content repository. More on the workflow in
[`WRITING.md`](WRITING.md).

## Writing a post

```markdown
---
title: My post title
date: "2026-06-10"          # quoted, so YAML keeps it a string
theme: tutorial             # opinion | review | tutorial | visualization | analysis | challenge
tags: [r, python, statistics]
description: One-sentence summary shown in listings and meta tags.
published: false            # true to publish; false keeps it out of the build
series: my-project          # optional, with `part: 1`
toc: true                   # optional; false hides the table of contents
---

<script>
  import CodeTabs from '$lib/components/CodeTabs.svelte';
  import Callout from '$lib/components/Callout.svelte';
  import Figure from '$lib/components/Figure.svelte';
</script>

Normal **Markdown**. Code fences are highlighted with a language chip.
```

`npm run new` writes this scaffold for you. Math is written in LaTeX
(`$…$`, `$$…$$`) and rendered with KaTeX at build time.

**Keep blank lines around every fence and around component tags** inside a
component: that is how mdsvex knows to read the inside as Markdown.

### Code tabs

```markdown
<CodeTabs labels={['Python', 'R']}>

​```python
df.groupby("site").mean()
​```

​```r
df |> summarise(across(everything(), mean), .by = site)
​```

</CodeTabs>
```

`labels` is optional; without it, tabs are named by language.

### Collapsible asides

```markdown
<Callout type="tangent" title="A short digression" open={false}>

Body of the aside, full Markdown allowed.

</Callout>
```

`type` is `note`, `tangent` or `disclaimer`; `open` defaults to `false`.

### Collapsible code

```markdown
<CodeFold title="Show the code behind this figure" open={false}>

...fences or a CodeTabs block...

</CodeFold>
```

Folded code is still in the prerendered HTML, so search engines and the site
search see it.

### Series

Register the series once in `src/lib/site.js`
(`{ id: 'my-project', title: 'My project', blurb: '…' }`), then add
`series: my-project` and `part: n` to each post. Each article gets a
"part i of n" banner and previous/next links, and the series gets a page at
`/series/my-project/`. A post naming an unregistered series is flagged by
`npm run status` and gets no series page.

### Table of contents

Posts with two or more `##`/`###` headings get a table of contents: a sticky
rail with scrollspy on desktop, a collapsible block on phones. Heading ids come
from `rehype-slug`, so section links are shareable.

### Highlighter languages

`LANGUAGES` in `mdsvex.config.js` lists the grammars Shiki loads (Python, R,
SQL, Bash, JavaScript, JSON, Julia, YAML). Unknown fence languages render as
plain text instead of failing the build.

## Figures

Export **SVG with a transparent background** into the post's folder, beside
its `index.md`, then:

```markdown
<Figure src="my-figure.svg" alt="What the figure shows" caption="Optional caption." />
```

`Figure` inlines and sanitises the SVG, makes it scale fluidly, and remaps its
chrome (text, axes, grids, white panels) to the site's theme, so figures follow
the light/dark toggle. Data colours drawn from the viridis samples map onto
the site's categorical palette; other data colours are left as exported.
Per-figure rules live in `src/lib/figures.js` and the `colors` prop. Each post
ships only its own figures.

```r
ggsave("fig.svg", p, width = 7, height = 4.2, bg = "transparent")   # svglite recommended
```

```python
fig.savefig("fig.svg", transparent=True, bbox_inches="tight")
```

Keep figures about 7in wide with a base font of 11–12pt or more; they shrink
on phones. For very large scatters, rasterise the data layer
(`ggrastr::rasterise()`, `rasterized=True`). For photos, use a PNG exported at
2x, optionally with a dark variant:
`<Figure src="fig-light.png" darkSrc="fig-dark.png" alt="…" />`.

## Look and feel

- `src/lib/site.js`: name, tagline, author, navigation, topics and series.
- `src/routes/about/+page.svelte`: the about page.
- `src/app.css`: the token blocks at the top control colours, type and
  spacing in both themes.

The theme menu offers System, Light and Dark; the choice persists in
`localStorage` and an inline script in `src/app.html` applies it before first
paint. Shiki emits both code palettes as CSS variables, so switching theme
recolours code without re-rendering.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm run sync`
(published posts only), `npm run build`, then publishes `build/` to GitHub
Pages.

One-time setup:

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Settings → Pages → Custom domain: `awakenedhaki.dev` (`static/CNAME` keeps
   it on every deploy and must match `url` in `src/lib/site.js`).
3. DNS for the apex: A records `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`; AAAA records `2606:50c0:8000::153`
   through `2606:50c0:8003::153`; optionally `www` CNAME
   `awakenedhaki.github.io`. No other A/AAAA records on `@`.
4. Once the DNS check passes, tick **Enforce HTTPS**.

Hosting notes: addresses end in a slash (`/blog/<slug>/`, and Pages
301-redirects the slashless form); unknown addresses get the site's own
404 page. GitHub Pages ignores `static/_headers`, so its security headers and
cache rules apply only on hosts that read it (Netlify, Cloudflare Pages).

## Testing

```bash
npm test             # sync the archive, build, then unit + browser tests
npm run test:unit    # Vitest only, against the current build
npm run test:screens # Playwright only, against the current build
npm run sync         # afterwards: put your own posts back in src/posts
```

The tests need real posts (figures, code, series), so `npm test` builds from
`archive/` as fixtures. They are not run by the deploy.

## Project map

```
content/posts/          your posts, one folder each (source of truth)
archive/                example posts, local only (git-ignored)
scripts/                new, status, sync, prebuild checks, search index, sitemap
src/
├── app.html            theme bootstrap, runs before first paint
├── app.css             design tokens and global styles
├── posts/              build artefact from `npm run sync` (git-ignored)
├── lib/
│   ├── site.js         name, nav, topics, series
│   ├── posts.js        post registry, from the generated posts.data.json
│   ├── figures.js      SVG sanitising and theme colour remapping
│   └── components/     CodeTabs, Callout, CodeFold, Figure, Toc, SeriesNav, …
└── routes/
    ├── +page.svelte    home
    ├── blog/           index with filters; [slug]/ is one page per post
    ├── topics/ tags/ series/ archive/   listing pages
    └── about/
static/                 CNAME, favicon, robots.txt, _headers
tests/unit/             Vitest: figures, contrast, bundle size, hosting
tests/e2e/              Playwright: layout, accessibility, themes, screenshots
```

## Dependencies

| Package | Why |
| --- | --- |
| `svelte`, `@sveltejs/kit`, `vite` | The framework. Vite is pinned to v7 because `@sveltejs/vite-plugin-svelte@6` does not support Vite 8 yet. |
| `@sveltejs/adapter-static` | Prerenders everything to static files for GitHub Pages. |
| `mdsvex` | Markdown posts that can embed Svelte components. |
| `shiki` | VS Code grammars and one-pass dual-theme highlighting, at build time only. |
| `remark-math`, `rehype-katex`, `katex` | LaTeX math rendered at build time. |
| `rehype-slug`, `github-slugger` | Heading ids for the table of contents, and post slugs with the same rules. |
| `vitest`, `@playwright/test`, `@axe-core/playwright` | Unit, browser and accessibility tests. |

Everything is a `devDependency`: the published site is static files only.
