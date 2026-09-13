import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-[--radius-card] border border-sand-200 bg-white shadow-[0_1px_2px_rgba(26,23,20,0.04)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

type BadgeTone = 'neutral' | 'brand' | 'warning' | 'danger' | 'accent';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sand-100 text-sand-600 border-sand-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  accent: 'bg-accent-100 text-accent-500 border-accent-500/25',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('shimmer rounded-md', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[--radius-card] border border-dashed border-sand-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-sand-100 text-sand-400">
        <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-sand-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-sand-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something failed to load',
  message,
  onRetry,
  retrying,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-[--radius-card] border border-red-200 bg-red-50/60 px-6 py-14 text-center"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 8v5m0 3h.01M10.3 3.9 2.4 17.4A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.6-2.6L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="mt-5 inline-flex h-9 items-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
        >
          {retrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-sand-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-sand-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
