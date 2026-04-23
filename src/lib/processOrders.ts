import * as XLSX from "xlsx";
import { DealRule, Collections } from "./dealRules";

export type RawRow = Record<string, any>;

export type LineItem = {
  orderId: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  rowType: "product" | "discount" | "shipping" | "other";
  discountCode?: string;
  discountValue?: number;
};

export type OrderResult = {
  orderId: string;
  codes: string[];
  totalQty: number;
  ivgDealsQty: number;
  promoPodsQty: number;
  totalDiscount: number;
  appliedRules: AppliedRule[];
  rawFreeUnits: number;
  cappedFreeUnits: number;
  freeValue: number;
  uncapped: boolean;
  notes: string[];
};

export type AppliedRule = {
  code: string;
  uses: number;
  freePerUse: number;
  freeCollection: "IVG_DEALS" | "PROMO_PODS";
  rawFree: number;
};

const COL_ALIASES = {
  orderId: ["Name", "Order", "Order ID", "order_id", "Order Name"],
  lineType: ["Line: Type", "Type", "Line Type"],
  lineName: ["Line: Name", "Product", "Item", "Line Name"],
  sku: ["Line: SKU", "SKU", "Variant SKU", "Product SKU"],
  qty: ["Line: Quantity", "Qty", "Quantity"],
  unitPrice: ["Line: Price", "Price", "Unit Price"],
  lineTotal: ["Line: Total", "Total", "Line Total"],
  lineDiscount: ["Line: Discount", "Discount", "Discount Amount"],
};

function pick(row: RawRow, keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
    // case-insensitive fallback
    const found = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") return row[found];
  }
  return undefined;
}

function toNum(v: any): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[£$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function parseWorkbook(file: ArrayBuffer): { rows: LineItem[]; sheetName: string; rawCount: number } {
  const wb = XLSX.read(file, { type: "array" });
  // pick the largest sheet
  let bestSheet = wb.SheetNames[0];
  let bestRows: RawRow[] = [];
  for (const name of wb.SheetNames) {
    const json = XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[name], { defval: "" });
    if (json.length > bestRows.length) {
      bestRows = json;
      bestSheet = name;
    }
  }

  let currentOrder = "";
  const lines: LineItem[] = [];
  for (const r of bestRows) {
    const orderRaw = pick(r, COL_ALIASES.orderId);
    if (orderRaw && String(orderRaw).trim()) currentOrder = String(orderRaw).trim();

    const typeRaw = String(pick(r, COL_ALIASES.lineType) || "").toLowerCase();
    const name = String(pick(r, COL_ALIASES.lineName) || "").trim();
    const sku = String(pick(r, COL_ALIASES.sku) || "").trim();
    const qty = toNum(pick(r, COL_ALIASES.qty));
    const unitPrice = toNum(pick(r, COL_ALIASES.unitPrice));
    const lineTotal = toNum(pick(r, COL_ALIASES.lineTotal));
    const lineDiscount = toNum(pick(r, COL_ALIASES.lineDiscount));

    if (!currentOrder || (!name && !sku && !typeRaw)) continue;

    let rowType: LineItem["rowType"] = "other";
    if (typeRaw.includes("discount")) rowType = "discount";
    else if (typeRaw.includes("shipping")) rowType = "shipping";
    else if (typeRaw.includes("product") || typeRaw.includes("line item") || (qty > 0 && unitPrice >= 0 && name)) rowType = "product";

    const item: LineItem = {
      orderId: currentOrder,
      sku,
      name,
      qty,
      unitPrice,
      lineTotal,
      rowType,
    };
    if (rowType === "discount") {
      item.discountCode = name;
      item.discountValue = Math.abs(lineDiscount || lineTotal);
    }
    lines.push(item);
  }

  return { rows: lines, sheetName: bestSheet, rawCount: bestRows.length };
}

function matchesCollection(item: LineItem, keywords: string[]): boolean {
  if (!keywords.length) return false;
  const hay = `${item.sku} ${item.name}`.toLowerCase();
  return keywords.some((kw) => kw && hay.includes(kw.toLowerCase()));
}

export function computeResults(
  lines: LineItem[],
  rules: DealRule[],
  collections: Collections,
  uncappedOrders: Set<string>
): OrderResult[] {
  const byOrder = new Map<string, LineItem[]>();
  for (const l of lines) {
    if (!byOrder.has(l.orderId)) byOrder.set(l.orderId, []);
    byOrder.get(l.orderId)!.push(l);
  }

  const ruleMap = new Map(rules.map((r) => [r.code.toUpperCase(), r]));
  const results: OrderResult[] = [];

  for (const [orderId, items] of byOrder.entries()) {
    const products = items.filter((i) => i.rowType === "product");
    const discounts = items.filter((i) => i.rowType === "discount");
    const codesUsed = discounts.map((d) => (d.discountCode || "").trim()).filter(Boolean);
    const totalDiscount = discounts.reduce((s, d) => s + (d.discountValue || 0), 0);

    const ivgItems = products.filter((p) => matchesCollection(p, collections.ivgDeals));
    const podItems = products.filter((p) => matchesCollection(p, collections.promoPods));
    const ivgQty = ivgItems.reduce((s, p) => s + p.qty, 0);
    const podQty = podItems.reduce((s, p) => s + p.qty, 0);

    const applied: AppliedRule[] = [];
    const notes: string[] = [];
    let rawFree = 0;
    const isUncapped = uncappedOrders.has(orderId);

    // Track remaining basket capacity per free collection so multiple codes
    // sharing the same pool can't double-claim the same physical units.
    const basketRemaining: Record<"IVG_DEALS" | "PROMO_PODS", number> = {
      IVG_DEALS: ivgQty,
      PROMO_PODS: podQty,
    };

    for (const code of codesUsed) {
      const rule = ruleMap.get(code.toUpperCase());
      if (!rule) {
        notes.push(`Code "${code}" not in deal rules — ignored`);
        continue;
      }
      const qualifyingQty = rule.buyCollection === "IVG_DEALS" ? ivgQty : products.reduce((s, p) => s + p.qty, 0);
      const possibleUses = Math.floor(qualifyingQty / rule.buyQty);
      const usesByRule = isUncapped ? possibleUses : Math.min(possibleUses, rule.maxUses);
      const entitlement = usesByRule * rule.freeQty;

      // Cap entitlement by what's actually in the basket from the free collection.
      const basketCap = basketRemaining[rule.freeCollection];
      const free = Math.min(entitlement, basketCap);
      basketRemaining[rule.freeCollection] = Math.max(0, basketCap - free);

      if (usesByRule === 0) {
        notes.push(`Code "${code}" applied but only ${qualifyingQty} qualifying items (need ${rule.buyQty})`);
      }
      if (free < entitlement) {
        notes.push(
          `Code "${code}" entitlement ${entitlement} capped to ${free} — only ${basketCap} ${rule.freeCollection === "PROMO_PODS" ? "promo pod" : "IVG deals"} unit(s) available in basket`
        );
      }
      applied.push({
        code,
        uses: usesByRule,
        freePerUse: rule.freeQty,
        freeCollection: rule.freeCollection,
        rawFree: free,
      });
      rawFree += free;
    }

    // Value the freebies using cheapest eligible items from the relevant free collection.
    const valueCollection = (col: "IVG_DEALS" | "PROMO_PODS") =>
      col === "IVG_DEALS" ? ivgItems : podItems;

    let totalFreeUnits = applied.reduce((s, a) => s + a.rawFree, 0);

    const cols = new Set(applied.map((a) => a.freeCollection));
    const pool: number[] = [];
    cols.forEach((c) => {
      for (const it of valueCollection(c)) {
        for (let i = 0; i < it.qty; i++) pool.push(it.unitPrice);
      }
    });
    pool.sort((a, b) => a - b);
    const valued = pool.slice(0, totalFreeUnits);
    const freeValue = valued.reduce((s, p) => s + p, 0);

    results.push({
      orderId,
      codes: codesUsed,
      totalQty: products.reduce((s, p) => s + p.qty, 0),
      ivgDealsQty: ivgQty,
      promoPodsQty: podQty,
      totalDiscount,
      appliedRules: applied,
      rawFreeUnits: applied.reduce((s, a) => s + a.uses * a.freePerUse, 0),
      cappedFreeUnits: totalFreeUnits,
      freeValue,
      uncapped: isUncapped,
      notes,
    });
  }

  // Only return orders that used at least one known code
  return results.filter((r) => r.codes.length > 0).sort((a, b) => b.freeValue - a.freeValue);
}

export function exportResultsToXlsx(results: OrderResult[]): Blob {
  const summary = results.map((r) => ({
    "Order ID": r.orderId,
    "Codes Used": r.codes.join(", "),
    "Uncapped": r.uncapped ? "YES" : "",
    "Total Qty": r.totalQty,
    "IVG Deals Qty": r.ivgDealsQty,
    "Promo Pods Qty": r.promoPodsQty,
    "Free Units": r.cappedFreeUnits,
    "Free Value (£)": Number(r.freeValue.toFixed(2)),
    "Total Discount (£)": Number(r.totalDiscount.toFixed(2)),
    "Notes": r.notes.join(" | "),
  }));
  const totals = {
    "Order ID": "TOTAL",
    "Codes Used": "",
    "Uncapped": "",
    "Total Qty": results.reduce((s, r) => s + r.totalQty, 0),
    "IVG Deals Qty": results.reduce((s, r) => s + r.ivgDealsQty, 0),
    "Promo Pods Qty": results.reduce((s, r) => s + r.promoPodsQty, 0),
    "Free Units": results.reduce((s, r) => s + r.cappedFreeUnits, 0),
    "Free Value (£)": Number(results.reduce((s, r) => s + r.freeValue, 0).toFixed(2)),
    "Total Discount (£)": Number(results.reduce((s, r) => s + r.totalDiscount, 0).toFixed(2)),
    "Notes": "",
  };
  const ws = XLSX.utils.json_to_sheet([...summary, totals]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chargeback Summary");

  const breakdown = results.flatMap((r) =>
    r.appliedRules.map((a) => ({
      "Order ID": r.orderId,
      "Code": a.code,
      "Uses": a.uses,
      "Free Per Use": a.freePerUse,
      "Free Collection": a.freeCollection,
      "Raw Free Units": a.rawFree,
    }))
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(breakdown), "Code Breakdown");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
