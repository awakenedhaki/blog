// The entire site is prerendered to static HTML at build time (see
// adapter-static in svelte.config.js). A blog's content only changes when you
// rebuild, so static hosting gives the best speed/cost with zero servers.
export const prerender = true;

// Every page is written as <path>/index.html and linked as <path>/. GitHub
// Pages serves folders this way reliably; with the default ('never'), a page
// such as blog.html sits beside a blog/ folder of posts, and which of the two
// a request for /blog reaches is up to the host. Addresses without the slash
// still work: Pages redirects them.
export const trailingSlash = 'always';
