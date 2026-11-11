# AI Search SEO (generated llms.txt and JSON-LD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate `llms.txt` and the schema.org JSON-LD from `src/app/portfolio.data.ts` on every build, so AI search tools read the same facts as the page.

**Architecture:** A pure module `src/app/seo.ts` exposes `buildLlmsTxt(data)` and `buildJsonLd(data)`. A Node script (run with built-in TypeScript type stripping) writes `public/llms.txt` before each build. The Angular app writes the JSON-LD into `<head>` during prerender only, replacing the hand-written block in `src/index.html`.

**Tech Stack:** Angular 21 (SSR prerender, `@angular/build`), Node 24 locally / 24 in CI (native TypeScript type stripping), `node:test` + `node:assert`.

Spec: `docs/superpowers/specs/2026-11-12-ai-search-seo-design.md`

## Global Constraints

- No new npm dependencies.
- `src/app/seo.ts` has **no runtime imports** (only `import type` / `typeof import(...)`) and uses only erasable TypeScript syntax (no enums, no parameter properties, no namespaces).
- Contact details in `llms.txt` and JSON-LD: email, LinkedIn, GitHub, website, CV only. **Never** `PROFILE.mobile`, `PROFILE.mobileIntl` or `PROFILE.viber`.
- No `worksFor`, no `telephone` in JSON-LD.
- Experience shows start years only, never end dates.
- No new claims: every fact comes from `portfolio.data.ts`.
- `knowsLanguage`: English, Filipino. `sameAs`: `PROFILE.linkedin` and `https://github.com/jjorge1999`.
- Node commands that import `.ts` files use `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` (package.json has no `"type"`; do not add one, it would change how Angular tooling treats `.js` files).
- Every commit message ends with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
- Work happens on branch `feat/ai-search-seo` (already created).

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/portfolio.data.ts` | Modify | Single source of facts; gains `github`, `languages`, `site`, `fullName`, `photo`, `school`, `address` on `PROFILE` |
| `src/app/seo.ts` | Create | Pure builders: `buildLlmsTxt`, `buildJsonLd` |
| `scripts/seo.test.mts` | Create | `node:test` tests for both builders |
| `scripts/gen-llms.mts` | Create | Writes `public/llms.txt` |
| `package.json` | Modify | `gen:llms`, `test:seo` scripts; generator runs before builds |
| `.gitignore` | Modify | Ignore generated `public/llms.txt` |
| `src/app/app.ts` | Modify | Writes JSON-LD into `<head>` on the server only |
| `src/index.html` | Modify | Remove hand-written JSON-LD; add `rel="alternate"` link to `llms.txt` |
| `public/robots.txt` | Modify | Explicit allow groups for AI crawlers |
| `.github/workflows/pages.yml` | Modify | Run generator before `ng build`; Node 24 |

---

### Task 1: Profile data and `buildLlmsTxt`

**Files:**
- Modify: `src/app/portfolio.data.ts` (the `PROFILE` object, and the doc comment above `APPS`)
- Create: `src/app/seo.ts`
- Test: `scripts/seo.test.mts`
- Modify: `package.json` (add `test:seo`)

**Interfaces:**
- Produces: `export type PortfolioData = typeof import('./portfolio.data');`
- Produces: `export function buildLlmsTxt(d: PortfolioData, year?: number): string` (`year` defaults to the current year; used for "Updated:")
- Produces new `PROFILE` fields: `fullName: string`, `photo: string`, `school: string`, `address: { locality: string; region: string; country: string }`, `site: string`, `github: string`, `languages: string[]`

- [ ] **Step 1: Add the test script to `package.json`**

In `"scripts"`, after `"test": "ng test",` add:

```json
    "test:seo": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/seo.test.mts",
```

- [ ] **Step 2: Write the failing tests**

Create `scripts/seo.test.mts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../src/app/portfolio.data.ts';
import { buildLlmsTxt } from '../src/app/seo.ts';

const PRIVATE = [data.PROFILE.mobile, data.PROFILE.mobileIntl, data.PROFILE.viber, '0919'];

test('llms.txt starts with the name and a summary line', () => {
  const txt = buildLlmsTxt(data, 2030);
  assert.match(txt, /^# Jomer Jorge\n\n> /);
});

test('llms.txt lists public contact details', () => {
  const txt = buildLlmsTxt(data, 2030);
  for (const s of [data.PROFILE.email, data.PROFILE.linkedin, data.PROFILE.github, 'https://jomerjorge.com/Jomer-Jorge-CV.pdf']) {
    assert.ok(txt.includes(s), `missing ${s}`);
  }
});

test('llms.txt never contains the mobile number', () => {
  const txt = buildLlmsTxt(data, 2030);
  for (const s of PRIVATE) assert.ok(!txt.includes(s), `leaked ${s}`);
});

test('llms.txt covers every impact, app, service, client and skill', () => {
  const txt = buildLlmsTxt(data, 2030);
  const expected = [
    ...data.IMPACTS.map((i) => i.org),
    ...data.APPS.map((a) => a.url),
    ...data.SERVICES.business.map((s) => s.title),
    ...data.SERVICES.global.map((s) => s.title),
    ...data.CLIENTS.map((c) => c.name),
    ...data.SKILLS.flatMap((g) => g.items),
  ];
  for (const s of expected) assert.ok(txt.includes(s), `missing ${s}`);
});

test('llms.txt shows start years only and no undefined values', () => {
  const txt = buildLlmsTxt(data, 2030);
  assert.ok(txt.includes('(since 2022)'));
  assert.ok(!/\b20\d\d\s*[–-]\s*(20\d\d|present)/i.test(txt), 'found a date range');
  assert.ok(!txt.includes('undefined'));
});

test('llms.txt ends with a citation using the given year', () => {
  const txt = buildLlmsTxt(data, 2030);
  assert.match(txt, /## How to cite\n\n- Source: https:\/\/jomerjorge\.com\n- Author: Jomer Jorge\n- Updated: 2030\n$/);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:seo`
Expected: FAIL. The run errors with `Cannot find module '.../src/app/seo.ts'` (ERR_MODULE_NOT_FOUND).

- [ ] **Step 4: Add the profile fields**

In `src/app/portfolio.data.ts`, replace the end of `PROFILE`:

```ts
  location: 'Calamba, Laguna · BGC, Taguig',
  education: 'BS Information Technology, STI College Calamba',
};
```

with:

```ts
  location: 'Calamba, Laguna · BGC, Taguig',
  education: 'BS Information Technology, STI College Calamba',
  // Used by the generated llms.txt and JSON-LD (see seo.ts), not shown on the page.
  fullName: 'Jomer Trillo Jorge',
  photo: 'jomer.webp',
  school: 'STI College Calamba',
  address: { locality: 'Calamba', region: 'Laguna', country: 'PH' },
  site: 'https://jomerjorge.com',
  github: 'https://github.com/jjorge1999',
  languages: ['English', 'Filipino'],
};
```

And replace the comment above `APPS`:

```ts
/**
 * Live web apps on jomerjorge.com subdomains (served by infra/subdomains).
 * Text comes from each app's own title and description; keep it in sync with the JSON-LD in src/index.html.
 */
```

with:

```ts
/**
 * Live web apps on jomerjorge.com subdomains (served by infra/subdomains).
 * Text comes from each app's own title and description. The JSON-LD and llms.txt are generated from this list (see seo.ts).
 */
```

- [ ] **Step 5: Write `src/app/seo.ts` with `buildLlmsTxt`**

```ts
import type { Impact } from './portfolio.data';

/**
 * Builds what search engines and AI tools read about the site, from portfolio.data.ts only.
 * The data is passed in (not imported) so this file has no runtime imports and also runs under plain Node
 * (scripts/gen-llms.mts), where extensionless imports don't resolve.
 */
export type PortfolioData = typeof import('./portfolio.data');

/** Markdown served at /llms.txt. Never includes the mobile number. */
export function buildLlmsTxt(d: PortfolioData, year = new Date().getFullYear()): string {
  const p = d.PROFILE;
  const audience = (id: string) => d.AUDIENCES.find((a) => a.id === id);
  const out: string[] = [`# ${p.name}`, '', `> ${p.title} based in ${p.location}, Philippines. ${p.headline}`];
  const section = (title: string, body: string[]) => {
    if (body.length) out.push('', `## ${title}`, '', ...body);
  };

  section('Quick facts', [
    `- **Name**: ${p.name} ("${p.nickname}"), full name ${p.fullName}`,
    `- **Role**: ${p.title}`,
    `- **Location**: ${p.location}, Philippines (UTC+8)`,
    `- **Education**: ${p.education}`,
    `- **Languages**: ${p.languages.join(', ')}`,
    ...d.STATS.map((s) => `- **${s.label}**: ${s.value} (${s.note})`),
    `- **Email**: ${p.email}`,
    `- **LinkedIn**: ${p.linkedin}`,
    `- **GitHub**: ${p.github}`,
    `- **Website**: ${p.site}`,
    `- **CV**: ${p.site}/${p.cv}`,
  ]);
  section('Summary', [p.intro]);
  section('For businesses in the Philippines', [
    audience('business')?.intro ?? '',
    '',
    ...d.SERVICES.business.map((s) => `- **${s.title}**: ${s.text}`),
  ]);
  section('For global and remote clients', [
    audience('global')?.intro ?? '',
    '',
    ...d.SERVICES.global.map((s) => `- **${s.title}**: ${s.text}`),
  ]);
  section('Experience', [
    audience('recruiter')?.intro ?? '',
    ...d.IMPACTS.filter((i) => i.kind === 'emp').flatMap(impactLines),
  ]);
  section('Products and client work', d.IMPACTS.filter((i) => i.kind !== 'emp').flatMap(impactLines));
  section(
    'Live web apps',
    d.APPS.map((a) => `- **${a.name}** (${a.url}): ${a.category}${a.text ? `. ${a.text}` : ''}`),
  );
  section('Clients', d.CLIENTS.map((c) => `- ${c.name}`));
  section('Skills', d.SKILLS.map((g) => `- **${g.title}**: ${g.items.join(', ')}`));
  section('How to cite', [`- Source: ${p.site}`, `- Author: ${p.name}`, `- Updated: ${year}`]);

  return out.join('\n') + '\n';
}

function impactLines(i: Impact): string[] {
  const out = [
    '',
    `### ${i.org}`,
    '',
    `${i.role}${i.start ? ` (since ${i.start})` : ''}. ${i.headline}.`,
    '',
    `- Challenge: ${i.challenge}`,
    `- ${i.builtLabel ?? 'Built'}: ${i.built}`,
    `- ${i.resultLabel ?? 'Result'}: ${i.result}`,
    `- Stack: ${i.tags.join(', ')}`,
  ];
  for (const l of i.links ?? []) out.push(`- Link: ${l.url}`);
  for (const h of i.highlights ?? []) out.push(`- ${h.k}: ${h.v} (${h.note})`);
  return out;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:seo`
Expected: PASS. 6 tests, 0 failures.

- [ ] **Step 7: Check the Angular build still compiles**

Run: `npx ng build`
Expected: build succeeds (the new `PROFILE` fields are unused by the template, which is fine).

- [ ] **Step 8: Commit**

```bash
git add src/app/portfolio.data.ts src/app/seo.ts scripts/seo.test.mts package.json
git commit -m "feat(seo): build llms.txt from portfolio data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `buildJsonLd`

**Files:**
- Modify: `src/app/seo.ts`
- Test: `scripts/seo.test.mts`

**Interfaces:**
- Consumes: `PortfolioData`, `PROFILE` fields from Task 1
- Produces: `export function buildJsonLd(d: PortfolioData): { '@context': string; '@graph': Record<string, unknown>[] }`
  with nodes `@id` = `https://jomerjorge.com/#website`, `#profile`, `#person`, `#apps`, `#service`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/seo.test.mts`, and change the import line to `import { buildJsonLd, buildLlmsTxt } from '../src/app/seo.ts';`:

```ts
const node = (id: string) => buildJsonLd(data)['@graph'].find((n) => n['@id'] === `https://jomerjorge.com/#${id}`) as any;

test('JSON-LD survives a JSON round trip', () => {
  const ld = buildJsonLd(data);
  assert.deepEqual(JSON.parse(JSON.stringify(ld)), ld);
  assert.equal(ld['@context'], 'https://schema.org');
});

test('JSON-LD keeps the existing node ids and adds the service', () => {
  for (const id of ['website', 'profile', 'person', 'apps', 'service']) assert.ok(node(id), `missing #${id}`);
});

test('Person has occupation, languages and links, but no employer or phone', () => {
  const person = node('person');
  assert.equal(person['@type'], 'Person');
  assert.equal(person.worksFor, undefined);
  assert.equal(person.telephone, undefined);
  assert.deepEqual(person.sameAs, [data.PROFILE.linkedin, 'https://github.com/jjorge1999']);
  assert.deepEqual(person.knowsLanguage.map((l: any) => l.name), ['English', 'Filipino']);
  assert.equal(person.hasOccupation['@type'], 'Occupation');
  assert.deepEqual(person.knowsAbout, data.SKILLS.flatMap((g) => g.items));
});

test('apps list has one entry per app with a schema.org category', () => {
  const items = node('apps').itemListElement;
  assert.equal(items.length, data.APPS.length);
  for (const li of items) assert.match(li.item.applicationCategory, /Application$/);
});

test('service lists every service title and points at the person', () => {
  const service = node('service');
  assert.equal(service.provider['@id'], 'https://jomerjorge.com/#person');
  assert.deepEqual(service.serviceType, [...data.SERVICES.business, ...data.SERVICES.global].map((s) => s.title));
});

test('JSON-LD never contains the mobile number', () => {
  const json = JSON.stringify(buildJsonLd(data));
  for (const s of PRIVATE) assert.ok(!json.includes(s), `leaked ${s}`);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:seo`
Expected: FAIL. `SyntaxError: The requested module '../src/app/seo.ts' does not provide an export named 'buildJsonLd'`.

- [ ] **Step 3: Implement `buildJsonLd`**

Append to `src/app/seo.ts`:

```ts
const APP_CATEGORY: Record<string, string> = {
  Business: 'BusinessApplication',
  Health: 'HealthApplication',
  Education: 'EducationalApplication',
  Media: 'MultimediaApplication',
  Utility: 'UtilitiesApplication',
};

/** schema.org graph written into the prerendered page (see App). No employer, no phone number. */
export function buildJsonLd(d: PortfolioData): { '@context': string; '@graph': Record<string, unknown>[] } {
  const p = d.PROFILE;
  const home = `${p.site}/`;
  const ref = (id: string) => ({ '@id': `${home}#${id}` });
  const skills = d.SKILLS.flatMap((g) => g.items);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        ...ref('website'),
        url: home,
        name: p.name,
        inLanguage: 'en',
        image: `${home}icon-512.png`,
      },
      {
        '@type': 'ProfilePage',
        ...ref('profile'),
        url: home,
        name: `${p.name} | ${p.title}`,
        isPartOf: ref('website'),
        mainEntity: ref('person'),
      },
      {
        '@type': 'Person',
        ...ref('person'),
        name: p.name,
        alternateName: [p.nickname, p.fullName],
        url: home,
        image: `${home}${p.photo}`,
        jobTitle: p.title,
        description: p.intro,
        email: `mailto:${p.email}`,
        alumniOf: { '@type': 'CollegeOrUniversity', name: p.school },
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.address.locality,
          addressRegion: p.address.region,
          addressCountry: p.address.country,
        },
        hasOccupation: {
          '@type': 'Occupation',
          name: p.title,
          occupationLocation: { '@type': 'Country', name: 'Philippines' },
          skills: skills.join(', '),
        },
        knowsAbout: skills,
        knowsLanguage: p.languages.map((name) => ({ '@type': 'Language', name })),
        sameAs: [p.linkedin, p.github],
      },
      {
        '@type': 'ItemList',
        ...ref('apps'),
        name: `Web apps built by ${p.name}`,
        itemListElement: d.APPS.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'WebApplication',
            name: a.name,
            url: `${a.url}/`,
            ...(a.text ? { description: a.text } : {}),
            applicationCategory: APP_CATEGORY[a.category] ?? 'WebApplication',
            operatingSystem: 'Web',
            creator: ref('person'),
          },
        })),
      },
      {
        '@type': 'ProfessionalService',
        ...ref('service'),
        name: `${p.name} — Software Engineering`,
        url: home,
        email: p.email,
        image: `${home}${p.photo}`,
        areaServed: [{ '@type': 'Country', name: 'Philippines' }, 'Worldwide'],
        serviceType: [...d.SERVICES.business, ...d.SERVICES.global].map((s) => s.title),
        provider: ref('person'),
      },
    ],
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:seo`
Expected: PASS. 12 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/app/seo.ts scripts/seo.test.mts
git commit -m "feat(seo): build JSON-LD graph from portfolio data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Generate `llms.txt` on every build

**Files:**
- Create: `scripts/gen-llms.mts`
- Modify: `package.json` (`scripts`)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `buildLlmsTxt(d: PortfolioData, year?: number): string` from `src/app/seo.ts`
- Produces: npm script `gen:llms`; file `public/llms.txt` (git-ignored); `dist/portfolio/browser/llms.txt` after a build

- [ ] **Step 1: Write the generator**

Create `scripts/gen-llms.mts`:

```ts
// Writes public/llms.txt from src/app/portfolio.data.ts, so AI tools read the same facts as the page.
// Runs before every build (see package.json). Node strips the TypeScript types itself, so no build step is needed.
import { writeFileSync } from 'node:fs';
import * as data from '../src/app/portfolio.data.ts';
import { buildLlmsTxt } from '../src/app/seo.ts';

writeFileSync(new URL('../public/llms.txt', import.meta.url), buildLlmsTxt(data));
console.log('Wrote public/llms.txt');
```

- [ ] **Step 2: Wire it into `package.json`**

Replace the `"scripts"` block with:

```json
  "scripts": {
    "ng": "ng",
    "gen:llms": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/gen-llms.mts",
    "start": "npm run gen:llms && ng serve",
    "build": "npm run gen:llms && ng build",
    "watch": "npm run gen:llms && ng build --watch --configuration development",
    "test": "ng test",
    "test:seo": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/seo.test.mts",
    "deploy": "npm run build && wrangler pages deploy dist/portfolio/browser --project-name jomerjorge --branch main",
    "deploy:staging": "npm run build && npx wrangler pages deploy dist/portfolio/browser --project-name jomerjorge --branch main",
    "deploy:prod": "npm run build && npx wrangler deploy -c wrangler.prod.jsonc"
  },
```

- [ ] **Step 3: Ignore the generated file**

Append to `.gitignore`:

```
# Generated from src/app/portfolio.data.ts by scripts/gen-llms.mts
/public/llms.txt
```

- [ ] **Step 4: Run the build and verify the output**

Run: `npm run build`
Expected: prints `Wrote public/llms.txt`, then the Angular build succeeds.

Run: `head -5 dist/portfolio/browser/llms.txt && git status --short public/`
Expected: first line `# Jomer Jorge`; `git status` shows nothing for `public/llms.txt` (ignored).

- [ ] **Step 5: Commit**

```bash
git add scripts/gen-llms.mts package.json .gitignore
git commit -m "build: generate llms.txt before every build

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: JSON-LD in the prerendered page

**Files:**
- Modify: `src/app/app.ts` (imports at lines 1-2 and 8-24; constructor at line 253)
- Modify: `src/index.html` (remove the `<!-- Structured data ... -->` comment and its `<script type="application/ld+json">` block; add one `<link>`)

**Interfaces:**
- Consumes: `buildJsonLd(d: PortfolioData)` from `./seo`

- [ ] **Step 1: Write the failing check**

Run: `npm run build && grep -c 'application/ld+json' dist/portfolio/browser/index.html && grep -c 'jomerjorge.com/#service' dist/portfolio/browser/index.html`
Expected: first count `1` (the hand-written block), then the second grep prints `0` and exits 1, because the hand-written block has no `#service` node.

- [ ] **Step 2: Update imports in `src/app/app.ts`**

Change line 1 to:

```ts
import { Component, DestroyRef, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
```

Change line 2 to:

```ts
import { DOCUMENT, NgTemplateOutlet, isPlatformServer } from '@angular/common';
```

After the closing `} from './portfolio.data';` add:

```ts
import * as portfolio from './portfolio.data';
import { buildJsonLd } from './seo';
```

- [ ] **Step 3: Write the JSON-LD on the server**

In the constructor, directly after `const destroy = inject(DestroyRef);` add:

```ts

    // Structured data comes from portfolio.data.ts (see seo.ts). It is written into the prerendered HTML only,
    // so the browser never adds a second copy. `<` is escaped so no text can close the script tag early.
    if (isPlatformServer(inject(PLATFORM_ID))) {
      const doc = inject(DOCUMENT);
      const ld = doc.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify(buildJsonLd(portfolio)).replace(/</g, '\\u003c');
      doc.head.appendChild(ld);
    }
```

- [ ] **Step 4: Remove the hand-written block from `src/index.html`**

Delete everything from the line

```html
  <!-- Structured data: lets Google show a proper person/profile result -->
```

through the matching closing `</script>` (the one just before `<link rel="icon" href="favicon.ico" sizes="48x48">`), keeping the blank line before the icon links.

Then, after `<link rel="manifest" href="site.webmanifest">`, add:

```html
  <link rel="alternate" type="text/plain" href="llms.txt" title="llms.txt: profile for AI tools">
```

(`href` is relative to match the other links, because the GitHub Pages mirror builds with a different `--base-href`.)

- [ ] **Step 5: Run the check to verify it passes**

Run: `npm run build && grep -c 'application/ld+json' dist/portfolio/browser/index.html && grep -c 'jomerjorge.com/#service' dist/portfolio/browser/index.html`
Expected: `1` and `1`.

Then validate the embedded JSON:

```bash
node -e "const h=require('fs').readFileSync('dist/portfolio/browser/index.html','utf8');const m=h.match(/<script type=\"application\/ld\+json\">(.*?)<\/script>/s);const g=JSON.parse(m[1])['@graph'];console.log(g.map(n=>n['@id']).join('\n'))"
```

Expected: five lines ending in `#website`, `#profile`, `#person`, `#apps`, `#service`.

Run: `npm run test:seo`
Expected: PASS. 12 tests.

- [ ] **Step 6: Check the page in the browser**

Run: `npm start`, open http://localhost:4200, confirm the page renders, the theme toggle and audience switch work, and the browser console shows no errors. In DevTools Elements, `<head>` has no `application/ld+json` script on the dev server (expected: `ng serve` renders on the client; the JSON-LD only exists in the prerendered build checked in Step 5).

- [ ] **Step 7: Commit**

```bash
git add src/app/app.ts src/index.html
git commit -m "feat(seo): render JSON-LD from portfolio data at prerender

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: robots.txt and CI

**Files:**
- Modify: `public/robots.txt`
- Modify: `.github/workflows/pages.yml` (both `setup-node` steps and both `ng build` steps)

**Interfaces:**
- Consumes: npm script `gen:llms` from Task 3

- [ ] **Step 1: Replace `public/robots.txt`**

```
User-agent: *
Allow: /

# AI search and assistant crawlers, named explicitly so the site's intent is clear.
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: OAI-SearchBot
User-agent: ClaudeBot
User-agent: Claude-User
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Applebot-Extended
Allow: /

Sitemap: https://jomerjorge.com/sitemap.xml
```

- [ ] **Step 2: Update the CI workflow**

In `.github/workflows/pages.yml`, change both occurrences of

```yaml
        with: { node-version: 22 }
```

to

```yaml
        with: { node-version: 24 } # 22.18+ needed to run scripts/gen-llms.mts (built-in TypeScript support)
```

In the `cloudflare` job, change

```yaml
        run: npx ng build --base-href /
```

to

```yaml
        run: npm run gen:llms && npx ng build --base-href /
```

In the `github-pages` job, change

```yaml
        run: npx ng build --base-href /${{ github.event.repository.name }}/
```

to

```yaml
        run: npm run gen:llms && npx ng build --base-href /${{ github.event.repository.name }}/
```

- [ ] **Step 3: Verify**

Run: `grep -n "node-version\|ng build" .github/workflows/pages.yml`
Expected: two `node-version: 24` lines and two `npm run gen:llms && npx ng build` lines.

Run: `npm run build && cat dist/portfolio/browser/robots.txt`
Expected: the new robots.txt content.

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt .github/workflows/pages.yml
git commit -m "chore(seo): name AI crawlers in robots.txt, generate llms.txt in CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## After merge (manual, site owner)

1. Cloudflare dashboard → jomerjorge.com → Security → Bots: turn off **Bot Fight Mode** and **Block AI bots**; check Security Level is not "I'm Under Attack". Without this, crawlers still get the challenge page.
2. Verify: `curl -s -o /dev/null -w "%{http_code}\n" -A "GPTBot/1.1" https://jomerjorge.com/llms.txt` returns `200`.
3. Google Rich Results Test on https://jomerjorge.com/: Person, ProfilePage and ProfessionalService detected with no errors.
