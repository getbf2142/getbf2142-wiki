# GetBF2142

Documentation site for the GetBF2142 community: Battlefield 2142 installs, patches, multiplayer, mods, and help. Built with [Astro 7](https://astro.build) and [Starlight](https://starlight.astro.build), with Tailwind CSS. English pages live at the site root; Traditional Chinese is under `/zh-tw/`. Contact and feedback use on-site forms that post to [Formspree](https://formspree.io). Production: [docs.getbf2142.net](https://docs.getbf2142.net). Source and “Edit page” links: [getbf2142/getbf2142-wiki](https://github.com/getbf2142/getbf2142-wiki).

## Requirements

- **Node.js 20.19+ or 22.12+** and **npm 9.6+** (matches Astro 7)
- **Formspree**, optional for local work; production contact/feedback delivery uses endpoints configured in `src/components/SiteForm.astro` (no `.env` in this repo)
- No other environment variables or services are required to build or preview the static site

## Quick Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Opens [http://localhost:4321](http://localhost:4321). For background mode, see `AGENTS.md`.

### 3. Production build and preview

```bash
npm run build
npm run preview
```

Static output is written to `dist/`.

### 4. Verify internal links (optional)

After a build:

```bash
npm run check-links
```

Scans `dist/` for broken in-page anchors and internal hrefs in article content.

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` / `npm start` | Dev server at `localhost:4321` |
| `npm run build` | Static site to `./dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check-links` | Link check on built HTML (run after `build`) |
| `npm run astro -- …` | Astro CLI (`astro check`, `astro add`, etc.) |

## Deployment

Static output from `npm run build` is deployed to **Cloudflare Pages** ([docs.getbf2142.net](https://docs.getbf2142.net)). Cache headers for `/_astro/`, `/assets/`, and `/art/` are defined in `public/_headers`; broader security headers are applied in Cloudflare Transform Rules.

## Structure

```
getbf2142/
├── public/                 # Favicons, OG images, static art; _headers for Pages
├── scripts/
│   └── check-links.mjs     # Post-build internal link validator
├── src/
│   ├── assets/             # Logo and images referenced from config/content
│   ├── components/         # Starlight overrides (Head, Sidebar, Footer, SiteForm, …)
│   ├── content/
│   │   ├── docs/           # English MDX; zh-tw/ mirror for 繁體中文
│   │   └── i18n/           # Starlight UI strings (e.g. zh-TW.json)
│   ├── lib/                # Shared helpers (i18n, icons)
│   ├── styles/
│   │   └── global.css      # Site-wide styles (also in Starlight customCss)
│   ├── content.config.ts   # Content collections schema
│   ├── nav.ts              # Desktop header menus; download list shared with /downloads/
│   ├── routeData.ts        # Route middleware; sidebar markers and prev/next rules
│   └── sidebar.json        # Sidebar tree (loaded in astro.config.mjs)
├── astro.config.mjs        # Site URL, locales, redirects, Starlight options
├── AGENTS.md               # Dev server background mode notes for agents
└── package.json
```

Starlight maps each file under `src/content/docs/` to a URL. Add or edit `.mdx` there (and under `zh-tw/` when translating). Standalone pages such as `contact-us.mdx` and `feedback.mdx` are linked from the header and footer but are not required in `sidebar.json`. Sidebar entries and icons are driven by `sidebar.json` and markers documented in `routeData.ts`.
