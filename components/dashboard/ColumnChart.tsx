"use client";

import { useMemo, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { VIZ } from "@/lib/bi/colors";
import { inrAxis } from "@/lib/bi/format";

export type Column = {
  key: string;
  label: string;
  value: number; // paise
  valueText: string;
  details: [string, string][]; // extra rows for tooltip + table
};

const H = 220; // plot height
const TOP = 12; // headroom so the top tick label is never clipped
const AXIS = 26; // x-axis band (inside the figure height)
const LEFT = 56;
const W = 720;

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/** Single-series column chart (one colour), hover/focus tooltip listing every metric, and a table twin. */
export default function ColumnChart({ title, columns, valueName }: { title: string; columns: Column[]; valueName: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const max = useMemo(() => niceMax(Math.max(0, ...columns.map((c) => c.value))), [columns]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const band = (W - LEFT) / Math.max(columns.length, 1);
  const barW = Math.max(2, Math.min(24, band - 4));
  const labelEvery = Math.ceil(columns.length / 12);
  const y = (v: number) => TOP + H - (Math.max(v, 0) / max) * H;

  return (
    <figure className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5" data-testid="trend-chart">
      <figcaption className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-on-dark">{title}</span>
        <button onClick={() => setTable((t) => !t)} className="text-xs text-on-dark-soft hover:text-on-dark flex items-center gap-1">
          {table ? <><BarChart3 size={12} /> Chart</> : <><Table2 size={12} /> Table</>}
        </button>
      </figcaption>

      {columns.length === 0 ? (
        <p className="text-sm text-on-dark-soft text-center py-16">No sales in this period.</p>
      ) : table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="trend-table">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-3 py-2 text-left font-medium text-on-dark-soft">Period</th>
                <th className="px-3 py-2 text-right font-medium text-on-dark-soft">{valueName}</th>
                {columns[0].details.map(([k]) => <th key={k} className="px-3 py-2 text-right font-medium text-on-dark-soft">{k}</th>)}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {columns.map((c) => (
                <tr key={c.key} className="border-b border-white/5">
                  <td className="px-3 py-1.5 text-on-dark">{c.label}</td>
                  <td className="px-3 py-1.5 text-right text-on-dark">{c.valueText}</td>
                  {c.details.map(([k, v]) => <td key={k} className="px-3 py-1.5 text-right text-on-dark-soft">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${TOP + H + AXIS}`} className="w-full h-auto" role="img" aria-label={`${title}, ${columns.length} periods`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={LEFT} x2={W} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth={1} />
                <text x={LEFT - 8} y={y(t) + 3} textAnchor="end" className="fill-on-dark-soft" fontSize={10} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {inrAxis(t)}
                </text>
              </g>
            ))}
            {columns.map((c, i) => {
              const cx = LEFT + band * i + band / 2;
              const top = y(c.value);
              const h = TOP + H - top;
              const r = Math.min(4, h);
              const x0 = cx - barW / 2;
              return (
                <g key={c.key}>
                  {h > 0 && (
                    <path
                      d={`M${x0},${TOP + H} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${TOP + H} Z`}
                      fill={VIZ.accent}
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                  {i % labelEvery === 0 && (
                    <text x={cx} y={TOP + H + 16} textAnchor="middle" className="fill-on-dark-soft" fontSize={10}>{c.label}</text>
                  )}
                  <rect
                    x={LEFT + band * i} y={TOP} width={band} height={H} fill="transparent" tabIndex={0}
                    aria-label={`${c.label}: ${c.valueText}`}
                    onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    style={{ outline: "none" }}
                  />
                </g>
              );
            })}
            <line x1={LEFT} x2={W} y1={TOP + H} y2={TOP + H} stroke="#5a5955" strokeWidth={1} />
          </svg>
          {hover !== null && (
            <div
              role="tooltip"
              className="absolute top-0 pointer-events-none bg-surface-dark border border-white/15 rounded-lg px-3 py-2 text-xs shadow-lg min-w-44 whitespace-nowrap"
              style={{
                left: `${((LEFT + band * hover + band / 2) / W) * 100}%`,
                transform: `translateX(${hover > columns.length / 2 ? "-105%" : "5%"})`,
              }}
            >
              <p className="text-on-dark-soft mb-1">{columns[hover].label}</p>
              <p className="flex items-center gap-2 mb-1">
                <span className="w-3 h-0.5 rounded" style={{ background: VIZ.accent }} />
                <span className="text-on-dark font-semibold">{columns[hover].valueText}</span>
                <span className="text-on-dark-soft">{valueName}</span>
              </p>
              {columns[hover].details.map(([k, v]) => (
                <p key={k} className="flex justify-between gap-4"><span className="text-on-dark-soft">{k}</span><span className="text-on-dark tabular-nums">{v}</span></p>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
