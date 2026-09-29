// Verifies every internal link and #anchor in the built site resolves. Run after `astro build`.
import fs from 'node:fs';
import path from 'node:path';
import { slug } from 'github-slugger';

const DIST = path.resolve(import.meta.dirname, '../dist');

const pages = new Map(); // "/foo/bar/" → Set of element ids
function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) walk(full);
		else if (e.name === 'index.html') {
			const url = '/' + path.relative(DIST, dir).split(path.sep).join('/');
			const html = fs.readFileSync(full, 'utf8');
			const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
			// Tab labels are anchors too (resolved client-side by Head.astro).
			const tabs = [...html.matchAll(/role="tab"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => slug(m[1].replace(/<[^>]+>/g, '').trim()));
			pages.set(url.endsWith('/') ? url : url + '/', { html, ids: new Set([...ids, ...tabs]) });
		}
	}
}
walk(DIST);

const problems = [];
for (const [page, { html }] of pages) {
	// Only check links inside the article body, not Starlight's own chrome.
	const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
	for (const [, href] of main.matchAll(/<a [^>]*href="([^"]+)"/g)) {
		if (/^(https?:|mailto:)/.test(href)) continue;
		const [p, hash] = href.split('#');
		const target = p ? (p.endsWith('/') ? p : p + '/') : page;
		const file = p && path.join(DIST, decodeURIComponent(p));
		if (file && fs.existsSync(file) && fs.statSync(file).isFile()) continue; // static asset
		const t = pages.get(target);
		if (!t) problems.push(`${page} → ${href}  (page missing)`);
		else if (hash && !t.ids.has(decodeURIComponent(hash))) problems.push(`${page} → ${href}  (anchor missing)`);
	}
	for (const [, src] of main.matchAll(/<img [^>]*src="(\/[^"]+)"/g)) {
		if (!fs.existsSync(path.join(DIST, decodeURIComponent(src)))) problems.push(`${page} → ${src}  (image missing)`);
	}
}

console.log(`Checked ${pages.size} pages.`);
if (problems.length) {
	console.log(`${problems.length} broken link(s):\n  ` + problems.join('\n  '));
	process.exit(1);
}
console.log('No broken internal links.');
