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
