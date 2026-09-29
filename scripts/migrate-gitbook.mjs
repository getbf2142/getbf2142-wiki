// One-off migration: GitBook markdown repo → Starlight MDX.
// Usage: node scripts/migrate-gitbook.mjs <path-to-gitbook-repo>
// Kept for reference: the migration is done and src/content/docs is now the source of truth.
// Re-running it OVERWRITES src/content/docs.
// Page URLs are kept identical to docs.getbf2142.net so existing links keep working.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import GithubSlugger, { slug as githubSlug } from 'github-slugger';

const SRC = path.resolve(process.argv[2] ?? '');
const ROOT = path.resolve(import.meta.dirname, '..');
const DOCS_OUT = path.join(ROOT, 'src/content/docs');
const ASSETS_OUT = path.join(ROOT, 'public/assets');
const SIDEBAR_OUT = path.join(ROOT, 'src/sidebar.json');
const SITE_HOST = 'docs.getbf2142.net';

// Anchors that were already broken on GitBook (headings renamed since the link was written).
const ANCHOR_FIXES = {
	'list-of-maps-in-project-remaster-w-bot-support': 'project-remaster',
	'do-this-first-disable-any-unused-network-adapters': 'disabling-network-adapters',
	'a04-install-the-missing-registry-files': 'a04-install-the-registry-files',
};

const HINT_TYPES = { info: 'note', success: 'tip', warning: 'caution', danger: 'danger' };

// ---------- helpers ----------

const toPosix = (p) => p.split(path.sep).join('/');

/** "advanced/addons-tweaks/README.md" → "advanced/addons-tweaks"; "README.md" → "" */
function slugFromFile(rel) {
	return toPosix(rel).replace(/(^|\/)README\.md$/i, '').replace(/\.md$/i, '');
}

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		if (e.name.startsWith('.')) return [];
		const full = path.join(dir, e.name);
		return e.isDirectory() ? walk(full) : e.name.endsWith('.md') ? [full] : [];
	});
}

/** GitBook keeps dots etc. in anchors; Starlight uses github-slugger. */
const normalizeAnchor = (a) => {
	const slug = githubSlug(decodeURIComponent(a).replace(/-/g, ' ')).replace(/ /g, '-');
	return ANCHOR_FIXES[slug] ?? slug;
};

// ---------- assets ----------

const assetMap = new Map(); // original file name → public URL
function copyAssets() {
	const dir = path.join(SRC, '.gitbook/assets');
	if (!fs.existsSync(dir)) return;
	fs.mkdirSync(ASSETS_OUT, { recursive: true });
	for (const name of fs.readdirSync(dir)) {
		const ext = path.extname(name).toLowerCase();
		const clean = githubSlug(path.basename(name, path.extname(name))) + ext;
		fs.copyFileSync(path.join(dir, name), path.join(ASSETS_OUT, clean));
		assetMap.set(name, `/assets/${clean}`);
	}
}

// ---------- link rewriting ----------

function rewriteHref(href, fileRel) {
	if (/^(mailto:|#user-content-fn)/.test(href)) return href;
	if (href.startsWith('#')) return '#' + normalizeAnchor(href.slice(1));

	const own = href.match(new RegExp(`^https?://${SITE_HOST.replace(/\./g, '\\.')}(/[^#]*)?(#.*)?$`));
	if (own) return (own[1] && own[1] !== '/' ? own[1].replace(/\/?$/, '/') : '/') + (own[2] ? '#' + normalizeAnchor(own[2].slice(1)) : '');
	if (/^[a-z]+:/i.test(href)) return href;

	const [p, anchor] = href.split('#');
	const decoded = decodeURIComponent(p);
	if (decoded.includes('.gitbook/assets/')) return assetMap.get(path.basename(decoded)) ?? href;

	const resolved = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(toPosix(fileRel)), decoded)));
	let slug = resolved.endsWith('.md') ? slugFromFile(resolved) : resolved.replace(/\/$/, '');
	if (slug === '.' || slug === '') slug = '';
	const hash = anchor ? '#' + normalizeAnchor(anchor) : '';
	// Same-page links (e.g. "this-page.md#downloads") collapse to just the anchor.
	if (p && slug === slugFromFile(toPosix(fileRel)) && hash) return hash;
	return (slug ? `/${slug}/` : '/') + hash;
}

// ---------- GitBook block conversions ----------

/** Indent a step's body so it becomes one ordered-list item. */
function toListItem(body) {
	const lines = body.replace(/^\n+|\s+$/g, '').split('\n');
	return lines.map((l, i) => (i === 0 ? `1. ${l}` : l.trim() ? `   ${l}` : '')).join('\n');
}

function convertSteppers(s) {
	return s.replace(/\{% stepper %\}([\s\S]*?)\{% endstepper %\}/g, (_, inner) => {
		const steps = [...inner.matchAll(/\{% step %\}([\s\S]*?)\{% endstep %\}/g)].map((m) => toListItem(m[1]));
		return `<Steps>\n\n${steps.join('\n\n')}\n\n</Steps>`;
	});
}

function convertEmbeds(s) {
	// An embed only has a caption when {% endembed %} comes before the next {% embed %}.
	const re = /\{% embed url="([^"]*)" %\}/g;
	let out = '';
	let last = 0;
	for (let m; (m = re.exec(s)); ) {
		out += s.slice(last, m.index);
		const after = s.slice(re.lastIndex);
		const end = after.indexOf('{% endembed %}');
		const next = after.search(/\{% embed /);
		const url = m[1];
		if (end !== -1 && (next === -1 || end < next)) {
			const caption = after.slice(0, end).trim();
			out += caption ? `<Embed url="${url}">\n\n${caption}\n\n</Embed>` : `<Embed url="${url}" />`;
			re.lastIndex += end + '{% endembed %}'.length;
		} else {
			out += `<Embed url="${url}" />`;
		}
		last = re.lastIndex;
	}
	return out + s.slice(last);
}

function convertBlocks(s) {
	s = s.replace(/\{% hint style="(\w+)" %\}\n?([\s\S]*?)\n?\{% endhint %\}/g, (_, style, body) => `<Aside type="${HINT_TYPES[style] ?? 'note'}">\n\n${body.trim()}\n\n</Aside>`);
	s = s.replace(/\{% tabs %\}/g, '<Tabs>').replace(/\{% endtabs %\}/g, '</Tabs>');
	s = s.replace(/\{% tab title="([^"]*)" %\}/g, (_, t) => `<TabItem label="${t.replace(/"/g, '&quot;')}">\n`);
	s = s.replace(/\{% endtab %\}/g, '\n</TabItem>');
	s = convertEmbeds(s);
	s = convertSteppers(s);
	return s;
}

// ---------- inline / HTML cleanup ----------

function convertPreBlocks(s) {
	return s.replace(/<pre class="language-(\w+)"><code class="lang-\w+">([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) => {
		const text = code
			.replace(/<\/?strong>/g, '')
			.replace(/&#x3C;/g, '<')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&');
		return '```' + lang + '\n' + text.replace(/\n$/, '') + '\n```';
	});
}

function convertFootnoteRefs(s) {
	// **\[**[**?**](#user-content-fn-3)[^3]**]**   and   [**\[?\]**](#user-content-fn-7)[^7]
	s = s.replace(/\*\*\\\[\*\*\[[^\]]*\]\(#user-content-fn-[^)]+\)(\[\^[^\]]+\])\*\*\]\*\*/g, '$1');
	s = s.replace(/\[\*\*\\\[[^\]]*\\\]\*\*\]\(#user-content-fn-[^)]+\)(\[\^[^\]]+\])/g, '$1');
	// [some text](#user-content-fn-6)[^6] → some text[^6]
	s = s.replace(/\[((?:[^\[\]]|\[[^\]]*\])*)\]\(#user-content-fn-[^)]+\)(\[\^[^\]]+\])/g, (_, text, ref) => {
		const bare = text.replace(/[*\\[\]?\s]/g, '');
		return bare ? `${text}${ref}` : ref;
	});
	return s;
}

function convertInlineHtml(s, fileRel) {
	s = s.replace(/<mark style="color:(\w+);?">/g, (_, c) => `<mark class="ui${c === 'blue' ? '' : ` ui-${c}`}">`);
	s = s.replace(/<img ([^>]*?)\/?>/g, (_, attrs) => {
		attrs = attrs.replace(/src="([^"]*)"/, (__, src) => `src="${rewriteHref(src, fileRel)}"`);
		return `<img ${attrs.trim()} loading="lazy" />`;
	});
	s = s.replace(/<figcaption><\/figcaption>/g, '');
	s = s.replace(/<br\s*>/g, '<br />');
	s = s.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
	s = s.replace(/(<div)(><figure>)/g, '$1 class="figure-row"$2');
	// GitBook let you link to an expandable by its title; keep those anchors working.
	const slugger = new GithubSlugger(); // dedupes repeated titles like "Map List"
	s = s.replace(/<details>(\s*)<summary>([\s\S]*?)<\/summary>/g, (_, ws, text) => `<details id="${slugger.slug(text.replace(/<[^>]+>|[*_`]/g, ''))}">${ws}<summary>${text}</summary>`);
	s = s.replace(/href="([^"]*)"/g, (_, h) => `href="${rewriteHref(h, fileRel)}"`);
	// Markdown links (skip images and footnote refs)
	s = s.replace(/(?<!!)\]\(<?([^)\s>]+)>?\)/g, (_, h) => `](${rewriteHref(h, fileRel)})`);
	s = s.replace(/!\[([^\]]*)\]\(<?([^)>]+)>?\)/g, (_, alt, src) => `![${alt}](${rewriteHref(src.trim(), fileRel)})`);
	// Bold wrappers inside headings add noise to the TOC.
	s = s.replace(/^(#{2,6}) \*\*(.+)\*\*\s*$/gm, '$1 $2');
	s = s.replace(/&#x20;/g, '');
	return s;
}

/** Escape characters MDX treats as syntax, outside code spans / fences. */
function escapeMdx(s) {
	return s
		.split(/(```[\s\S]*?```|`[^`\n]*`)/g)
		.map((part, i) => {
			if (i % 2) return part;
			return part
				.replace(/(?<!\\)\{(?!\/\*)/g, '\\{')
				.replace(/(?<!\*\/|\\)\}/g, '\\}')
				.replace(/(?<!\\)<(?![a-zA-Z/!]|\/)/g, '\\<')
				.replace(/(?<!\\)<([A-Z]+)>/g, (m, tag) => (['Steps', 'Tabs', 'TabItem', 'Aside', 'Embed'].includes(tag) ? m : `\\<${tag}>`));
		})
		.join('');
}

// ---------- page conversion ----------

function convertPage(fileRel, raw, sidebarLabels) {
	const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
	const meta = fm ? YAML.parse(fm[1]) ?? {} : {};
	let body = fm ? raw.slice(fm[0].length) : raw;

	let title = sidebarLabels.get(slugFromFile(fileRel)) ?? path.basename(fileRel, '.md');
	body = body.replace(/^\s*# (.+)\n/, (_, h1) => {
		title = h1.replace(/\*\*/g, '').trim();
		return '';
	});

	body = convertPreBlocks(body);
	body = convertFootnoteRefs(body);
	body = convertBlocks(body);
	body = convertInlineHtml(body, fileRel);
	body = escapeMdx(body);
	body = body.replace(/\n{3,}/g, '\n\n').trim() + '\n';

	const slug = slugFromFile(fileRel);
	const frontmatter = { title, description: meta.description, slug: slug || undefined };
	const label = sidebarLabels.get(slug);
	if (label && label !== title) frontmatter.sidebar = { label };
	if (!slug) Object.assign(frontmatter, homepageFrontmatter());

	const components = [];
	const used = (tag) => body.includes(`<${tag}`);
	const starlight = ['Aside', 'Steps', 'Tabs', 'TabItem'].filter(used);
	if (!slug) starlight.push('Card', 'CardGrid', 'LinkCard');
	if (starlight.length) components.push(`import { ${starlight.join(', ')} } from '@astrojs/starlight/components';`);
	if (used('Embed')) components.push(`import Embed from '~/components/Embed.astro';`);

	if (!slug) body = homepageIntro() + body;

	const yaml = YAML.stringify(JSON.parse(JSON.stringify(frontmatter)), { lineWidth: 0 });
	return `---\n${yaml}---\n\n${components.length ? components.join('\n') + '\n\n' : ''}${body}`;
}

function homepageFrontmatter() {
	return {
		title: 'GetBF2142',
		template: 'splash',
		hero: {
			tagline: 'Your go-to hub for getting Battlefield 2142 running again — installs, patches, multiplayer and mods, all tested and mirrored.',
			actions: [
				{ text: 'Get started', link: '/getting-started/before-proceeding/', icon: 'right-arrow' },
				{ text: 'Join our Discord', link: 'https://discord.gg/7SBMKRy6q9', icon: 'discord', variant: 'minimal' },
			],
		},
	};
}

function homepageIntro() {
	return `## Where do you want to go?

<CardGrid>
	<LinkCard title="Getting Started" description="Install the game, patch to v1.51 and get online with OpenSpy." href="/getting-started/before-proceeding/" />
	<LinkCard title="Project Remaster" description="The community remaster: HD fonts, fixes and a modern launcher." href="/advanced/project-remaster/" />
	<LinkCard title="Addons & Tweaks" description="Bots, FOV, widescreen HUD, ReShade and more." href="/advanced/addons-tweaks/" />
	<LinkCard title="Help Centre" description="Troubleshooting steps and answers to common questions." href="/help-centre/" />
</CardGrid>

## About GetBF2142

`;
}

// ---------- sidebar from SUMMARY.md ----------

function buildSidebar(summary) {
	const labels = new Map();
	const sections = []; // top-level Starlight sidebar entries
	let group = null; // current "## Heading" group, or null for loose items
	let parent = null; // last top-level item (may gain children)

	const entry = (label, href) => {
		if (/^https?:/.test(href)) return { label, link: href, attrs: { target: '_blank', rel: 'noopener' } };
		const slug = slugFromFile(href);
		labels.set(slug, label);
		return { label, slug };
	};
	const container = () => (group ? group.items : sections);

	for (const line of summary.split('\n')) {
		const heading = line.match(/^## (.+)/);
		if (heading) {
			group = { label: heading[1].trim(), items: [] };
			sections.push(group);
			parent = null;
			continue;
		}
		if (/^\*\*\*/.test(line)) {
			group = null;
			parent = null;
			continue;
		}
		const item = line.match(/^(\s*)\* \[([^\]]+)\]\(([^)]+)\)/);
		if (!item) continue;
		const [, indent, label, href] = item;
		if (href === 'README.md') {
			labels.set('', label);
			continue; // homepage is the splash page, not a sidebar item
		}
		const e = entry(label, href);
		if (indent.length === 0) {
			container().push(e);
			parent = e;
		} else if (parent) {
			// First child turns the parent page into a collapsible group with an "Overview" link.
			if (!parent.items) {
				const overview = { label: 'Overview', slug: parent.slug };
				const idx = container().indexOf(parent);
				const grp = { label: parent.label, collapsed: false, items: [overview] };
				container()[idx] = grp;
				parent = grp;
			}
			parent.items.push(e);
		}
	}
	return { sidebar: sections, labels };
}

// ---------- main ----------

function main() {
	if (!fs.existsSync(path.join(SRC, 'SUMMARY.md'))) {
		console.error(`GitBook repo not found at ${SRC}`);
		process.exit(1);
	}
	copyAssets();
	const { sidebar, labels } = buildSidebar(fs.readFileSync(path.join(SRC, 'SUMMARY.md'), 'utf8'));
	fs.writeFileSync(SIDEBAR_OUT, JSON.stringify(sidebar, null, '\t') + '\n');

	fs.rmSync(DOCS_OUT, { recursive: true, force: true });
	let count = 0;
	for (const file of walk(SRC)) {
		const rel = path.relative(SRC, file);
		if (/^SUMMARY\.md$/i.test(rel)) continue;
		const slug = slugFromFile(rel);
		const outFile = path.join(DOCS_OUT, slug ? (/README\.md$/i.test(rel) ? `${slug}/index.mdx` : `${slug}.mdx`) : 'index.mdx');
		fs.mkdirSync(path.dirname(outFile), { recursive: true });
		const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
		fs.writeFileSync(outFile, convertPage(rel, raw, labels));
		count++;
	}
	console.log(`Migrated ${count} pages and ${assetMap.size} assets from ${SRC}`);
}

main();
