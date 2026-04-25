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

  // 2. Use the branded service website or provided website
  const brandedWebsite = BRANDED_SERVICES[name]?.website || website;

  // 3. If no website known, try to guess the domain from the service name
  const resolvedDomain = (() => {
    if (brandedWebsite) {
      try { return new URL(brandedWebsite).hostname; } catch { /* fall through */ }
    }
    // Guess: "YouTube Premium" → "youtube.com", "Apple Music" → "apple.com"
    const slug = name
      .toLowerCase()
      .replace(/\s+(premium|plus|pro|one|go|basic|standard|ultimate|max|lite)$/i, '') // strip plan tiers
      .replace(/[^a-z0-9\s]/g, '')  // strip special chars
      .split(/\s+/)[0];             // take first word
    if (slug && slug.length > 1) return `${slug}.com`;
    return null;
  })();

  if (!resolvedDomain) return null;

  // ─── EXTERNAL LOGO API SPACE ──────────────────────────────────────────
  // If you have an API key for a service like Brandfetch, Logo.dev, or Clearbit,
  // you can implement it here. Replace the return statement with your API URL.
  const apiKey = process.env.NEXT_PUBLIC_LOGO_API_KEY;
  if (apiKey) {
    // Example for Brandfetch: return `https://asset.brandfetch.io/${resolvedDomain}?token=${apiKey}`;
    // Example for Logo.dev: return `https://img.logo.dev/${resolvedDomain}?token=${apiKey}`;

    // Uncomment and modify the line below to use your specific API:
    // return `YOUR_API_ENDPOINT_HERE/${resolvedDomain}?key=${apiKey}`;
  }
  // ──────────────────────────────────────────────────────────────────────

  // Default fallback: Google's high-quality favicon service
  return `https://www.google.com/s2/favicons?sz=128&domain=${resolvedDomain}`;
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
