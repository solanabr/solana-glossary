/** Inline icons for MCP, CLI, and VS Code (nav + hero). */

export function IconMcp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 4v2" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
      <rect x="5.5" y="8" width="13" height="12" rx="2.5" />
      <circle cx="9.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <path d="M9 18.5h6" />
    </svg>
  );
}

export function IconCli({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M6 8l4 4-4 4M12 16h6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Simplified VS Code mark (geometric), currentColor fill. */
export function IconVsCode({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.261a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.125 9.461 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
    </svg>
  );
}
