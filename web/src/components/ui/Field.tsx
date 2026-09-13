import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-lg border bg-white px-3 text-sm text-sand-900 transition-colors placeholder:text-sand-400 ' +
  'disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-sand-500';

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium tracking-wide text-sand-600 uppercase">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-sand-500">{hint}</p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <input
        {...rest}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          CONTROL,
          'h-10',
          error ? 'border-red-400 focus:border-red-500' : 'border-sand-300 focus:border-brand-500',
          className,
        )}
      />
    </Wrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, hint, error, className, id, children, ...rest }: SelectProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <select
        {...rest}
        id={fieldId}
        className={cn(CONTROL, 'h-10 cursor-pointer border-sand-300 focus:border-brand-500', className)}
      >
        {children}
      </select>
    </Wrapper>
  );
}
