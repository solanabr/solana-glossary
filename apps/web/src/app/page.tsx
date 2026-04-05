import { Suspense } from "react";

import HomePageClient from "./home-page-client";
import { getHomePlatformNavProps } from "@/lib/nav-platform-flags";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="min-h-screen app-surface" aria-hidden />}
    >
      <HomePageClient {...getHomePlatformNavProps()} />
    </Suspense>
  );
}
