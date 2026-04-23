// Default deal rules — editable in the UI
export type DealRule = {
  code: string;
  buyQty: number;
  buyCollection: "IVG_DEALS" | "ANY";
  freeQty: number;
  freeCollection: "IVG_DEALS" | "PROMO_PODS";
  maxUses: number;
};

export const DEFAULT_RULES: DealRule[] = [
  { code: "IVG-10KITS5PODS",                 buyQty: 50, buyCollection: "IVG_DEALS", freeQty: 25, freeCollection: "PROMO_PODS", maxUses: 2 },
  { code: "IVGTEAM-10+5-EXISTINGSTOCKIST",   buyQty: 50, buyCollection: "IVG_DEALS", freeQty: 25, freeCollection: "PROMO_PODS", maxUses: 2 },
  { code: "IVGTEAM-10+5NEWSTOCKIST",         buyQty: 50, buyCollection: "IVG_DEALS", freeQty: 25, freeCollection: "PROMO_PODS", maxUses: 2 },
  { code: "IVGTEAM-5+2-EXISTINGSTOCKIST",    buyQty: 25, buyCollection: "IVG_DEALS", freeQty: 10, freeCollection: "IVG_DEALS",  maxUses: 2 },
  { code: "IVGTEAM-5+2-NEWSTOCKIST",         buyQty: 25, buyCollection: "IVG_DEALS", freeQty: 10, freeCollection: "IVG_DEALS",  maxUses: 2 },
  { code: "IVGTEAM-PROMO-10FREE",            buyQty: 25, buyCollection: "IVG_DEALS", freeQty: 10, freeCollection: "IVG_DEALS",  maxUses: 2 },
  { code: "IVGTEAM-PROMO-25FREE",            buyQty: 50, buyCollection: "IVG_DEALS", freeQty: 25, freeCollection: "IVG_DEALS",  maxUses: 2 },
  { code: "IVGTEAM-PROMO-5FREE",             buyQty: 25, buyCollection: "IVG_DEALS", freeQty: 5,  freeCollection: "IVG_DEALS",  maxUses: 2 },
  { code: "IVGTEAM-PROMO-EXISTING-5FREE",    buyQty: 50, buyCollection: "IVG_DEALS", freeQty: 25, freeCollection: "IVG_DEALS",  maxUses: 2 },
];

// Collections — editable in the UI. Match by SKU OR product-name substring (case-insensitive).
// Defaults are intentionally broad keyword-based so a fresh orders export still works.
export type Collections = {
  ivgDeals: string[];   // SKU codes or name keywords
  promoPods: string[];
};

export const DEFAULT_COLLECTIONS: Collections = {
  ivgDeals: ["IVG", "IVG PRO", "IVG Pod", "IVG Starter", "IVG 2400"],
  promoPods: ["IVG PRO Pod", "Promo Pod", "IVG Pod"],
};
