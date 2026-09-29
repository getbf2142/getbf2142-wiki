// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import sidebar from './src/sidebar.json' with { type: 'json' };

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.getbf2142.net',
	// Keep former URLs working for existing links and bookmarks.
	redirects: {
		'/others': '/disclaimer',
		'/others/disclaimer': '/disclaimer',
		'/others/contact-us': '/contact-us',
		'/others/feedback': '/feedback',
	},
	integrations: [
		starlight({
			title: 'GetBF2142',
			// English lives at the root so existing URLs keep working; Traditional Chinese is under /zh-tw/.
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
			},
			description: 'Your go-to hub for Battlefield 2142: installs, patches, multiplayer and mods.',
			logo: { src: './src/assets/logo.svg', replacesTitle: false },
			favicon: '/favicon.svg',
			head: [
				// PNG/ICO fallbacks for the SVG favicon: iOS home screen, older browsers and search results.
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.getbf2142.net/og.jpg' } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '590' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.getbf2142.net/og.jpg' } },
			],
			social: [
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/7SBMKRy6q9' },
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/getbf2142/getbf2142-wiki' },
			],
			editLink: { baseUrl: 'https://github.com/getbf2142/getbf2142-wiki/edit/main/' },
			lastUpdated: true,
			// Fonts are declared in src/components/Head.astro.
			customCss: ['./src/styles/global.css'],
			expressiveCode: {
				styleOverrides: {
					codeFontFamily: "'IBM Plex Mono', ui-monospace, monospace",
					codeFontSize: '0.875rem',
					borderRadius: '0.5rem',
					borderColor: 'var(--sl-color-hairline)',
					frames: { shadowColor: 'transparent' },
				},
			},
			components: {
				Footer: './src/components/Footer.astro',
				Head: './src/components/Head.astro',
				PageSidebar: './src/components/PageSidebar.astro',
				PageTitle: './src/components/PageTitle.astro',
				Pagination: './src/components/Pagination.astro',
				Sidebar: './src/components/Sidebar.astro',
				SocialIcons: './src/components/SocialIcons.astro',
			},
			routeMiddleware: './src/routeData.ts',
			// Markers (data-overview, data-hidden, data-icon) are explained in src/routeData.ts.
			sidebar,
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
