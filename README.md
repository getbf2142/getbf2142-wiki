# GetBF2142

Documentation site for the GetBF2142 community: Battlefield 2142 installs, patches, multiplayer, mods, and help. Built with [Astro 7](https://astro.build) and [Starlight](https://starlight.astro.build), with Tailwind CSS. English pages live at the site root; Traditional Chinese is under `/zh-tw/`. Production: [docs.getbf2142.net](https://docs.getbf2142.net).

## Requirements

- **Node.js 22.12+** and **npm 9.6+** (matches Astro 7)
- No environment variables or external services are required for local build or preview

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

Content edits on GitHub use the “Edit page” link (base repo: [getbf2142/getbf2142-wiki](https://github.com/getbf2142/getbf2142-wiki)).

## Structure

```
getbf2142/
├── public/                 # Favicons, OG images, static art
├── scripts/
│   └── check-links.mjs     # Post-build internal link validator
├── src/
│   ├── assets/             # Logo and images referenced from config/content
│   ├── components/         # Starlight layout overrides (Head, Sidebar, Footer, …)
│   ├── content/
│   │   ├── docs/           # English MDX; zh-tw/ mirror for 繁體中文
│   │   └── i18n/           # UI strings (e.g. zh-TW.json)
│   ├── lib/                # Shared helpers (e.g. i18n)
│   ├── styles/
│   │   └── global.css      # Site-wide styles (also in Starlight customCss)
│   ├── content.config.ts   # Content collections schema
│   ├── nav.ts              # External URLs (contact, feedback forms)
│   ├── routeData.ts        # Route middleware; sidebar marker conventions
│   └── sidebar.json        # Sidebar tree (loaded in astro.config.mjs)
├── astro.config.mjs        # Site URL, locales, redirects, Starlight options
├── AGENTS.md               # Dev server background mode notes for agents
└── package.json
```

Starlight maps each file under `src/content/docs/` to a URL. Add or edit `.mdx` there (and under `zh-tw/` when translating). Sidebar entries and icons are driven by `sidebar.json` and markers documented in `routeData.ts`.
