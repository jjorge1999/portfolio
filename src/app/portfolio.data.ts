export type Kind = 'emp' | 'free' | 'prod';

export interface ImpactLink {
  label: string;
  url: string;
}

export interface Impact {
  kind: Kind;
  icon: string;
  org: string;
  role: string;
  when: string;
  headline: string;
  challenge: string;
  built: string;
  builtLabel?: string;
  result: string;
  resultLabel?: string;
  resultIcon?: string;
  tags: string[];
  links?: ImpactLink[];
  /** One real, sourced result number shown above the impact text. Leave empty rather than guess. */
  metric?: string;
  gallery?: { src: string; alt: string }[];
  /** Three short facts for the case-study panel. Only restate what the text above already says. */
  highlights?: Highlight[];
}

export interface Highlight {
  k: string;
  v: string;
  note: string;
}

export type AudienceId = 'business' | 'global' | 'recruiter';

export interface Audience {
  id: AudienceId;
  label: string;
  short: string;
  icon: string;
  headline: string;
  headlineMuted: string;
  intro: string;
  /** Impact rows listed first, by org name, in this order. */
  order: string[];
  cta: { label: string; icon: string; action: 'quote' | 'call' | 'cv' };
  chat?: { label: string; url: string; icon: string };
  inquiryOpener: string;
  /** Small label above the featured case study (the first org in `order`). */
  caseLabel: string;
}

export const PROFILE = {
  name: 'Jomer Jorge',
  nickname: 'Jomz',
  initials: 'JJ',
  title: 'Full-stack software engineer',
  headline: 'Full-stack engineer who ships systems that change how a business runs.',
  intro:
    "I'm Jomer “Jomz” Jorge. I've spent eight years building software for enterprise ERP, US real-estate SaaS and Philippine small businesses. I start from the business problem, write the code, deploy it, and stay to support it.",
  linkedin: 'https://www.linkedin.com/in/jomer-trillo-jorge-765597128/',
  email: 'jomer_jorge@yahoo.com',
  mobile: '0919 584 3463',
  mobileIntl: '639195843463',
  viber: '0919 584 3463',
  /** Paste a Calendly or Google Calendar booking link here to make "Book a call" open it. */
  bookingUrl: '',
  cv: 'Jomer-Jorge-CV.pdf',
  location: 'Calamba, Laguna · BGC, Taguig',
  education: 'BS Information Technology, STI College Calamba',
};

export const AUDIENCES: Audience[] = [
  {
    id: 'business',
    label: 'Business owner',
    short: 'Business',
    icon: 'storefront',
    headline: 'Software that runs your business,',
    headlineMuted: 'built for Philippine small businesses.',
    intro:
      "I'm Jomer “Jomz” Jorge. I build websites, booking systems, inventory tools and AI add-ons for carinderias, resorts, clinics and shops. You tell me what slows you down, I build the fix, and I stay to support it.",
    order: ["Thamara's Lechon & Carinderia", 'SwiftStay', 'Benepisyo'],
    cta: { label: 'Get a quote', icon: 'request_quote', action: 'quote' },
    chat: { label: 'Chat on Viber', url: 'viber://chat?number=%2B639195843463', icon: 'chat' },
    inquiryOpener: "I run a business and I'm looking for help with",
    caseLabel: 'Philippine small business',
  },
  {
    id: 'global',
    label: 'Global client',
    short: 'Global',
    icon: 'public',
    headline: 'A full-stack engineer for your product,',
    headlineMuted: 'working remotely from Manila (UTC+8).',
    intro:
      "I'm Jomer “Jomz” Jorge. Eight years shipping production software, including enterprise ERP at Infor and SaaS for US real-estate brokers. I work in Angular, Node and NestJS, and I overlap with Asia-Pacific, Australian and US evening hours.",
    order: ['SwiftStay', 'Placester Inc.', 'Infor PSSC'],
    cta: { label: 'Book a call', icon: 'event', action: 'call' },
    chat: { label: 'WhatsApp', url: 'https://wa.me/639195843463', icon: 'chat' },
    inquiryOpener: "I'm looking for a remote engineer to help with",
    caseLabel: 'Product I built and run',
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    short: 'Recruiter',
    icon: 'badge',
    headline: 'Angular & Node engineer,',
    headlineMuted: 'eight years in production.',
    intro:
      "I'm Jomer “Jomz” Jorge, a software engineer at Infor building cloud ERP in Angular. Before that I built microservices in NestJS and Java for Placester, a US real-estate SaaS. BS Information Technology, STI College Calamba.",
    order: ['Infor PSSC', 'Placester Inc.', 'Microbitworx Solution'],
    cta: { label: 'Download CV', icon: 'download', action: 'cv' },
    inquiryOpener: "I'm hiring and I'd like to talk to you about",
    caseLabel: 'Current role',
  },
];

export const SERVICES: Record<'business' | 'global', { icon: string; title: string; text: string }[]> = {
  business: [
    { icon: 'language', title: 'Business website', text: 'A fast, mobile-first site your customers can find on Google and Facebook.' },
    { icon: 'event_available', title: 'Booking & reservations', text: 'Online bookings with GCash or Maya deposits and a simple owner dashboard.' },
    { icon: 'inventory_2', title: 'Inventory & POS', text: 'Track stock and daily sales for your store, carinderia or canteen.' },
    { icon: 'smart_toy', title: 'AI assistant', text: 'Auto-replies and a chat helper that answers customers in Tagalog, Bisaya or English.' },
    { icon: 'bolt', title: 'Automation & reports', text: 'Turn spreadsheets into reports and schedule your Facebook posts automatically.' },
  ],
  global: [
    { icon: 'deployed_code', title: 'Product engineering', text: 'Angular front ends and Node/NestJS services, from first commit to production.' },
    { icon: 'hub', title: 'APIs & integrations', text: 'GraphQL and REST APIs, billing (Zuora), payments and third-party integrations.' },
    { icon: 'cloud', title: 'Cloud & serverless', text: 'Cloudflare Workers and D1, AWS serverless and EC2, with CI/CD.' },
    { icon: 'smart_toy', title: 'AI features', text: 'LLM-powered assistants and automations built on the Claude API, with usage caps.' },
  ],
};

export const STATS = [
  { value: '8 yrs', label: 'Production code', note: 'Writing production software since 2018' },
  { value: '3', label: 'Software companies', note: 'Infor, Placester (US) and Microbitworx' },
  { value: '2', label: 'Products founded', note: 'SwiftStay and Benepisyo, built myself' },
  { value: '4', label: 'Client brands', note: 'Including Fujifilm and Alpha Laboratory Calamba' },
];

export const KIND_LABELS: Record<Kind, string> = {
  emp: 'Employment',
  free: 'Client work',
  prod: 'My product',
};

export const FILTERS: { id: 'all' | Kind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'emp', label: 'Employment' },
  { id: 'free', label: 'Freelance & clients' },
  { id: 'prod', label: 'My products' },
];

export const IMPACTS: Impact[] = [
  {
    kind: 'emp',
    icon: 'corporate_fare',
    org: 'Infor PSSC',
    role: 'Software Engineer · Cloud ERP',
    when: '2022 – now',
    headline: 'Keeps a global, multi-tenant ERP reliable for enterprise customers',
    challenge: 'Every release reaches many customers at once, so a regression hits everyone.',
    built: 'Angular features with automated tests, plus validation and verification before each release.',
    result:
      'Customers on released versions stay supported, and I ship alongside analysts and architects across time zones.',
    tags: ['Angular', 'TypeScript', 'Automated tests', 'GitLab'],
    links: [{ label: 'infor.com', url: 'https://www.infor.com' }],
    highlights: [
      { k: 'Product', v: 'Multi-tenant', note: 'Global cloud ERP for enterprise customers' },
      { k: 'Every release', v: 'Tested', note: 'Automated tests, validation and verification' },
      { k: 'Team', v: 'Across time zones', note: 'Shipping alongside analysts and architects' },
    ],
  },
  {
    kind: 'emp',
    icon: 'key',
    org: 'Placester Inc.',
    role: 'Software Engineer · US real-estate SaaS',
    when: '2020 – 2021',
    headline: 'Built the service that decides what every paying agent can use',
    challenge: 'Billing, feature access and client WordPress sites lived in separate systems.',
    built:
      'A NestJS entitlement service tied to Zuora subscriptions, and PHP bridges from WordPress to the core Java services.',
    result: 'A plan change in billing now changes what an agent or brokerage can use, without manual updates.',
    tags: ['NestJS', 'Zuora', 'Java / Spring Boot', 'WordPress API', 'AWS'],
    links: [{ label: 'placester.com', url: 'https://placester.com' }],
    highlights: [
      { k: 'Billing', v: 'Zuora', note: 'Subscriptions drive what each agent can use' },
      { k: 'Plan changes', v: 'Automatic', note: 'No manual updates to feature access' },
      { k: 'Market', v: 'US', note: 'Real-estate SaaS for agents and brokerages' },
    ],
  },
  {
    kind: 'emp',
    icon: 'precision_manufacturing',
    org: 'Microbitworx Solution',
    role: 'Full-stack Engineer · Laguna',
    when: '2018 – 2020',
    headline: 'Gave a manufacturer live visibility of work in progress',
    challenge: 'Local clients needed custom systems built, deployed and supported end to end.',
    built: 'A WIP tracking system, a service management system in CodeIgniter, and the Alpha Laboratory website.',
    result: 'Clients went live on their own servers, with staff trained by me and critical issues handled same day.',
    tags: ['PHP', 'CodeIgniter', 'C#', 'MySQL', 'WordPress'],
    highlights: [
      { k: 'Critical issues', v: 'Same day', note: 'Handled for every live client' },
      { k: 'Delivered', v: '3 systems', note: 'WIP tracking, service management, Alpha Laboratory site' },
      { k: 'Go-live', v: 'On-site', note: 'On client servers, with staff trained by me' },
    ],
  },
  {
    kind: 'free',
    icon: 'restaurant',
    org: "Thamara's Lechon & Carinderia",
    role: 'Client · Agusan del Sur',
    when: '2026',
    headline: 'Showed the owners where their profit really comes from',
    challenge: 'Lechon brought in the most sales, so it looked like the star of the business.',
    built:
      'A 30-day income and expense review in plain Filipino, plus Facebook ad management and automated daily posts.',
    result:
      'Carinderia and BBQ carry most of the profit. Casual Bisaya ad copy far outperformed generic English posts.',
    tags: ['Data analysis', 'Meta Ads', 'Buffer automation'],
    highlights: [
      { k: 'Reviewed', v: '30 days', note: 'Of income and expenses, explained in plain Filipino' },
      { k: 'Real profit driver', v: 'Carinderia + BBQ', note: 'Not lechon, the biggest seller' },
      { k: 'Best-performing ads', v: 'Casual Bisaya', note: 'Far outperformed generic English posts' },
    ],
  },
  {
    kind: 'prod',
    icon: 'cottage',
    org: 'SwiftStay',
    role: 'Founder · Rental marketplace',
    when: 'Live',
    headline: 'Lets transient-house owners take bookings with no credit card required',
    challenge: 'Most Filipino guests pay by e-wallet, and big platforms take a cut of every night.',
    built:
      'A booking platform with GCash, Maya, QRPh and GrabPay checkout, and iCal sync with Airbnb and Booking.com.',
    result: 'Owners keep 100% of their nightly rate and see fewer double-bookings across channels.',
    tags: ['Angular', 'Cloudflare', 'E-wallet payments', 'iCal'],
    links: [{ label: 'swiftstay.uk', url: 'https://swiftstay.uk' }],
    highlights: [
      { k: 'Owner keeps', v: '100%', note: 'Of the nightly rate, no platform cut' },
      { k: 'Checkout', v: 'E-wallets', note: 'GCash, Maya, QRPh and GrabPay, no credit card' },
      { k: 'Calendar sync', v: 'iCal', note: 'With Airbnb and Booking.com, fewer double-bookings' },
    ],
  },
  {
    kind: 'prod',
    icon: 'volunteer_activism',
    org: 'Benepisyo',
    role: 'Free civic app · Calamba pilot',
    when: 'In progress',
    headline: 'Helps everyday Filipinos find the government benefits they already qualify for',
    challenge: 'Seniors, PWDs and solo parents miss national and LGU benefits because the information is scattered.',
    builtLabel: "What I'm building",
    built:
      'A free, Tagalog-first web app covering all 1,642 cities and municipalities, with amounts, requirements and the source behind every benefit. Fully verified for Calamba first.',
    resultLabel: 'Goal',
    resultIcon: 'flag',
    result: "Anyone can see what they're entitled to in a few taps, at no cost.",
    tags: ['Angular', 'Ant Design', 'Cloudflare Workers', 'D1'],
    links: [{ label: 'jjorge1999.github.io/benepisyo', url: 'https://jjorge1999.github.io/benepisyo/' }],
    highlights: [
      { k: 'Coverage', v: '1,642', note: 'Cities and municipalities in the Philippines' },
      { k: 'Cost to users', v: 'Free', note: 'Tagalog-first, with the source behind every benefit' },
      { k: 'Pilot', v: 'Calamba', note: 'Fully verified first' },
    ],
  },
];

export const TIMELINES = ['As soon as possible', 'Within 1–3 months', 'Just exploring'];

export const NEEDS = [
  'Website',
  'Booking or reservation system',
  'Inventory or POS tool',
  'AI assistant or add-on',
  'Automation or reports',
  'Remote engineering work',
  'A full-time or contract role',
  'Call request',
  'Something else',
];

export const CLIENTS = [
  { initial: 'F', name: 'Fujifilm' },
  { initial: 'A', name: 'Alpha Laboratory Calamba' },
  { initial: '7', name: '7layer.tech' },
  { initial: 'G', name: 'The Grey Rental House Nasugbu' },
];

export const SKILLS = [
  { icon: 'web', title: 'Front end', items: ['Angular', 'TypeScript', 'JavaScript', 'HTML / CSS', 'jQuery', 'Ant Design'] },
  {
    icon: 'dns',
    title: 'Back end',
    items: ['Node.js', 'NestJS', 'GraphQL / Apollo', 'PHP / CodeIgniter', 'Java / Spring Boot', 'C# / .NET'],
  },
  { icon: 'cloud', title: 'Data & cloud', items: ['MySQL', 'Redis', 'Cloudflare Workers', 'D1', 'AWS', 'Datadog'] },
  { icon: 'verified', title: 'Practice', items: ['Git / Gitflow', 'Scrum', 'TDD · xUnit', 'CI/CD', 'Clean code', 'Graphic design'] },
];
