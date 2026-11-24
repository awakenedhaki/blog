/**
 * Site-wide configuration — the ONE file to edit when personalising the blog.
 *
 * `themes` is the controlled vocabulary for the `theme` frontmatter field.
 * A fixed list (rather than free text) means the Topics pages can never drift
 * out of sync with the posts, and a typo in frontmatter surfaces as an obvious
 * "unknown theme" instead of a silently missing article.
 */
export const site = {
  // name: 'The Residual',
  name: "Unchecked Expressions",
  tagline: "what remains after the model fits",
  description:
    "Notes on data science for researchers — tutorials, paper reviews, visualisation and coding challenges in R and Python.",

  // Your handle, used in the footer, about page and social links.
  author: "Rodrigo Vallejos",
  handle: "awakenedhaki",

  // Canonical production URL. The share buttons on every article bake this
  // into their links at build time (so they work even before JS loads), and
  // the sitemap uses it. Served by GitHub Pages; static/CNAME must match.
  url: "https://awakenedhaki.dev",

  // `menu: 'browse'` marks the item that opens the Topics dropdown. The href
  // is still a real page, so the item works as a plain link if the dropdown
  // is never opened (and for crawlers, which do not open disclosures).
  nav: [
    { href: "/blog/", label: "Posts", icon: "posts" },
    { href: "/topics/", label: "Topics", menu: "browse", icon: "topics" },
    { href: "/about/", label: "About", icon: "about" },
  ],
};

export const social = [
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/awakenedhaki",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com/in/rodrigovallejosch",
  },
  {
    id: "email",
    label: "Email",
    // mailto: rather than a contact form — no backend, no spam pipeline, and
    // it works from a phone's mail app in one tap.
    href: "mailto:rvallejos@awakenedhaki.dev",
  },
];

/**
 * The browse axes — the four different ways a reader can slice the archive.
 * These populate the Topics dropdown AND the Topics hub page, so the two can
 * never disagree about which views exist.
 */
export const browseAxes = [
  {
    href: "/topics/",
    icon: "topics",
    label: "By category",
    blurb: "What kind of article it is.",
  },
  {
    href: "/series/",
    icon: "series",
    label: "By series",
    blurb: "Multi-part projects, in reading order.",
  },
  {
    href: "/tags/",
    icon: "tag",
    label: "By tag",
    blurb: "Methods, languages and datasets.",
  },
  {
    href: "/archive/",
    icon: "year",
    label: "By year",
    blurb: "Everything published, newest first.",
  },
];

/** The six article topics this blog publishes, with card blurbs. */
export const themes = [
  {
    id: "opinion",
    label: "Opinion",
    blurb: "Takes on practice, tooling and culture in research.",
  },
  {
    id: "review",
    label: "Article review",
    blurb: "Close readings of papers — methods first.",
  },
  {
    id: "tutorial",
    label: "Tutorial",
    blurb: "Step-by-step guides, in R and Python side by side.",
  },
  {
    id: "visualization",
    label: "Data visualization",
    blurb: "Making figures that tell the truth.",
  },
  {
    id: "analysis",
    label: "Public-data analysis",
    blurb: "TidyTuesday and academic datasets, worked end to end.",
  },
  {
    id: "challenge",
    label: "Coding challenge",
    blurb: "Project Euler, Rosalind, LeetCode and friends, dissected.",
  },
];

/**
 * Series — ordered, multi-article projects. A post joins a series with two
 * frontmatter fields:  `series: <id>`  and  `part: <n>`.
 * Defining titles HERE (once) rather than in every post's frontmatter means
 * a series can't end up with three slightly different names, and a typo in a
 * post's `series:` field shows up as an obviously unlinked article.
 */
export const series = [];

/** Look up a series record by id (null if the id is unknown). */
export function seriesById(id) {
  return series.find((s) => s.id === id) ?? null;
}

/** Look up a theme's display label, falling back to the raw id. */
export function themeLabel(id) {
  return themes.find((t) => t.id === id)?.label ?? id;
}
