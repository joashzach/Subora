'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div style={{
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      textAlign: 'center',
      padding: 20
    }}>
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Something went wrong!</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
        {error.message || 'An unexpected error occurred while loading the dashboard.'}
      </p>
      <button
        className="btn btn-primary"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
