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
