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
