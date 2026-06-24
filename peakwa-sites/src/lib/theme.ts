import type { GeneratedSite, SiteTheme } from './types';

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 31, g: 41, b: 55 };
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function getTextColor(bgHex: string): string {
  return isLightColor(bgHex) ? '#111827' : '#FFFFFF';
}

export function darkenHex(hex: string, amount = 0.15): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - amount;
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n * factor)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function resolveTheme(site: GeneratedSite): SiteTheme {
  const theme = site.theme ?? {
    primaryColor: site.primaryColor,
    secondaryColor: site.secondaryColor,
    accentColor: site.accentColor,
    heroStyle: site.heroStyle as SiteTheme['heroStyle'],
    fontStyle: site.fontStyle as SiteTheme['fontStyle'],
  };

  return {
    primaryColor: theme.primaryColor || '#1F2937',
    secondaryColor: theme.secondaryColor || '#F3F4F6',
    accentColor: theme.accentColor || '#6366F1',
    heroStyle: theme.heroStyle === 'light' ? 'light' : 'dark',
    fontStyle: theme.fontStyle || 'modern',
  };
}

export function themeCssVars(theme: SiteTheme): Record<string, string> {
  return {
    ['--color-primary' as string]: theme.primaryColor,
    ['--color-secondary' as string]: theme.secondaryColor,
    ['--color-accent' as string]: theme.accentColor,
    ['--color-primary-dark' as string]: darkenHex(theme.primaryColor),
  };
}
