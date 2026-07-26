import { db } from "@/lib/db";

// ponytail: store city hardcoded to Lucknow; change STORE_DISTRICT if store relocates
export const STORE_DISTRICT = "Lucknow";
export const STORE_STATE = "Uttar Pradesh";

const JK_AND_NE = new Set([
  "Jammu & Kashmir",
  "Jammu and Kashmir",
  "Ladakh",
  "Assam",
  "Meghalaya",
  "Manipur",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Arunachal Pradesh",
  "Sikkim",
]);

export function classifyZone(state: string, district: string): "A" | "B" | "C" | "D" {
  if (district.toLowerCase() === STORE_DISTRICT.toLowerCase()) return "A";
  if (state === STORE_STATE) return "B";
  if (JK_AND_NE.has(state)) return "C";
  return "D";
}

export type ShippingQuote = {
  zone: "A" | "B" | "C" | "D";
  label: string;
  price: number; // paise
  state: string;
  district: string;
};

// Looks up a pincode via the India Post public API, classifies its shipping
// zone, and prices it against the admin-configured ShippingZone table.
// Throws with a user-facing message on invalid/unknown pincode or API failure.
export async function quoteShippingForPincode(pincode: string): Promise<ShippingQuote> {
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    throw new Error("Please enter a valid 6-digit pincode.");
  }

  let data: { Status?: string; PostOffice?: { State: string; District: string }[] }[];
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      next: { revalidate: 86400 }, // cache 24h per pincode
    });
    data = await res.json();
  } catch {
    throw new Error("Could not verify pincode. Please try again.");
  }

  if (!data?.[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) {
    throw new Error("Pincode not found");
  }
  const po = data[0].PostOffice[0];
  const state = po.State;
  const district = po.District;

  const zone = classifyZone(state, district);
  const row = await db.shippingZone.findUnique({ where: { zone } });

  return {
    zone,
    label: row?.label ?? zone,
    price: row?.price ?? 0,
    state,
    district,
  };
}
