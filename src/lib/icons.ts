import { icons as tabler } from '@iconify-json/tabler';
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils';

/** Inline SVG markup for a Tabler icon. Throws on unknown names so typos fail the build. */
export function iconSvg(name: string): string {
	const data = getIconData(tabler, name);
	if (!data) throw new Error(`Unknown Tabler icon "${name}" (see https://tabler.io/icons)`);
	const { attributes, body } = iconToSVG(data, { height: '1em' });
	return iconToHTML(replaceIDs(body), { ...attributes, 'aria-hidden': 'true', class: 'page-icon' });
}
