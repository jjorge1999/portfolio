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

The build prerenders the page to static HTML, so search engines and link previews see the full content.
Both environments serve the same build output (`dist/portfolio/browser`).

| Environment | URL | Cloudflare | Command |
|---|---|---|---|
| Production | https://jomerjorge.com | Worker `jomerjorge-prod` ([wrangler.prod.jsonc](wrangler.prod.jsonc)) | `npm run deploy:prod` |
| Staging | https://jomerjorge.pages.dev | Pages project `jomerjorge` | `npm run deploy:staging` |

Production is a Worker with static assets because a Worker custom domain gets its DNS record and
certificate created automatically. Deploy to staging first, check it, then deploy production.

Only production is indexed. [public/_headers](public/_headers) sends `X-Robots-Tag: noindex` on every
`*.pages.dev` address, and pushing to `main` also publishes a GitHub Pages mirror that the workflow
marks `noindex`.

## SEO

- Title, description, social previews and structured data: `src/index.html`
- `public/robots.txt` and `public/sitemap.xml` (bump `lastmod` when the content changes)
- If the domain changes, replace `jomerjorge.com` in those three files.
