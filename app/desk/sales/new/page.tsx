import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SaleForm from "../SaleForm";

export const metadata = { title: "Desk — New Sale" };

export default function NewSalePage() {
  return (
    <div className="px-8 py-8 text-on-dark">
      <Link href="/desk/sales" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4 transition-colors">
        <ChevronLeft size={13} /> Back to sales
      </Link>
      <h1 className="text-2xl font-semibold text-on-dark mb-6">New Offline Sale</h1>
      <SaleForm mode="new" />
    </div>
  );
}
