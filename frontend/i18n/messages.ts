// Add new JSON files to i18n/locales (e.g., fr.json).
export type Messages = Record<string, string>;
export type Locale = string;
export const defaultLocale: Locale = 'en';

const staticLocales = ['en', 'pt'] as const;
export const availableLocales: Locale[] = [...staticLocales];

const loadEn = () => import('./locales/en.json').then(m => m.default as Messages);
const loaders: Record<string, () => Promise<Messages>> = {
  en: loadEn,
  pt: () => import('./locales/pt.json').then(m => m.default as Messages),
};

async function loadLocale(locale: string): Promise<Messages> {
  const norm = locale.toLowerCase();
  try {
    if (loaders[norm]) return await loaders[norm]();
    // attempt generic (e.g. en-GB -> en)
    const base = norm.split('-')[0];
    if (base && loaders[base]) return await loaders[base]();
    return await loadEn();
  } catch {
    return await loadEn();
  }
}

const cache: Record<string, Messages> = {};

export async function getMessages(locale: string): Promise<Messages> {
  const norm = normalizeLocale(locale);
  if (cache[norm]) return cache[norm];
  cache[norm] = await loadLocale(norm);
  return cache[norm];
}

export function normalizeLocale(input: string): string {
  if (!input) return defaultLocale;
  const lower = input.toLowerCase();
  if (availableLocales.includes(lower)) return lower;
  const pref = lower.split('-')[0];
  if (availableLocales.includes(pref)) return pref;
  return defaultLocale;
}

export async function tAsync(lang: string, key: string, vars?: Record<string,string|number>): Promise<string> {
  const dict = await getMessages(lang);
  let str = dict?.[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
  }

  return str;
}
