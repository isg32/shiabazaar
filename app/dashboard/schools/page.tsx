import type { Metadata } from "next";
import InstitutionPage from "@/components/dashboard/InstitutionPage";
import type { SearchParams } from "@/lib/bi/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — School performance" };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <InstitutionPage kind="school" sp={await searchParams} />;
}
