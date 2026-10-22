import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AUDIENCES,
  AudienceId,
  APPS,
  CLIENTS,
  FILTERS,
  IMPACTS,
  Impact,
  KIND_LABELS,
  Kind,
  NEEDS,
  PROFILE,
  SERVICES,
  SKILLS,
  STATS,
  TIMELINES,
} from './portfolio.data';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-root',
  imports: [NgTemplateOutlet, ReactiveFormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class App {
  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly profile = PROFILE;
  readonly stats = STATS;
  readonly filters = FILTERS;
  readonly clients = CLIENTS;
  readonly apps = APPS.map((a) => ({ ...a, host: a.url.replace('https://', '') }));
  readonly skills = SKILLS;
  readonly needs = NEEDS;
  readonly timelines = TIMELINES;
  readonly audiences = AUDIENCES;
  readonly kindLabels = KIND_LABELS;
  readonly year = new Date().getFullYear();

  // --- audience view ---------------------------------------------------------
  readonly audienceId = signal<AudienceId>('business');
  readonly audience = computed(() => AUDIENCES.find((a) => a.id === this.audienceId())!);
  readonly services = computed(() => {
    const id = this.audienceId();
    return id === 'recruiter' ? null : SERVICES[id];
  });
  readonly sections = computed(() => [
    { id: 'case-study', label: 'Case study' },
    { id: 'work', label: 'Track record' },
    { id: 'apps', label: 'Apps' },
    ...(this.services() ? [{ id: 'services', label: 'Services' }] : []),
    { id: 'stack', label: this.audienceId() === 'recruiter' ? 'Skills' : 'Stack' },
    { id: 'contact', label: 'Contact' },
  ]);
  private static readonly DEFAULT_NEED: Record<AudienceId, string> = {
    business: 'Website',
    global: 'Remote engineering work',
    recruiter: 'A full-time or contract role',
  };

  setAudience(id: AudienceId, save = true) {
    if (!AUDIENCES.some((a) => a.id === id)) return;
    this.audienceId.set(id);
    this.clearFilters();
    const need = this.form.controls.need;
    if (Object.values(App.DEFAULT_NEED).includes(need.value) || need.value === 'Call request') {
      need.setValue(App.DEFAULT_NEED[id]);
    }
    if (save) {
      try {
        localStorage.setItem('jj-view', id);
      } catch {}
      try {
        history.replaceState(null, '', '#' + id);
      } catch {}
    }
    setTimeout(() => this.observeSections());
  }

  onPrimary(e: Event, forceForm = false) {
    if (!forceForm && this.primaryHref() !== '#contact') return;
    e.preventDefault();
    this.primaryAction(forceForm);
  }

  primaryAction(forceForm = false) {
    const a = forceForm && this.audience().cta.action === 'cv' ? 'quote' : this.audience().cta.action;
    if (a === 'cv') return; // handled by the link itself
    if (a === 'call' && this.profile.bookingUrl && !forceForm) return;
    this.form.controls.need.setValue(a === 'call' ? 'Call request' : App.DEFAULT_NEED[this.audienceId()]);
    document.getElementById('contact')?.scrollIntoView({ behavior: this.motion() });
    setTimeout(() => document.getElementById('f-name')?.focus({ preventScroll: true }), 500);
  }

  readonly primaryHref = computed(() => {
    const a = this.audience().cta.action;
    if (a === 'cv') return this.profile.cv;
    if (a === 'call' && this.profile.bookingUrl) return this.profile.bookingUrl;
    return '#contact';
  });
  readonly primaryTarget = computed(() => (this.primaryHref() === '#contact' ? null : '_blank'));

  // --- gallery viewer ----------------------------------------------------------
  readonly viewer = signal<{ items: Impact['gallery']; index: number } | null>(null);
  openViewer(items: Impact['gallery'], index: number) {
    this.viewer.set({ items, index });
    setTimeout(() => (document.querySelector('.viewer') as HTMLElement | null)?.focus());
  }
  stepViewer(d: number) {
    const v = this.viewer();
    if (!v?.items) return;
    this.viewer.set({ items: v.items, index: (v.index + d + v.items.length) % v.items.length });
  }
  closeViewer() {
    this.viewer.set(null);
  }
  onKey(e: KeyboardEvent) {
    if (!this.viewer()) return;
    if (e.key === 'Escape') this.closeViewer();
    if (e.key === 'ArrowRight') this.stepViewer(1);
    if (e.key === 'ArrowLeft') this.stepViewer(-1);
  }

  // --- work: featured case study + filterable track record ---------------------
  readonly kind = signal<'all' | Kind>('all');
  readonly tech = signal<string | null>(null);
  private readonly ordered = computed(() => {
    const order = this.audience().order;
    const rank = (i: Impact) => {
      const r = order.indexOf(i.org);
      return r === -1 ? order.length + IMPACTS.indexOf(i) : r;
    };
    return [...IMPACTS].sort((a, b) => rank(a) - rank(b));
  });
  /** The first project for the current view gets the full case-study panel. */
  readonly featured = computed(() => this.ordered()[0]);
  readonly filtering = computed(() => this.kind() !== 'all' || !!this.tech());
  readonly impacts = computed(() =>
    this.ordered().filter(
      (i) =>
        // The featured project is already shown in full above, unless a filter is narrowing the list.
        (this.filtering() || i !== this.featured()) &&
        (this.kind() === 'all' || i.kind === this.kind()) &&
        (!this.tech() || i.tags.some((t) => t.toLowerCase().includes(this.tech()!.toLowerCase()))),
    ),
  );
  readonly usedTags = new Set(IMPACTS.flatMap((i) => i.tags.map((t) => t.toLowerCase())));

  hasWork(skill: string) {
    const s = skill.toLowerCase();
    return [...this.usedTags].some((t) => t.includes(s));
  }

  pickTech(skill: string) {
    this.tech.set(this.tech() === skill ? null : skill);
    this.kind.set('all');
    if (this.tech()) document.getElementById('work')?.scrollIntoView({ behavior: this.motion() });
  }

  clearFilters() {
    this.kind.set('all');
    this.tech.set(null);
  }

  // --- profile card: 3D tilt + fun facts ---------------------------------------
  readonly rx = signal(0);
  readonly ry = signal(0);
  readonly mx = signal(50);
  readonly my = signal(40);
  readonly tilting = signal(false);

  private tiltRaf = 0;
  private reducedMotion?: MediaQueryList;

  /** Pointer moves are coalesced to one update per frame, and nothing runs for touch or reduced motion. */
  onTilt(e: PointerEvent) {
    this.reducedMotion ??= matchMedia('(prefers-reduced-motion: reduce)');
    if (e.pointerType === 'touch' || this.reducedMotion.matches) return;
    const el = e.currentTarget as HTMLElement;
    const { clientX, clientY } = e;
    if (this.tiltRaf) return;
    this.tiltRaf = requestAnimationFrame(() => {
      this.tiltRaf = 0;
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      this.tilting.set(true);
      this.ry.set((px - 0.5) * 14);
      this.rx.set((0.5 - py) * 10);
      this.mx.set(px * 100);
      this.my.set(py * 100);
    });
  }

  resetTilt() {
    cancelAnimationFrame(this.tiltRaf);
    this.tiltRaf = 0;
    this.tilting.set(false);
    this.rx.set(0);
    this.ry.set(0);
    this.mx.set(50);
    this.my.set(40);
  }

  readonly facts = [
    "Hi, I'm Jomz. I turn messy business problems into working software.",
    '8 years shipping production code, since 2018.',
    'Angular is home turf: enterprise ERP, US SaaS and my own products.',
    'I started as a graphic designer, so I care how things look.',
    'Based in Calamba, Laguna, and happy to meet in BGC, Taguig.',
    'I build for carinderias, resorts and clinics, not just big companies.',
  ];
  readonly factIndex = signal(0);
  readonly factShown = signal(false);
  readonly fact = computed(() => this.facts[this.factIndex()]);
  private factTimer?: ReturnType<typeof setTimeout>;

  /** First tap shows the current fact; later taps step through them. The bubble hides itself so the photo stays clear. */
  nextFact() {
    if (this.factShown()) this.factIndex.set((this.factIndex() + 1) % this.facts.length);
    this.factShown.set(true);
    clearTimeout(this.factTimer);
    this.factTimer = setTimeout(() => this.factShown.set(false), 6000);
  }

  // --- live clock ------------------------------------------------------------
  // Formatters are built once and reused on every tick.
  private static readonly TIME_FMT = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
  private static readonly HOUR_FMT = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Manila' });
  private now = signal(new Date());
  readonly localTime = computed(() => App.TIME_FMT.format(this.now()));
  readonly isWorkingHours = computed(() => {
    const h = Number(App.HOUR_FMT.format(this.now()));
    return h >= 8 && h < 20;
  });

  // --- theme + scroll depth + scroll spy ----------------------------------------
  readonly theme = signal<Theme>('dark');
  readonly active = signal('case-study');

  constructor() {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    const destroy = inject(DestroyRef);

    afterNextRender(() => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('jj-theme');
      } catch {}
      const sys: Theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      this.applyTheme((saved as Theme) || sys, false);

      const tick = setInterval(() => this.now.set(new Date()), 30_000);

      // Parallax: browsers with CSS scroll timelines animate it in CSS (see .depth in app.scss), so no listener at all.
      // Otherwise write the scroll position to --sy once per frame, on the parallax layer only (not :root),
      // so a scroll restyles those few shapes and not the whole page.
      const depth = document.querySelector<HTMLElement>('.depth');
      if (depth && !CSS.supports('animation-timeline: scroll()')) {
        let raf = 0;
        const onScroll = () => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            depth.style.setProperty('--sy', String(Math.round(window.scrollY)));
          });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        destroy.onDestroy(() => {
          window.removeEventListener('scroll', onScroll);
          cancelAnimationFrame(raf);
        });
      }

      this.io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && this.active.set(e.target.id)),
        { rootMargin: '-45% 0px -50% 0px' },
      );

      // Starting view: link hash (#business, #global, #recruiter), then last visit, then business.
      const fromHash = location.hash.replace('#', '') as AudienceId;
      let savedView: string | null = null;
      try {
        savedView = localStorage.getItem('jj-view');
      } catch {}
      const start = AUDIENCES.some((a) => a.id === fromHash) ? fromHash : (savedView as AudienceId);
      if (start && AUDIENCES.some((a) => a.id === start)) this.setAudience(start, false);
      this.observeSections();

      destroy.onDestroy(() => {
        clearInterval(tick);
        clearTimeout(this.factTimer);
        cancelAnimationFrame(this.tiltRaf);
        this.io?.disconnect();
        this.io = undefined;
      });
    });
  }

  private io?: IntersectionObserver;
  private observeSections() {
    if (!this.io) return;
    this.io.disconnect();
    this.sections().forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) this.io!.observe(el);
    });
  }

  toggleTheme() {
    this.applyTheme(this.theme() === 'dark' ? 'light' : 'dark', true);
  }

  private applyTheme(t: Theme, save: boolean) {
    this.theme.set(t);
    document.documentElement.setAttribute('data-theme', t);
    if (save) {
      try {
        localStorage.setItem('jj-theme', t);
      } catch {}
    }
  }

  private motion(): ScrollBehavior {
    this.reducedMotion ??= matchMedia('(prefers-reduced-motion: reduce)');
    return this.reducedMotion.matches ? 'auto' : 'smooth';
  }

  // --- inquiry form ------------------------------------------------------------
  readonly form = this.fb.nonNullable.group({
    name: '',
    business: '',
    need: 'Website',
    timeline: 'Within 1–3 months',
    message: '',
  });
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly draft = computed(() => {
    const v = { ...this.form.getRawValue(), ...this.formValue() };
    const lines = [
      `Hi Jomz,`,
      ``,
      `I'm ${v.name || '[your name]'}${v.business ? ` from ${v.business}` : ''}. ${this.audience().inquiryOpener}: ${v.need}.`,
      `Timeline: ${v.timeline}`,
      ``,
      v.message ||
        (this.audienceId() === 'recruiter'
          ? '[The role, team and what you are looking for]'
          : '[What you need and what is slowing your business down]'),
      ``,
      `Thanks!`,
    ];
    return lines.join('\n');
  });
  readonly subject = computed(
    () => `${this.audienceId() === 'recruiter' ? 'Opportunity' : 'Project inquiry'}: ${this.formValue().need ?? 'Website'}`,
  );
  readonly mailto = computed(
    () =>
      `mailto:${this.profile.email}?subject=${encodeURIComponent(this.subject())}&body=${encodeURIComponent(this.draft())}`,
  );
  readonly whatsapp = computed(() => `https://wa.me/${this.profile.mobileIntl}?text=${encodeURIComponent(this.draft())}`);

  copy(value: string, label: string) {
    const ok = this.clipboard.copy(value);
    this.snack.open(ok ? `${label} copied` : `Couldn't copy. Select the text instead.`, 'OK', { duration: 2200 });
  }
}
