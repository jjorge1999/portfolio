# Jomer Jorge Portfolio

Freelance portfolio of Jomer "Jomz" Jorge, full-stack software engineer. Built with Angular 21 and Angular Material 3.

## Edit the content

Everything on the page (work, impact, skills, contact details) lives in `src/app/portfolio.data.ts`.

## Run locally

```bash
npm ci
npx ng serve
```

## Deploy

The site lives at https://jomerjorge.pages.dev (Cloudflare Pages). The build prerenders the
page to static HTML, so search engines and link previews see the full content.

Cloudflare Pages settings (Workers & Pages → Create → Pages → Connect to Git):

- Build command: `npx ng build`
- Build output directory: `dist/portfolio/browser`

Or deploy from your machine:

```bash
npx ng build
npx wrangler pages deploy dist/portfolio/browser --project-name jomerjorge
```

Pushing to `main` also publishes a copy to GitHub Pages; its canonical tag points search
engines at the Cloudflare URL.

## SEO

- Title, description, social previews and structured data: `src/index.html`
- `public/robots.txt` and `public/sitemap.xml` (bump `lastmod` when the content changes)
- If the domain changes, replace `jomerjorge.pages.dev` in those three files.
