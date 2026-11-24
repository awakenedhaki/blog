# Managing posts

## The short version

```bash
npm run new "Your post title"   # scaffold a draft: content/posts/<slug>/index.md
npm run status                  # see what exists and what is broken
npm run sync:drafts && npm run dev    # preview drafts locally
npm run sync && npm run build         # build for deployment
```

---

## Why there are two directories

| Directory | Role | Edit by hand? |
|---|---|---|
| `content/posts/` | Source of truth. One folder per post: `index.md` plus its figures. | **Yes** |
| `src/posts/` | Build artefact. Only what `npm run sync` copied. | No — it is wiped on every sync |

The split is not organisational tidiness. It closes a real leak.

`published: false` keeps a post out of listings, out of search results, and
(since the `entries()` fix) out of the prerendered routes. What it cannot do is
keep the text out of the JavaScript bundle. `lib/search.js` reads post bodies
with an **eager** `import.meta.glob(..., { query: '?raw' })`, which Vite inlines
as string literals at build time; the published-only filter runs afterwards, at
runtime. Dynamic property access defeats tree-shaking, so the unused strings
stay in the chunk. An unfinished draft in `src/posts/` is readable by anyone who
opens the bundle, even though nothing links to it.

The only robust fix is to keep drafts out of the directory Vite scans. Hence
`content/`, and hence the build guard below.

## The build guard

`npm run build` runs `scripts/check-drafts.mjs` first, via the `prebuild` npm
hook. If any file in `src/posts/` carries `published: false`, the build stops:

```
  Build stopped: unpublished posts found in src/posts
    - my-half-finished-post.md
```

This makes forgetting impossible rather than merely unlikely. After
`npm run sync:drafts` you *cannot* accidentally deploy — you have to re-sync
without `--drafts` first. That friction is the point.

## Post states

There are only two, and they are the `published` field:

- `published: false` — a draft. Lives in `content/posts/`, previewable in dev at
  its real URL with the real layout, invisible in production.
- `published: true` (or omitted) — live.

There is deliberately no third "ready for review" state. A flag the tooling does
not enforce is a comment, and comments drift.

## Previewing a draft

```bash
npm run sync:drafts
npm run dev
```

The post loader allows unpublished posts when `dev` is true and 404s them
otherwise, so a draft renders exactly as it will once live. Run `npm run sync`
(no flag) before building.

## Checking your work

```bash
npm run status
```

Flags the things that fail late and confusingly:

- missing `description` (used in listings, meta tags, and social cards)
- a `theme` outside the controlled vocabulary in `site.js`
- a `series` with no matching definition
- duplicate slugs
- **unquoted dates** — `date: 2026-05-25` is a YAML *timestamp* and arrives as a
  JavaScript `Date`; `date: "2026-05-25"` arrives as a string. Both are handled,
  but the unquoted form caused a site-wide "Invalid Date" bug once already.

The vocabularies are read straight out of `src/lib/site.js`, so the linter
cannot drift from what the site actually accepts.

---

## Keeping posts in a separate repository

`BLOG_CONTENT_DIR` points the scripts at any directory, which is all the
separation requires:

```bash
BLOG_CONTENT_DIR=../blog-content npm run sync
```

Set it once in a `.env` or your shell profile and every script follows.

### Option A — a sibling clone (recommended to start)

```
~/code/
  blog/           the site (this repo)
  blog-content/   posts/  (one folder per post, figures inside)
```

```bash
git clone git@github.com:awakenedhaki/blog-content.git ../blog-content
echo 'BLOG_CONTENT_DIR=../blog-content' >> .env
npm run sync
```

**Why this first:** the two repositories stay completely independent. You can
make the content repo private, rewrite its history, or drop it entirely without
touching the site. Drafts never enter the site repo's history at all — which
matters, because a draft committed once is in the git log forever even after you
delete the file.

**Cost:** the site repo does not record *which* version of the content it was
built from. For a personal blog that is rarely a real loss.

### Option B — a git submodule

```bash
git submodule add git@github.com:awakenedhaki/blog-content.git content
git commit -m "Track content as a submodule"
```

**Why:** the site repo pins an exact content commit, so any checkout rebuilds
byte-identically. Useful if you ever need to reproduce an old deploy.

**Costs, which are real:** every clone needs `--recurse-submodules` or the
content silently appears empty; your CI checkout step needs `submodules: true`;
and updating content becomes two commits in two repos rather than one. Submodules
are also the single most common source of "it works on my machine" in otherwise
simple projects.

### For CI

Publishing is a two-step build:

```yaml
- run: npm ci
- run: npm run sync        # published posts only
  env:
    BLOG_CONTENT_DIR: ./content
- run: npm run build       # prebuild guard runs automatically
```

If the content repo is private, the checkout step needs a deploy key or a PAT
with read access. With Option A, add a second `actions/checkout` step targeting
the content repo and set `path: content`.

---

## Figures

Figures live in their post's folder, `content/posts/<slug>/`, beside its
`index.md`, and the sync copies the whole folder — a post and the figures it
references are one unit of work, so a post can never arrive without its images,
and a draft's figures stay out of the build along with it. At build time each
post imports only its own figures (`figure-imports.js`), so no reader downloads
another post's.

Export recipes are in the README. The one rule worth repeating: anything you want
to stay a fixed colour must avoid the eight hexes in `DEFAULT_COLOR_MAP`
(`lib/figures.js`), because those are remapped to theme variables. Pure `#ffffff`
labels on a dark plot will vanish in dark mode — use `#fafafa`.

---

## Figures and the light/dark theme

A figure recolours with the theme because its markup is inlined into the page
and its "chrome" colours are rewritten to CSS variables. Two things have to be
true for that to work, and neither is automatic.

**1. The colour has to be written down.** Substitution can only rewrite a
colour that exists in the file. matplotlib omits `fill` on `<text>` when the
colour is default black and relies on SVG's initial value — so there is no hex
to match, and labels stay black on a dark background while the axes around them
recolour. `Figure.svelte` now sets a default `fill: var(--ink)` for text, which
inline styles still override, so deliberately-coloured labels keep their colour.

**2. The colour has to be somewhere `var()` is legal.** `var()` is a CSS value
function. It works in `style="fill: var(--ink)"` and in a stylesheet, and it is
**invalid in a presentation attribute** — `fill="var(--ink)"` is silently
discarded and the element falls back to black. matplotlib writes `style="..."`
and happened to work; svglite (the ggplot2 device) writes `stroke='#333333'` as
an attribute and did not. `prepareSvg` now moves colour attributes into inline
styles first, so both devices behave the same.

### Export recipe

**Python**

```python
plt.rcParams.update({
    "svg.fonttype": "none",   # real <text>, not paths: sharp, selectable, themeable
    "text.color": "#000000",  # leave chrome at matplotlib defaults so the map hits
    "axes.edgecolor": "#000000",
    "grid.color": "#b0b0b0",
})
fig.savefig("fig.svg", transparent=True, bbox_inches="tight")
```

**R**

```r
# svglite writes real <text> and compact markup; the base svg() device does not.
ggsave("fig.svg", plot = p, device = svglite::svglite,
       width = 7, height = 4.2, bg = "transparent")
```

### Rasters inside a vector figure

Anything matplotlib cannot express as vectors — `imshow` heatmaps, colorbars,
`rasterized=True` layers — is embedded as a base64 PNG inside the SVG. Those
payloads are preserved, but they are **not** themeable: a PNG is pixels, so it
keeps its colours in both light and dark mode. That is usually correct, since
the raster is the data layer, but it means a heatmap's background does not
adapt. Export with a transparent figure background so the surrounding page
colour shows through.

`npm run build` runs `scripts/check-figures.mjs`, which pushes every figure
through the real pipeline and fails the build if a raster was destroyed, an
element was left pointing at nothing, drawable elements went missing, or
`var()` ended up somewhere invalid. It exists because exactly that happened
once: the sanitiser blocked `data:` URLs to stop `data:text/html` and took the
heatmap's PNG with it, while the vector axes around it kept rendering — so the
build stayed green and the only symptom was a broken-image icon.

### The one rule

Anything you want to stay a **fixed** colour must avoid the eight hexes in
`DEFAULT_COLOR_MAP` (`src/lib/figures.js`), because those are the ones remapped
to theme variables. Pure `#ffffff` is in that list — it exists to catch leftover
white panel backgrounds — so white labels on a dark plot will vanish in dark
mode. Use `#fafafa`, which is visually identical and outside the map.

Data colours are never touched. Plot with viridis and the data layer reads
correctly on both backgrounds with no theme handling at all.

---

## Maths in posts

`$inline$` and `$$display$$` are rendered by KaTeX at build time — no JavaScript
ships to the reader. Two hazards, both of which fail the build rather than
producing a wrong page, and both with error messages that name the symptom
rather than the cause.

**Braces.** Svelte reads `{` as the start of a template expression, and KaTeX
output contains braces in two places: the `<annotation>` element holding the raw
TeX (`\text{Var}` → "Var is not defined"), and genuine set-builder notation
rendered as MathML `<mo>{</mo>` ("Expected token }"). Both are handled
automatically by `rehypeKatexForSvelte` in `mdsvex.config.js` — the annotation
is dropped, real braces are escaped. You should not have to think about it, but
if you see either error in a post with maths, that plugin is where to look.

**Bare `<` in prose.** Outside a code fence, `<` starts an HTML tag as far as
Svelte is concerned, so a table cell reading `proportion < 0.01` fails with
"Expected a valid element or component name". Wrap comparisons in backticks —
`` `< 0.01` `` — or write `&lt;`. This bites most often in tables, where
backticks are easy to forget.

Version pinning matters here: `remark-math@3` and `rehype-katex@5` are the
releases that match mdsvex's unified version. Version 6 of remark-math targets a
newer unified and **silently does nothing** — no error, the `$…$` simply survives
as literal text.

---

## Editor setup

`.markdownlint.jsonc` and `.vscode/settings.json` are checked in.

Posts are mdsvex, not plain Markdown, so several default markdownlint rules fire
on perfectly correct files. `MD033/no-inline-html` is the loudest: it sees
`<Figure>` and reports raw HTML. Rather than disabling the rule, the config
allowlists the components (`Figure`, `CodeTabs`, `Callout`, `CodeFold`, and the
frontmatter `script` block), so genuinely stray HTML is still caught.

**Add new components to that allowlist as you build them.** A stale list shows
up as a false positive, never as a broken build.
