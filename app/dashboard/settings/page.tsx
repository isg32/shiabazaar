import type { Metadata } from "next";
import { getSettings } from "@/lib/bi/credit";
import { getDashboardViewer } from "@/lib/staff-guard";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Settings" };

export default async function DashboardSettings() {
  const [settings, viewer] = await Promise.all([getSettings(), getDashboardViewer()]);
  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Settings</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-6">Business rules behind credit status, overdue and alerts.</p>
      <SettingsForm initial={settings} canEdit={viewer.isAdmin} />
    </div>
  );
}
