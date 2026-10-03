import type { Metadata } from "next";
import ChannelPage from "@/components/dashboard/ChannelPage";
import type { SearchParams } from "@/lib/bi/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Online sales" };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ChannelPage channel="online" sp={await searchParams} />;
}
