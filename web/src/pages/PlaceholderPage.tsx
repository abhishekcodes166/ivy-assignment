import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/Primitives';

/**
 * The header links to /projects and /insights before those screens exist, so the
 * routes resolve to an honest placeholder rather than a dead end.
 */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <EmptyState
      title={`${title} is not built yet`}
      description="This section is part of the app but has no screen yet. Browse and Rent are live."
      action={
        <Link
          to="/buy"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Back to Buy
        </Link>
      }
    />
  );
}

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="That address does not match any screen in the app."
      action={
        <Link
          to="/buy"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Back to Buy
        </Link>
      }
    />
  );
}
