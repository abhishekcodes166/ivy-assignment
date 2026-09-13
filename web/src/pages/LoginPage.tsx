import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, apiConfigured } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'That does not look like a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function LoginPage() {
  const { isAuthenticated, expired, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/buy';

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        // 401 here is a wrong password, not an expired session - say so plainly.
        setFormError(
          error.status === 401
            ? 'That email and password combination was not recognised.'
            : error.message,
        );
      } else {
        setFormError('Sign in failed unexpectedly. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 22%, rgba(255,255,255,.3), transparent 42%), radial-gradient(circle at 78% 72%, rgba(255,255,255,.22), transparent 46%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4.5">
              <path d="M12 20c0-5 3-8 7-9-1 5-3 8-7 9Zm0 0c0-5-3-8-7-9 1 5 3 8 7 9Zm0 0v-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight">Ivy Homes</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight">
            Property discovery, measured against the data.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-brand-100">
            Every price, filter and statistic here is computed from the live Ivy Homes API — including the parts of it
            that do not behave the way the documentation claims.
          </p>
        </div>

        <dl className="relative grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
          {[
            ['3,800', 'Sale listings'],
            ['1,450', 'Rentals'],
            ['440', 'Projects'],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="tnum text-2xl font-semibold">{value}</dt>
              <dd className="mt-0.5 text-xs text-brand-200">{label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-center justify-center bg-sand-50 px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-sand-900">Sign in</h2>
          <p className="mt-1.5 text-sm text-sand-500">Use your Ivy Homes demo account to continue.</p>

          {!apiConfigured && (
            <div role="alert" className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              No API key is configured. Copy <code className="font-mono text-xs">.env.example</code> to{' '}
              <code className="font-mono text-xs">.env.local</code> and set{' '}
              <code className="font-mono text-xs">VITE_API_KEY</code> before signing in.
            </div>
          )}

          {expired && (
            <div role="status" className="mt-5 rounded-lg border border-sand-300 bg-white p-3 text-sm text-sand-700">
              Your session expired and could not be renewed. Please sign in again.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@ivy.homes"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              disabled={submitting}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              disabled={submitting}
            />

            {formError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-sand-400">
            Credentials are sent to the Ivy Homes API and never stored in this repository. Your session token is kept in
            this browser only.
          </p>
        </div>
      </div>
    </div>
  );
}
