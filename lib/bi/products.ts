import type { Facts, SaleLine, ReturnLine } from "./facts";
import { mainCategory, type MainCategory } from "./facts";

export type ProductRow = {
  productId: string; title: string; sku: string | null; main: MainCategory;
  qty: number; gross: number; net: number; discount: number; returnedQty: number; returns: number; revenue: number;
};

/** Per-product totals. revenue = net − returns. */
export function productRows(lines: SaleLine[], returns: ReturnLine[]): ProductRow[] {
  const m = new Map<string, ProductRow>();
  const row = (id: string, title: string, sku: string | null, type: string) => {
    let r = m.get(id);
    if (!r) {
      r = { productId: id, title, sku, main: mainCategory(type), qty: 0, gross: 0, net: 0, discount: 0, returnedQty: 0, returns: 0, revenue: 0 };
      m.set(id, r);
    }
    return r;
  };
  for (const l of lines) {
    const r = row(l.productId, l.title, l.sku, l.type);
    r.qty += l.qty; r.gross += l.gross; r.net += l.net;
  }
  for (const x of returns) {
    const r = row(x.productId, x.title, null, x.type);
    r.returnedQty += x.qty; r.returns += x.amount;
  }
  return [...m.values()].map((r) => {
    const net = Math.round(r.net);
    return { ...r, net, discount: r.gross - net, revenue: net - r.returns };
  });
}

export const productRowsOf = (f: Facts) => productRows(f.lines, f.returns);
