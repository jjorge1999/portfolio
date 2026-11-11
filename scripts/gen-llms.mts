// Writes public/llms.txt from src/app/portfolio.data.ts, so AI tools read the same facts as the page.
// Runs before every build (see package.json). Node strips the TypeScript types itself, so no build step is needed.
import { writeFileSync } from 'node:fs';
import * as data from '../src/app/portfolio.data.ts';
import { buildLlmsTxt } from '../src/app/seo.ts';

writeFileSync(new URL('../public/llms.txt', import.meta.url), buildLlmsTxt(data));
console.log('Wrote public/llms.txt');
