/**
 * When a lead cannot be stored server-side (API down, rate-limited, offline), the
 * visitor must still have a one-tap way to reach Omid — a WhatsApp link with the
 * form contents pre-filled, so nothing they typed is lost.
 */
export const whatsappFallbackUrl = (
  personal: { whatsappUrl?: string; phone?: string } | null | undefined,
  lines: Array<[label: string, value: string | undefined | null]>,
): string => {
  const base = (personal?.whatsappUrl || '').trim() || (personal?.phone ? `https://wa.me/${toIntlIranPhone(personal.phone)}` : 'https://wa.me/');
  const text = lines
    .filter(([, v]) => !!(v && String(v).trim()))
    .map(([k, v]) => `${k}: ${String(v).trim()}`)
    .join('\n');
  const sep = base.includes('?') ? '&' : '?';
  return text ? `${base}${sep}text=${encodeURIComponent(text)}` : base;
};

/** "۰۹۱۲…"/"0912…" → "98912…" (wa.me wants the international form without "+"). */
export const toIntlIranPhone = (raw: string): string => {
  const digits = String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
  if (digits.startsWith('0098')) return digits.slice(2);
  if (digits.startsWith('98')) return digits;
  if (digits.startsWith('0')) return `98${digits.slice(1)}`;
  return digits;
};
