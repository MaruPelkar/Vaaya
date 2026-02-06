'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/db';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex gradient-primary relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(77, 168, 168, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(61, 148, 148, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative z-10">
        <div className="max-w-lg">
          <h1 className="headline-display text-white mb-6">
            Company Intelligence<br />
            <span style={{ fontStyle: 'italic' }}>Reimagined.</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Research any B2B company in seconds. Get deep insights on product, pricing, positioning, and competitive landscape.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            {[
              'Real-time competitive analysis',
              'Product & pricing intelligence',
              'Market positioning insights',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div
          className="w-full max-w-md p-10 rounded-2xl"
          style={{
            backgroundColor: 'var(--white)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{
                background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h1 className="font-display text-3xl font-medium mb-2" style={{ color: 'var(--gray-900)' }}>
              Welcome back
            </h1>
            <p className="text-base" style={{ color: 'var(--gray-500)' }}>
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg text-sm flex items-center gap-3"
              style={{
                backgroundColor: 'var(--error-bg)',
                color: 'var(--error)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200"
            style={{
              backgroundColor: loading ? 'var(--gray-100)' : 'var(--white)',
              border: '2px solid var(--gray-200)',
              color: 'var(--gray-800)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 107, 107, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-200)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gray-200)' }}></div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--gray-400)' }}>
              Secure login
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--gray-200)' }}></div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--gray-500)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--gray-500)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>SOC 2 Compliant</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs" style={{ color: 'var(--gray-500)' }}>
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:no-underline" style={{ color: 'var(--primary)' }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:no-underline" style={{ color: 'var(--primary)' }}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Mobile branding (shown on small screens) */}
      <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
        <h2 className="font-display text-2xl text-white">Company Intelligence</h2>
      </div>
    </main>
  );
}
