import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../src/app/portfolio.data.ts';
import { buildJsonLd, buildLlmsTxt } from '../src/app/seo.ts';

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

test('Person description is third person and matches the profile summary', () => {
  const person = node('person');
  assert.equal(person.description, data.PROFILE.summary);
  assert.ok(!person.description.startsWith("I'm"));
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

test('service has the city-level address and no phone or price range', () => {
  const service = node('service');
  assert.equal(service.address.addressLocality, data.PROFILE.address.locality);
  assert.ok(!('telephone' in service));
  assert.ok(!('priceRange' in service));
});

test('JSON-LD never contains the mobile number', () => {
  const json = JSON.stringify(buildJsonLd(data));
  for (const s of PRIVATE) assert.ok(!json.includes(s), `leaked ${s}`);
});
