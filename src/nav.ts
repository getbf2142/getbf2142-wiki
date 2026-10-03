import { localize } from './lib/i18n';
import sidebar from './sidebar.json';

// Top bar menus (desktop only). Internal links pick up their page icon automatically;
// set `icon` (a Tabler name) for external links, or to override a page's icon.
export interface NavLink {
	label: string;
	/** Traditional Chinese label; falls back to `label`. */
	zh?: string;
	href: string;
	icon?: string;
	/** Draw a separator line above this item. */
	divider?: boolean;
}

export interface NavMenu {
	label: string;
	zh?: string;
	items: NavLink[];
}

// Every page in the sidebar's "Addons / Tweaks" section, so the menu never falls out of sync.
interface SidebarItem {
	label: string;
	slug?: string;
	link?: string;
	translations?: Record<string, string>;
	attrs?: Record<string, string>;
	items?: SidebarItem[];
}

function addonsTweaks(): NavLink[] {
	const section = (sidebar as SidebarItem[])
		.flatMap((group) => group.items ?? [])
		.find((item) => item.label === 'Addons / Tweaks');
	return (section?.items ?? [])
		.filter((item) => !('data-overview' in (item.attrs ?? {})))
		.map((item) => ({
			label: item.label,
			zh: item.translations?.['zh-TW'],
			href: item.slug ? `/${item.slug}/` : item.link!,
			...(item.slug
				? {}
				: {
						icon: item.attrs?.['data-icon'],
						divider: 'data-divider' in (item.attrs ?? {}),
					}),
		}));
}

// Shared by the top bar's Downloads menu and the /downloads/ page.
export const downloadLinks: NavLink[] = [
	{ label: 'Battlefield 2142', href: '/getting-started/download-and-install-bf2142/', icon: 'disc' },
	{ label: 'v1.51 Patch', zh: 'v1.51 更新檔', href: '/getting-started/download-and-install-v1_51-patch/', icon: 'bandage' },
	{ label: 'BF2142 Hub', href: '/getting-started/download-and-install-bf2142-hub/', icon: 'apps' },
	{ label: 'Reclamation Map Pack', zh: 'Reclamation 地圖包', href: '/getting-started/install-map-pack/', icon: 'map-2' },
	{ label: 'Project Remaster', href: '/advanced/project-remaster/install-project-remaster/', icon: 'flip-vertical' },
	{ label: 'BF2142Unlocker', href: '/advanced/addons-tweaks/bf2142unlocker/' },
	{ label: 'Dedicated Server', zh: '專用伺服器', href: '/advanced/dedicated-server/install-server/', icon: 'server' },
	{ label: 'Server Patch', zh: '伺服器修正檔', href: '/advanced/dedicated-server/install-server-patch/', icon: 'server-bolt' },
];

const menus: NavMenu[] = [
	{
		label: 'Docs',
		zh: '遊戲資料',
		items: [
			{ label: 'Manual', zh: '遊戲手冊', href: '/documents/manual/' },
			{ label: 'Game Guide', zh: '遊戲指南', href: '/documents/game-guide/' },
		],
	},
	{
		label: 'Downloads',
		zh: '下載',
		items: downloadLinks,
	},
	{
		label: 'Tweaks',
		zh: '擴充',
		items: addonsTweaks(),
	},
	{
		label: 'Help',
		zh: '說明',
		items: [
			{ label: 'Troubleshoot', zh: '疑難排解', href: '/help-centre/troubleshoot/' },
			{ label: 'FAQ', zh: '常見問題', href: '/help-centre/faq/' },
			{ label: 'Discord', href: 'https://discord.gg/7SBMKRy6q9', icon: 'brand-discord' },
		],
	},
	{
		label: 'Community',
		zh: '社群',
		items: [
			{ label: 'BF2142 Reclamation', href: 'https://battlefield2142.co/', icon: 'world' },
			{ label: 'BF2142 Remastered', href: 'https://www.moddb.com/mods/bf2142-project-remaster', icon: 'flip-vertical' },
			{ label: 'BF2142 Reworked', href: 'https://mozziefiles.wixsite.com/bf2142', icon: 'hammer' },
			{ label: 'First Strike (Star Wars)', zh: 'First Strike（星際大戰）', href: 'https://www.moddb.com/mods/first-strike', icon: 'planet' },
		],
	},
];

/** Menus for a locale ('zh-tw' or undefined for English): labels translated, internal links prefixed. */
export function getNavMenus(locale?: string): NavMenu[] {
	if (!locale) return menus;
	return menus.map((m) => ({
		label: m.zh ?? m.label,
		items: m.items.map((i) => ({
			...i,
			label: i.zh ?? i.label,
			href: localize(i.href, locale),
		})),
	}));
}
