# AI search visibility: generated llms.txt and JSON-LD

Date: 2026-11-12
Status: Draft for review

## Problem

AI search tools (ChatGPT, Perplexity, Claude, Google AI Overviews) say much less about jomerjorge.com than about
comparable portfolios such as maronaquillo.com. Two causes:

1. **Cloudflare challenges crawlers.** A plain request to `https://jomerjorge.com/` returns the "Just a moment…"
   page with `Cf-Mitigated: challenge`. Requests with GPTBot, ClaudeBot and PerplexityBot user agents get 403.
   This is a Cloudflare dashboard setting, not code, and is **out of scope for this spec**. It must be fixed
   (Security → Bots: turn off Bot Fight Mode and "Block AI bots", or add a WAF skip rule for verified bots),
   or none of the changes below will be seen.
2. **Little machine-readable detail.** There is no `llms.txt`. The JSON-LD has no occupation, languages or services,
   and it is a hand-kept copy of `APPS` in `src/index.html`, so it can drift from `portfolio.data.ts`.

## Goal

Every fact AI tools read about Jomer comes from `src/app/portfolio.data.ts` and is regenerated on each build.
Editing the data file and rebuilding updates the page, `llms.txt` and the JSON-LD together, with no second copy
to keep in sync.

## Decisions

- **Audience:** all three site audiences (business owner, global client, recruiter), balanced. A neutral profile
  comes first, followed by a section per audience.
- **Contact details exposed to AI tools:** email, LinkedIn, website and CV only. The mobile/Viber number is **not**
  included in `llms.txt` or the JSON-LD.
- **No `worksFor`** in the JSON-LD.
- **No end dates.** Experience shows start years only, matching the existing rule on `Impact.start`
  (overlapping work stays hidden).
- **No new claims.** All text and numbers come from `portfolio.data.ts`. The generator writes nothing on its own.
- **Languages:** English and Filipino (`knowsLanguage`).
- **sameAs:** LinkedIn (`PROFILE.linkedin`) and GitHub (`https://github.com/jjorge1999`).
- **No new dependencies.** Node's built-in TypeScript type stripping (unflagged since Node 22.18) runs the generator.
  `portfolio.data.ts` uses only erasable syntax (interfaces, type aliases, `const`), so it imports as-is.

## Design

### 1. Data additions: `src/app/portfolio.data.ts`

Add the facts the generators need but the site doesn't hold yet, to `PROFILE`:

- `github: 'https://github.com/jjorge1999'`
- `languages: ['English', 'Filipino']`
- `site: 'https://jomerjorge.com'`
- `fullName`, `photo`, `school` and `address`: moved verbatim from the hand-written JSON-LD in `src/index.html`
  (`Jomer Trillo Jorge`, `jomer.webp`, `STI College Calamba`, Calamba / Laguna / PH), so they keep a single source.

Update the doc comment on `APPS`: instead of "keep it in sync with the JSON-LD in src/index.html", say that the
JSON-LD and `llms.txt` are generated from this file.

### 2. Shared builder: `src/app/seo.ts`

A plain TypeScript module with no Angular imports and no DOM access. Exports two pure functions that take the
portfolio data as an argument:

- `buildLlmsTxt(data: PortfolioData): string`: the `llms.txt` markdown.
- `buildJsonLd(data: PortfolioData): object`: the schema.org `@graph`.

`PortfolioData` is `{ PROFILE, AUDIENCES, SERVICES, STATS, IMPACTS, APPS, CLIENTS, SKILLS }`, typed from
`./portfolio.data` with `import type` only.

Why the data is passed in rather than imported: Angular resolves extensionless imports (`./portfolio.data`) but Node
does not, and `import type` is erased by Node's type stripping. So `seo.ts` has no runtime imports, and works
unchanged both in the Angular build and when the Node script imports it. No `tsconfig` changes are needed.
Constraint: `seo.ts` uses only erasable TypeScript syntax (no enums, no parameter properties, no namespaces).

#### `llms.txt` layout

```
# Jomer Jorge

> {PROFILE.title}, {STATS 8 yrs}, Angular, Node and NestJS. Based in {PROFILE.location}, works remotely (UTC+8).

## Quick facts
- Name, nickname, title, location, experience (from STATS), education, languages
- Email, LinkedIn, GitHub, website, CV (absolute URL)

## Summary
{PROFILE.intro}

## For businesses in the Philippines
{AUDIENCES.business.intro}
- one line per SERVICES.business item: **title**: text

## For global and remote clients
{AUDIENCES.global.intro}
- one line per SERVICES.global item

## Experience
For each IMPACTS item with kind 'emp': **role at org** (since {start}): headline. Built: … Result: …

## Products and client work
For each IMPACTS item with kind 'prod' or 'free': same shape, plus link(s) and highlights (k: v, note)

## Live web apps
- one line per APPS item: **name** (url): category, text if present

## Clients
- CLIENTS names

## Skills
- one line per SKILLS group: **title**: items joined

## How to cite
- Source: https://jomerjorge.com
- Author: Jomer Jorge
- Updated: {build year}
```

Sections whose source data is empty are omitted.

#### JSON-LD `@graph`

Keeps the existing node `@id`s (`#website`, `#profile`, `#person`, `#apps`) so nothing else changes identity.

- `WebSite` and `ProfilePage`: unchanged in content.
- `Person`: as today, plus `hasOccupation` (`Occupation`, name = `PROFILE.title`, `occupationLocation` Philippines,
  `skills` = SKILLS items), `knowsLanguage`, `knowsAbout` = all SKILLS items (replaces the hand-written list),
  `sameAs` = LinkedIn + GitHub. No `worksFor`, no `telephone`.
- `ItemList #apps`: built from `APPS`. `applicationCategory` is mapped from `category`
  (Business → BusinessApplication, Health → HealthApplication, Education → EducationalApplication,
  Media → MultimediaApplication, Utility → UtilitiesApplication).
- New `ProfessionalService #service`: name "Jomer Jorge — Software Engineering", `provider` → `#person`,
  `areaServed` = Philippines and Worldwide, `serviceType` = titles from both SERVICES lists, no `priceRange`, no phone.

### 3. `llms.txt` generator: `scripts/gen-llms.mts`

About 10 lines: imports the data from `../src/app/portfolio.data.ts` and `buildLlmsTxt` from `../src/app/seo.ts`
(explicit `.ts` extensions, which Node accepts), and writes `public/llms.txt`.
The existing `public/**` asset glob in `angular.json` copies it to the build output.
`public/llms.txt` is listed in `.gitignore` because it is a build artefact.

### 4. JSON-LD in the prerendered page

- Remove the hand-written `<script type="application/ld+json">` block from `src/index.html`.
- In `App`, inject `DOCUMENT` and, during server rendering only (`isPlatformServer`), append a
  `<script type="application/ld+json">` containing `JSON.stringify(buildJsonLd(data))` to `document.head`,
  where `data` is built from the constants `App` already imports from `./portfolio.data`.
  The prerendered `index.html` therefore contains the JSON-LD as static HTML, and the browser does not
  add it twice.
- Add `<link rel="alternate" type="text/plain" href="llms.txt" …>` (relative, like the other head links, because the GitHub Pages mirror uses a different base href) to `src/index.html`.

### 5. `public/robots.txt`

Stays hand-written. Keep `User-agent: * / Allow: /` and the sitemap line. Add explicit `Allow: /` groups for
GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User,
Google-Extended and Applebot-Extended.

### 6. Build and CI

- `package.json`: add `"gen:llms": "node scripts/gen-llms.mts"` and make `build`, `deploy`, `deploy:staging` and
  `deploy:prod` run it first (`npm run gen:llms && ng build …`). Also `start` and `watch`, so the dev server serves it.
- `.github/workflows/pages.yml`: replace `npx ng build --base-href /` with
  `npm run gen:llms && npx ng build …` (keeping each job's existing flags) in every job that runs `ng build`, and set `node-version: '22.18'` or later
  (currently `22`, which resolves to the latest 22.x, but pinning the floor makes the requirement explicit).

## Error handling

- Generator failure (bad import, syntax Node can't strip) exits non-zero, so the build fails instead of
  deploying a stale or missing `llms.txt`.
- Missing optional fields (`start`, `links`, `highlights`, app `text`) are skipped, never printed as `undefined`.

## Testing

- `scripts/seo.test.mts`, run with Node's built-in `node --test` (the repo has no unit-test runner configured:
  no `test` target in `angular.json` and vitest is not installed, so this keeps the no-new-dependencies rule):
  - `buildLlmsTxt()` contains the name, email, every APPS url and every IMPACTS org; contains **no** mobile number
    (`PROFILE.mobile`, `PROFILE.mobileIntl`) and no `undefined`.
  - `buildJsonLd()` round-trips through `JSON.stringify`/`JSON.parse`; `#apps` has `APPS.length` items;
    Person has no `worksFor` or `telephone`; `sameAs` includes LinkedIn and GitHub.
- Build check: `npm run build`, then confirm `dist/portfolio/browser/llms.txt` exists and
  `dist/portfolio/browser/index.html` contains exactly one `application/ld+json` script.
- After deploy and the Cloudflare fix: Google Rich Results Test on https://jomerjorge.com/ and
  `curl -A GPTBot https://jomerjorge.com/llms.txt` returns 200.

## Out of scope

- The Cloudflare bot/challenge settings (dashboard change by the site owner).
- Subdomain apps' own SEO.
- `llms-full.txt`, sitemap changes, page copy changes.
