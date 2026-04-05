"use client";

interface Category {
  slug: string;
  label: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  termCounts?: Record<string, number>;
  clearLabel?: string;
  emptyLabel?: string;
  scrollable?: boolean;
  wrapMaxLines?: number;
}

export default function CategoryFilter({
  categories,
  selected,
  onChange,
  label,
  termCounts,
  clearLabel = "clear",
  emptyLabel = "No categories",
  scrollable = false,
  wrapMaxLines,
}: CategoryFilterProps) {
  const toggle = (slug: string) => {
    onChange(
      selected.includes(slug)
        ? selected.filter((s) => s !== slug)
        : [...selected, slug],
    );
  };

  const listClass =
    scrollable && !wrapMaxLines
      ? "flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]"
      : wrapMaxLines === 2
        ? "flex flex-wrap gap-2 max-h-[5.5rem] overflow-y-auto overflow-x-hidden pb-1 [scrollbar-width:thin]"
        : "flex flex-wrap gap-2";

  const showToolbar = Boolean(label) || selected.length > 0;

  return (
    <div>
      {showToolbar && (
        <div
          className={`mb-3 flex items-center gap-2 ${
            label && selected.length > 0
              ? "justify-between"
              : label
                ? ""
                : "justify-end"
          }`}
        >
          {label ? (
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-sol-subtle">
              {label}
            </span>
          ) : null}
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-sol-subtle transition-colors hover:text-sol-text"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              {clearLabel} ({selected.length})
            </button>
          ) : null}
        </div>
      )}

      <div className={listClass}>
        {categories.map(({ slug, label: catLabel }) => {
          const isSelected = selected.includes(slug);
          const count = termCounts?.[slug];

          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              aria-pressed={isSelected}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-xs font-medium border transition-colors shrink-0
                ${
                  isSelected
                    ? "border-sol-text/35 bg-sol-surface-elevated text-sol-text"
                    : "border-sol-line bg-sol-surface text-sol-subtle hover:border-sol-line-strong hover:text-sol-text"
                }
              `}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 flex-shrink-0 opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              <span>{catLabel}</span>
              {count !== undefined && (
                <span className="opacity-50 text-[10px] tabular-nums">
                  ({count})
                </span>
              )}
            </button>
          );
        })}

        {categories.length === 0 && (
          <p className="text-xs text-sol-subtle">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
