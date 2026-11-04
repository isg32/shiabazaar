/*
 * Chart colours for the dark dashboard surface (#252320). Validated with the
 * dataviz palette checker (dark mode, all pairs): every slot clears contrast,
 * lightness band and CVD separation. Colour follows the entity, never rank.
 */
export const VIZ = {
  accent: "#cc785c", // single-series marks (brand coral)
  grid: "#383835",
  channel: { online: "#3987e5", offline: "#d95926" },
  buyer: { individual: "#3987e5", school: "#d95926", vendor: "#199e70" },
  main: { Books: "#3987e5", Gifts: "#d95926", Other: "#199e70" },
  status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
} as const;
