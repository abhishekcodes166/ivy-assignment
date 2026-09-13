import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSavedListings } from '@/hooks/useSaved';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

const NAV = [
  { to: '/buy', label: 'Buy' },
  { to: '/rent', label: 'Rent' },
  { to: '/projects', label: 'Projects' },
  { to: '/saved', label: 'Saved' },
  { to: '/insights', label: 'Insights' },
];

function Wordmark() {
  return (
    <Link to="/buy" className="flex items-center gap-2.5" aria-label="Ivy Homes home">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4.5">
          <path d="M12 20c0-5 3-8 7-9-1 5-3 8-7 9Zm0 0c0-5-3-8-7-9 1 5 3 8 7 9Zm0 0v-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-sand-900">Ivy Homes</span>
    </Link>
  );
}

function UserMenu() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const initial = session?.email?.[0]?.toUpperCase() ?? '?';

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
    setOpen(false);
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-sand-200/70"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm text-sand-700 sm:block">{session?.email}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5 text-sand-400">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-sand-200 bg-white p-1.5 shadow-lg"
          >
            <div className="px-2.5 py-2">
              <p className="text-xs text-sand-500">Signed in as</p>
              <p className="truncate text-sm font-medium text-sand-900">{session?.email}</p>
            </div>
            <div className="my-1 h-px bg-sand-200" />
            <button
              role="menuitem"
              onClick={handleSignOut}
              disabled={busy}
              className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-sand-700 transition-colors hover:bg-sand-100 disabled:opacity-60"
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell() {
  const { data: saved } = useSavedListings();
  const savedCount = saved?.length ?? 0;
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'text-brand-700' : 'text-sand-600 hover:text-sand-900',
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-sand-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Wordmark />
            <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-1.5">
                        {item.label}
                        {item.to === '/saved' && savedCount > 0 && (
                          <span className="tnum rounded-full bg-brand-100 px-1.5 text-[11px] font-semibold text-brand-700">
                            {savedCount}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-600" aria-hidden />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <UserMenu />
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                <path d={mobileOpen ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} strokeLinecap="round" />
              </svg>
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav aria-label="Mobile" className="border-t border-sand-200 bg-white px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-sand-700 hover:bg-sand-100',
                  )
                }
              >
                {item.label}
                {item.to === '/saved' && savedCount > 0 && ` (${savedCount})`}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-sand-500 sm:px-6 lg:px-8">
          Property data served live from the Ivy Homes API. Figures are computed from the full dataset in your browser —
          see <Link to="/insights" className="font-medium text-brand-700 underline-offset-2 hover:underline">Insights</Link>{' '}
          for the methodology and the API audit.
        </div>
      </footer>
    </div>
  );
}
