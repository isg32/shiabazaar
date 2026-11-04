import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

/*
 * Report exports. Money is stored in paise and written as rupees: plain
 * numbers in CSV (machine-friendly), ₹-formatted numeric cells in Excel, and
 * "Rs" text in PDF (the built-in PDF fonts have no ₹ glyph).
 */

export type ColType = "text" | "money" | "int" | "pct" | "date";
export type Col = { key: string; label: string; type: ColType };
export type Row = Record<string, string | number | Date | null>;
export type Table = { title: string; subtitle: string; cols: Col[]; rows: Row[] };

const istDate = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

function plain(v: Row[string], t: ColType): string {
  if (v === null || v === undefined || v === "") return "";
  if (t === "money") return (Number(v) / 100).toFixed(2);
  if (t === "date") return v instanceof Date ? istDate(v) : String(v);
  return String(v);
}

export function toCSV(t: Table): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [t.cols.map((c) => esc(c.label)).join(",")];
  for (const r of t.rows) lines.push(t.cols.map((c) => esc(plain(r[c.key], c.type))).join(","));
  return "﻿" + lines.join("\n"); // BOM so Excel opens UTF-8 (₹, Urdu titles) correctly
}

export async function toXLSX(t: Table): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Shia Bazaar dashboard";
  const ws = wb.addWorksheet(t.title.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Report");
  ws.addRow([t.title]).font = { bold: true, size: 14 };
  ws.addRow([t.subtitle]).font = { color: { argb: "FF6C6A64" } };
  ws.addRow([]);
  const header = ws.addRow(t.cols.map((c) => c.label));
  header.font = { bold: true };
  header.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE9DE" } }; });
  for (const r of t.rows) {
    ws.addRow(t.cols.map((c) => {
      const v = r[c.key];
      if (v === null || v === undefined || v === "") return null;
      if (c.type === "money") return Number(v) / 100;
      if (c.type === "int" || c.type === "pct") return Number(v);
      if (c.type === "date") return v instanceof Date ? new Date(istDate(v)) : v;
      return String(v);
    }));
  }
  t.cols.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = Math.min(48, Math.max(c.label.length + 2, c.type === "text" ? 24 : 14));
    if (c.type === "money") col.numFmt = '"₹"#,##0.00';
    if (c.type === "pct") col.numFmt = '0.0"%"';
    if (c.type === "date") col.numFmt = "dd-mmm-yyyy";
  });
  const headerRow = header.number;
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: t.cols.length } };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Text safe for the built-in (Latin-1) PDF fonts: common Unicode punctuation mapped, the rest replaced. */
function latin1(v: string): string {
  return v
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[\u203A\u2192]/g, ">")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/\u20B9/g, "Rs")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function pdfCell(v: Row[string], t: ColType): string {
  if (v === null || v === undefined || v === "") return "";
  if (t === "money") return (Number(v) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (t === "pct") return `${v}%`;
  if (t === "date") return v instanceof Date ? istDate(v) : String(v);
  return latin1(String(v));
}

export function toPDF(t: Table): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;
    const bottom = doc.page.height - doc.page.margins.bottom - 18;
    const labels = t.cols.map((c) => latin1(c.type === "money" ? `${c.label} (Rs)` : c.label));
    const body = t.rows.map((r) => t.cols.map((c) => pdfCell(r[c.key], c.type)));

    // Size columns from their content: numbers and dates never wrap; text shares what's left.
    let fontSize = 8;
    let widths: number[] = [];
    for (; fontSize >= 6; fontSize -= 0.5) {
      doc.font("Helvetica").fontSize(fontSize);
      const need = t.cols.map((c, i) => {
        const cells = body.slice(0, 400).map((row) => doc.widthOfString(row[i]));
        const longestWord = Math.max(...labels[i].split(/\s+/).map((w) => doc.font("Helvetica-Bold").widthOfString(w)));
        doc.font("Helvetica");
        const content = Math.max(0, ...cells);
        return c.type === "text" ? Math.max(longestWord, Math.min(content, 170)) : Math.max(longestWord, content);
      }).map((w) => w + 12);
      const fixed = t.cols.reduce((s2, c, i) => s2 + (c.type === "text" ? 0 : need[i]), 0);
      const textNeed = t.cols.reduce((s2, c, i) => s2 + (c.type === "text" ? need[i] : 0), 0);
      if (fixed + Math.min(textNeed, 60 * t.cols.filter((c) => c.type === "text").length) <= width || fontSize === 6) {
        const spare = Math.max(width - fixed, 0);
        widths = t.cols.map((c, i) => (c.type === "text" ? (textNeed ? (need[i] / textNeed) * spare : 0) : need[i]));
        const sum = widths.reduce((a, b) => a + b, 0);
        if (sum > width) widths = widths.map((w) => (w * width) / sum);
        else if (!textNeed) widths = widths.map((w) => (w * width) / sum);
        break;
      }
    }

    doc.font("Helvetica-Bold").fontSize(15).text(latin1(t.title), left, 36);
    doc.font("Helvetica").fontSize(9).fillColor("#6c6a64").text(latin1(t.subtitle));
    doc.moveDown(0.8);

    const drawRow = (cells: string[], bold: boolean) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize).fillColor("#141413");
      const h = Math.max(...cells.map((c, i) => doc.heightOfString(c, { width: widths[i] - 6 }))) + 6;
      if (doc.y + h > bottom) { doc.addPage(); drawHeader(); }
      const y = doc.y;
      let x = left;
      cells.forEach((c, i) => {
        const align = t.cols[i].type === "text" || t.cols[i].type === "date" ? "left" : "right";
        doc.text(c, x + 3, y + 3, { width: widths[i] - 6, align });
        x += widths[i];
      });
      doc.y = y + h;
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(0.4).strokeColor("#e6dfd8").stroke();
    };
    const drawHeader = () => drawRow(labels, true);

    drawHeader();
    if (t.rows.length === 0) doc.font("Helvetica").fontSize(9).text("No data for this selection.", left, doc.y + 8);
    for (const row of body) drawRow(row, false);

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0; // writing below the margin would otherwise add a blank page
      doc.font("Helvetica").fontSize(7).fillColor("#8e8b82")
        .text(`Shia Bazaar · ${latin1(t.title)} · page ${i + 1} of ${range.count}`, left, doc.page.height - 28, { width, align: "center", lineBreak: false });
    }
    doc.end();
  });
}
