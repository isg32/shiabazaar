"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import ReturnForm, { type ReturnableOrder } from "../../ReturnForm";

export default function ReturnSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<(ReturnableOrder & { status: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/desk/sales/${id}`)
      .then((r) => r.json())
      .then((d) => (d.order ? setOrder(d.order) : setError(d.error ?? "Not found.")));
  }, [id]);

  const back = () => { router.push("/desk/sales"); router.refresh(); };

  return (
    <div className="px-8 py-8 text-on-dark max-w-3xl">
      <Link href="/desk/sales" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4 transition-colors">
        <ChevronLeft size={13} /> Back to sales
      </Link>
      <h1 className="text-2xl font-semibold text-on-dark mb-2">
        Return <span className="font-mono text-base text-on-dark-soft">#{id.slice(0, 8).toUpperCase()}</span>
      </h1>
      {error && <p className="text-sm text-error">{error}</p>}
      {!order && !error && (
        <p className="flex items-center gap-2 text-on-dark-soft text-sm"><Loader2 size={15} className="animate-spin" /> Loading…</p>
      )}
      {order && order.status === "cancelled" && <p className="text-sm text-on-dark-soft">This sale is cancelled.</p>}
      {order && order.status !== "cancelled" && <ReturnForm order={order} credit={false} onClose={back} onDone={back} />}
    </div>
  );
}
