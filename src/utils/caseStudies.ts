import type { CaseStudy, MetricComparison } from '../types';

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

/**
 * CMS content can outlive the current TypeScript shape (or be partially edited).
 * Normalize it at the page boundary so one missing nested field never crashes
 * the portfolio grid or its detail modal.
 */
export function normalizeCaseStudies(value: unknown): CaseStudy[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item) => item && typeof item === 'object').map((raw: any, index) => {
    const metrics = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {};
    const comparison: MetricComparison[] = Array.isArray(raw.metricsComparison)
      ? raw.metricsComparison
          .filter((metric: any) => metric && typeof metric === 'object')
          .map((metric: any) => ({
            label: text(metric.label, 'شاخص'),
            before: text(metric.before, '—'),
            after: text(metric.after, '—'),
            growth: text(metric.growth, '—'),
          }))
      : [];

    return {
      ...raw,
      id: text(raw.id, `case-study-${index + 1}`),
      title: text(raw.title, 'نمونه‌کار'),
      client: text(raw.client, '—'),
      industryFa: text(raw.industryFa, 'سایر'),
      summary: text(raw.summary),
      thumbnailIcon: text(raw.thumbnailIcon, 'briefcase'),
      heroColor: text(raw.heroColor, '#6366f1'),
      featured: Boolean(raw.featured),
      metrics: {
        roas: text(metrics.roas, '—'),
        conversionRate: text(metrics.conversionRate, '—'),
        cacReduction: text(metrics.cacReduction, '—'),
      },
      metricsComparison: comparison,
      challenge: text(raw.challenge, 'اطلاعات این بخش هنوز ثبت نشده است.'),
      solution: text(raw.solution, 'اطلاعات این بخش هنوز ثبت نشده است.'),
      results: text(raw.results, 'اطلاعات این بخش هنوز ثبت نشده است.'),
      tags: Array.isArray(raw.tags) ? raw.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
      date: text(raw.date),
      liveUrl: text(raw.liveUrl).trim() || undefined,
    } as CaseStudy;
  });
}

/** Only allow external web URLs in embedded previews and links. */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
