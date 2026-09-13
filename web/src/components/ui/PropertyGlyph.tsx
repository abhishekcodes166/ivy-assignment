import { cn } from '@/lib/cn';
import type { PropertyType } from '@/api/types';

/**
 * The API ships no photography, and inventing stock images would misrepresent
 * real properties. Instead each property gets a deterministic mark derived from
 * its own id: a stable hue, a soft geometric field, and a silhouette matching
 * the property type. Same listing, same artwork, every time — and nothing that
 * could be mistaken for a real photograph.
 */

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SILHOUETTES: Record<PropertyType, string> = {
  apartment: 'M7 21V6.5L12 4l5 2.5V21M9.5 9.5h1.2M13.3 9.5h1.2M9.5 13h1.2M13.3 13h1.2M9.5 16.5h1.2M13.3 16.5h1.2',
  villa: 'M4 21v-9l8-6 8 6v9M9.5 21v-5.5h5V21M11 10.5h2',
  plot: 'M3.5 19.5h17M5 19.5V9l7-4.5L19 9v10.5M9 19.5v-4h6v4',
  'builder floor': 'M5 21V7h14v14M5 12h14M5 16.5h14M9 7V4.5h6V7',
  'independent house': 'M4 21v-8.5L12 6l8 6.5V21M10 21v-5h4v5M12 6V3.5',
};

interface PropertyGlyphProps {
  seed: string;
  propertyType: PropertyType;
  className?: string;
  label?: string;
}

export function PropertyGlyph({ seed, propertyType, className, label }: PropertyGlyphProps) {
  const h = hash(seed);
  const hue = h % 360;
  const tilt = (h >> 8) % 40;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      role="img"
      aria-label={label ?? `Illustrative mark for ${propertyType}`}
      style={{
        background: `linear-gradient(${120 + tilt}deg,
          oklch(0.93 0.045 ${hue}) 0%,
          oklch(0.88 0.06 ${(hue + 28) % 360}) 55%,
          oklch(0.82 0.07 ${(hue + 52) % 360}) 100%)`,
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="absolute inset-0 size-full opacity-[0.07]">
        <defs>
          <pattern id={`grid-${h % 9973}`} width="3" height="3" patternUnits="userSpaceOnUse">
            <path d="M3 0H0V3" fill="none" stroke="currentColor" strokeWidth="0.22" />
          </pattern>
        </defs>
        <rect width="24" height="24" fill={`url(#grid-${h % 9973})`} />
      </svg>

      <svg
        viewBox="0 0 24 24"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-1/2 left-1/2 size-[54%] -translate-x-1/2 -translate-y-1/2 text-sand-900/35"
      >
        <path d={SILHOUETTES[propertyType] ?? SILHOUETTES.apartment} />
      </svg>
    </div>
  );
}
