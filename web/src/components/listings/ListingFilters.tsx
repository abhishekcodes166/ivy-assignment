import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { titleCase } from '@/lib/format';
import type { ListingFilters as Filters } from '@/lib/filterListings';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  activeCount: number;
  localities: string[];
  bedrooms: number[];
  propertyTypes: string[];
  furnishings: string[];
}

export function ListingFilterBar({
  filters,
  onChange,
  onClear,
  activeCount,
  localities,
  bedrooms,
  propertyTypes,
  furnishings,
}: Props) {
  return (
    <div className="rounded-[--radius-card] border border-sand-200 bg-white p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Locality"
          value={filters.locality}
          onChange={(e) => onChange({ locality: e.target.value })}
        >
          <option value="">All localities</option>
          {localities.map((locality) => (
            <option key={locality} value={locality}>
              {titleCase(locality)}
            </option>
          ))}
        </Select>

        <Select label="Bedrooms" value={filters.bhk} onChange={(e) => onChange({ bhk: e.target.value })}>
          <option value="">Any</option>
          {bedrooms.map((count) => (
            <option key={count} value={String(count)}>
              {count === 0 ? 'Studio' : `${count} BHK`}
            </option>
          ))}
        </Select>

        <Select
          label="Furnishing"
          value={filters.furnishing}
          onChange={(e) => onChange({ furnishing: e.target.value })}
        >
          <option value="">Any</option>
          {furnishings.map((value) => (
            <option key={value} value={value}>
              {titleCase(value)}
            </option>
          ))}
        </Select>

        <Select
          label="Property type"
          value={filters.propertyType}
          onChange={(e) => onChange({ propertyType: e.target.value })}
        >
          <option value="">Any</option>
          {propertyTypes.map((value) => (
            <option key={value} value={value}>
              {titleCase(value)}
            </option>
          ))}
        </Select>

        <Input
          label="Min price (₹)"
          type="number"
          inputMode="numeric"
          min={0}
          step={100000}
          placeholder="e.g. 5000000"
          value={filters.minPrice}
          onChange={(e) => onChange({ minPrice: e.target.value })}
        />

        <Input
          label="Max price (₹)"
          type="number"
          inputMode="numeric"
          min={0}
          step={100000}
          placeholder="e.g. 15000000"
          value={filters.maxPrice}
          onChange={(e) => onChange({ maxPrice: e.target.value })}
        />

        <div className="flex flex-col justify-end gap-2.5 sm:col-span-2 lg:col-span-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-sand-700">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
              className="size-4 rounded border-sand-300 text-brand-600 focus:ring-brand-500"
            />
            Verified listings only
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-sand-700">
            <input
              type="checkbox"
              checked={filters.hideCorrupt}
              onChange={(e) => onChange({ hideCorrupt: e.target.checked })}
              className="size-4 rounded border-sand-300 text-brand-600 focus:ring-brand-500"
            />
            Hide listings with impossible data
            <span className="text-xs text-sand-400">(49 found)</span>
          </label>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-sand-100 pt-4">
          <p className="text-sm text-sand-500">
            {activeCount} filter{activeCount === 1 ? '' : 's'} applied
          </p>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
