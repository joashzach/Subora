'use client';

import { useState } from 'react';
import { getLogoUrl, getServiceInitials } from '@/lib/logo';

interface SubscriptionLogoProps {
  name: string;
  logoUrl?: string;
  website?: string;
  color: string;
  size?: number;
  radius?: number;
  fontSize?: string;
}

/**
 * Renders a subscription logo using:
 * 1. Stored logo_url (Supabase Storage)
 * 2. Google Favicon API (via brand website)
 * 3. Initials fallback
 */
export default function SubscriptionLogo({
  name,
  logoUrl,
  website,
  color,
  size = 44,
  radius = 10,
  fontSize,
}: SubscriptionLogoProps) {
  const resolvedUrl = getLogoUrl(name, logoUrl, website);
  const [imgError, setImgError] = useState(false);
  const initials = getServiceInitials(name);
  const textSize = fontSize ?? `${Math.max(10, Math.round(size * 0.33))}px`;

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    background: `${color}1a`,
    border: `1px solid ${color}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  };

  if (resolvedUrl && !imgError) {
    return (
      <div style={containerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={`${name} logo`}
          width={size * 0.6}
          height={size * 0.6}
          style={{ objectFit: 'contain', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Initials fallback
  return (
    <div style={containerStyle}>
      <span
        style={{
          fontSize: textSize,
          fontWeight: 700,
          color,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  );
}
