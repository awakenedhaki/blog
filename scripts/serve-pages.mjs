#!/usr/bin/env node
/**
 * Serve ./build the way GitHub Pages does, for the Playwright tests and for
 * a last look before deploying.
 *
 *   npm run preview:pages        http://localhost:4173
 *
 * `vite preview` runs SvelteKit's own server, which answers routes that a
 * plain static host never would. These are the rules the live site will
 * actually follow:
 *
 *   - a file that exists is served as is;
 *   - a folder requested without a trailing slash is redirected (301) to
 *     the slash form, then served as its index.html;
 *   - anything else gets 404.html, with status 404.
 *
 * No dependencies: node:http and the file system only.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve('build');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ttf': 'font/ttf',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8'
};

function send(res, status, file) {
	res.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
	createReadStream(file).pipe(res);
}

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

createServer((req, res) => {
	const url = new URL(req.url, 'http://localhost');
	const pathname = decodeURIComponent(url.pathname);
	const target = normalize(join(ROOT, pathname));
	if (!target.startsWith(ROOT)) return send(res, 404, join(ROOT, '404.html'));

	if (isFile(target)) return send(res, 200, target);
	if (isDir(target)) {
		if (!pathname.endsWith('/')) {
			res.writeHead(301, { Location: `${pathname}/${url.search}` });
			return res.end();
		}
		const index = join(target, 'index.html');
		if (isFile(index)) return send(res, 200, index);
	}
	send(res, 404, join(ROOT, '404.html'));
}).listen(PORT, () => console.log(`  serving build/ like GitHub Pages at http://localhost:${PORT}`));
