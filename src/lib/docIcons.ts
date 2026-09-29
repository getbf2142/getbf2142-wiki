import { getCollection } from 'astro:content';
import { normalizeHref } from './urls';

let iconsByHref: Map<string, string> | undefined;

/** Page `icon` frontmatter keyed by normalized doc path (e.g. `/getting-started/foo`). */
export async function getDocIconsByHref() {
	iconsByHref ??= new Map(
		(await getCollection('docs')).flatMap((e) => (e.data.icon ? [[normalizeHref(`/${e.id}`), e.data.icon]] : [])),
	);
	return iconsByHref;
}
