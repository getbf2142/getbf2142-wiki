import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import { getDocIconsByHref } from '~/lib/docIcons';
import { normalizeHref } from '~/lib/urls';

type SidebarEntry = StarlightRouteData['sidebar'][number];
type SidebarLink = Extract<SidebarEntry, { type: 'link' }>;
type SidebarGroup = Extract<SidebarEntry, { type: 'group' }>;

/*
 * Sidebar conventions (src/sidebar.json):
 * - A group whose first item has `data-overview` is a section with its own page: the group label
 *   links to that page and the item itself is not listed.
 * - Items with `data-hidden` stay reachable by URL but are left out of the sidebar and prev/next,
 *   like GitBook's hidden pages. A hidden overview hides its whole section.
 * - Items with `data-index` are standalone card pages (e.g. Downloads), laid out like a section overview.
 * - Prev/next only link pages within the same group, in sidebar order, skipping its overview. Pages
 *   outside any group get none, and an overview with `data-standalone` turns it off for its whole
 *   section (e.g. Addons / Tweaks, whose pages don't follow on from each other).
 * - Every link gets `data-icon` from its page's `icon` frontmatter (external links set it in sidebar.json).
 */

export const isOverview = (e: SidebarEntry | undefined): e is SidebarLink => e?.type === 'link' && 'data-overview' in e.attrs;
const isHidden = (e: SidebarEntry): boolean =>
	e.type === 'link' ? 'data-hidden' in e.attrs : isOverview(e.entries[0]) && isHidden(e.entries[0]);

function annotate(entries: SidebarEntry[], icons: Map<string, string>) {
	for (const e of entries) {
		if (e.type === 'group') annotate(e.entries, icons);
		else if (!e.attrs['data-icon']) {
			const icon = icons.get(normalizeHref(e.href));
			if (icon) e.attrs['data-icon'] = icon;
		}
	}
}

/** The section whose overview page is being rendered, if any. */
function findCurrentSection(entries: SidebarEntry[]): SidebarGroup | undefined {
	for (const e of entries) {
		if (e.type !== 'group') continue;
		if (isOverview(e.entries[0]) && e.entries[0].isCurrent) return e;
		const nested = findCurrentSection(e.entries);
		if (nested) return nested;
	}
}

const prune = (entries: SidebarEntry[]): SidebarEntry[] =>
	entries.filter((e) => !isHidden(e)).map((e) => (e.type === 'group' ? { ...e, entries: prune(e.entries) } : e));

const isIndex = (e: SidebarLink) => 'data-index' in e.attrs;

const flattenInternal = (entries: SidebarEntry[]): SidebarLink[] =>
	entries.flatMap((e) => (e.type === 'group' ? flattenInternal(e.entries) : e.href.startsWith('/') ? [e] : []));

/** The innermost group that lists the current page directly, if any. */
function findCurrentGroup(entries: SidebarEntry[]): SidebarGroup | undefined {
	for (const e of entries) {
		if (e.type !== 'group') continue;
		if (e.entries.some((c) => c.type === 'link' && c.isCurrent)) return e;
		const nested = findCurrentGroup(e.entries);
		if (nested) return nested;
	}
}

/** The pages a guide's prev/next can step through: its group's own internal pages, minus the overview. */
function sequenceOf(entries: SidebarEntry[]): SidebarLink[] {
	const group = findCurrentGroup(entries);
	if (!group || (isOverview(group.entries[0]) && 'data-standalone' in group.entries[0].attrs)) return [];
	return group.entries.flatMap((e) => (e.type === 'link' && !isOverview(e) && e.href.startsWith('/') ? [e] : []));
}

export const onRequest = defineRouteMiddleware(async (context) => {
	const route = context.locals.starlightRoute;
	annotate(route.sidebar, await getDocIconsByHref());

	// Section cards read the unpruned tree so hidden sections (Documents, Archive) still list their pages.
	const section = findCurrentSection(route.sidebar);
	const standaloneIndex = flattenInternal(route.sidebar).some((l) => l.isCurrent && isIndex(l));
	context.locals.sectionEntries = standaloneIndex ? [] : section?.entries.slice(1);

	route.sidebar = prune(route.sidebar);

	// Section overviews are just card indexes, so they get no prev/next. They keep an empty TOC
	// (rendered as a blank right column by PageSidebar.astro) so the layout matches other pages.
	if (section || standaloneIndex) {
		route.pagination = { prev: undefined, next: undefined };
		route.toc = { minHeadingLevel: 2, maxHeadingLevel: 3, items: [] };
		return;
	}

	// Rebuild prev/next within the page's group, without hidden pages or external links,
	// keeping frontmatter opt-outs.
	const links = sequenceOf(route.sidebar);
	const i = links.findIndex((l) => l.isCurrent);
	const { prev, next } = route.entry.data;
	route.pagination = {
		prev: prev === false || i < 1 ? undefined : links[i - 1],
		next: next === false || i < 0 ? undefined : links[i + 1],
	};
});
