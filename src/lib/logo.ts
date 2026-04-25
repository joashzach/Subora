import { BRANDED_SERVICES } from './constants';

/**
 * Resolves a logo image URL for a subscription.
 * Priority: stored logo_url → Google Favicon API via brand website → null
 */
export function getLogoUrl(
  name: string,
  logoUrl?: string,
  website?: string
): string | null {
  // 1. If we have a custom stored logo, use it
  if (logoUrl) return logoUrl;

  // 2. Use the branded service website to get a favicon
  const brandedWebsite = BRANDED_SERVICES[name]?.website || website;
  if (brandedWebsite) {
    try {
      const domain = new URL(brandedWebsite).hostname;
      // Use Google's favicon service for clean, high-quality logos
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch {
      // URL parse failed — fall through
    }
  }

  return null;
}

/**
 * Returns the first letter(s) of a service name for use as a fallback avatar.
 */
export function getServiceInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
