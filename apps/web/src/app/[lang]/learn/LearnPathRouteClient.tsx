"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import LearnPathModal from "@/components/LearnPathModal";
import type { GlossaryTerm, Locale } from "@/lib/glossary";

type Props = {
  locale: Locale;
  pathTerms: GlossaryTerm[];
};

export default function LearnPathRouteClient({ locale, pathTerms }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.push("/");
  }, [router]);

  return (
    <>
      <div className="min-h-[100dvh] app-surface" aria-hidden />
      <LearnPathModal
        open={open}
        onClose={handleClose}
        locale={locale}
        pathTerms={pathTerms}
      />
    </>
  );
}
