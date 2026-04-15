import Link from "next/link";

export function GraphMapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <circle cx="10" cy="16" r="2.5" />
      <path d="M10.5 10.5L14 11.5M11 14l3-2" strokeLinecap="round" />
    </svg>
  );
}

export function GraphMapLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="
        inline-flex items-center gap-1.5 rounded-lg border border-sol-line bg-sol-surface/80 px-2.5 py-1.5
        text-sol-subtle transition-colors hover:border-sol-accent/40 hover:text-sol-accent
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol-accent
      "
    >
      <GraphMapIcon className="h-4 w-4 shrink-0" />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
