import { useEffect, useRef, useState } from "react";
import { ChevronDown, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface TagFilterDropdownProps {
  tags: string[];
  counts: Map<string, number>;
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilterDropdown({
  tags,
  counts,
  selected,
  onChange,
}: TagFilterDropdownProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleTag = (tag: string) =>
    onChange(
      selected.includes(tag)
        ? selected.filter((x) => x !== tag)
        : [...selected, tag],
    );

  const active = selected.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
          active
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
        }`}
      >
        <Tag className="h-3 w-3" />
        {t("filter.tags")}
        {active && (
          <span className="min-w-[1rem] px-1 py-px rounded-full bg-primary/20 text-primary text-[10px] font-semibold text-center">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 w-52 max-h-72 overflow-y-auto scrollbar-thin rounded-lg border border-border bg-card shadow-lg p-1.5">
          {tags.map((tag) => {
            const checked = selected.includes(tag);
            return (
              <label
                key={tag}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTag(tag)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span
                  className={`flex-1 text-xs ${
                    checked ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {tag}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {counts.get(tag) ?? 0}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
