function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Props = {
  intentUrl: string;
  label: string;
  /** Override outer wrapper (default: mt-8 flex justify-end). */
  wrapperClassName?: string;
};

export default function TermShareX({
  intentUrl,
  label,
  wrapperClassName = "mt-8 flex justify-end",
}: Props) {
  return (
    <div className={wrapperClassName}>
      <a
        href={intentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex items-center gap-2 rounded-xl border border-sol-line bg-sol-surface-elevated/90
          px-3.5 py-2.5 text-[12px] font-semibold text-sol-text shadow-[0_1px_0_rgba(255,255,255,0.04)]
          transition-colors hover:border-sol-line-strong hover:bg-sol-surface-elevated
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol-accent
          sm:text-[13px]
        "
      >
        <XIcon className="h-4 w-4 shrink-0 text-sol-text" />
        <span>{label}</span>
      </a>
    </div>
  );
}
