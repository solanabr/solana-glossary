import { redirect } from "next/navigation";

import { DEFAULT_LOCALE } from "@/lib/locales";

export default function IndexPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
