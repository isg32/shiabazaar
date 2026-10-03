import type { Metadata } from "next";
import ChannelPage from "@/components/dashboard/ChannelPage";
import type { SearchParams } from "@/lib/bi/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Physical store" };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ChannelPage channel="offline" sp={await searchParams} />;
}
