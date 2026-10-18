import { headers } from "next/headers";
import type { Locale } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const headersList = await headers();
  const locale = headersList.get("x-locale");
  return locale === "en" ? "en" : "es";
}