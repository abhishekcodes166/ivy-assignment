import { cn } from '@/lib/cn';

/** Windowed page numbers with ellipses, so the control stays a fixed width. */
function pageWindow(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));

  const ordered = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const out: Array<number | 'gap'> = [];
  for (let i = 0; i < ordered.length; i++) {
    if (i > 0 && ordered[i] - ordered[i - 1] > 1) out.push('gap');
    out.push(ordered[i]);
  }
  return out;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const step = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors';

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(step, 'border-sand-300 bg-white text-sand-700 hover:bg-sand-100 disabled:opacity-40 disabled:hover:bg-white')}
      >
        Previous
      </button>

      {pageWindow(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1.5 text-sand-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              step,
              'tnum',
              item === page
                ? 'border-brand-600 bg-brand-600 font-semibold text-white'
                : 'border-sand-300 bg-white text-sand-700 hover:bg-sand-100',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className={cn(step, 'border-sand-300 bg-white text-sand-700 hover:bg-sand-100 disabled:opacity-40 disabled:hover:bg-white')}
      >
        Next
      </button>
    </nav>
  );
}
