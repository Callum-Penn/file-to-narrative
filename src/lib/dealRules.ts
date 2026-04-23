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
  ivgDeals: [
    "P2R-8953", "P2R-8952", "P2R-8951", "P2R-8950", "P2R-8949", "P2R-8948",
    "P2R-8331", "P2R-8330", "P2R-8329", "P2R-8328", "P2R-8327", "P2R-8316",
    "P2R-8315", "P2R-8314", "P2R-8265", "P2R-8264", "P2R-8263", "P2R-6964",
    "P2R-6963", "P2R-6962", "P2R-6961", "P2R-6960", "P2R-6959", "P2R-6958",
    "P2R-6957", "P2R-6956", "P2R-6955", "P2R-6954", "P2R-6953", "P2R-6952",
    "P2R-6951", "P2R-6950", "P2R-5925", "P2R-5924", "P2R-5923", "P2R-5922",
    "P2R-5921", "P2R-5920", "P2R-5919", "P2R-5918", "P2R-5917", "P2R-5916",
    "P2R-5915", "P2R-5914", "P2R-5929", "P2R-5913", "P2R-5928", "P2R-5912",
    "P2R-5927", "P2R-5911", "P2R-5926", "P2R-5910", "P2R-5293", "P2R-3897",
    "P2R-3885", "P2R-3898", "P2R-4304", "P2R-3896", "P2R-3903", "P2R-4297",
    "P2R-4293", "P2R-3904", "P2R-3902", "P2R-4308", "P2R-3901", "P2R-3899",
    "P2R-3900", "P2R-4389", "P2R-4386", "P2R-4384", "P2R-4372", "P2R-4356",
    "P2R-4375", "P2R-4371", "P2R-4370", "P2R-4363", "P2R-4387", "P2R-4346",
    "P2R-4353", "P2R-4369", "P2R-4381", "P2R-4351", "P2R-4368", "P2R-4359",
    "P2R-4350", "P2R-4366", "P2R-4360", "P2R-4357", "P2R-4373", "P2R-4380",
    "P2R-4347", "P2R-4365", "P2R-4391", "P2R-4379", "P2R-4383", "P2R-4392",
    "P2R-4362", "P2R-4378", "P2R-4345", "P2R-4394", "P2R-4361", "P2R-4393",
    "P2R-4364", "P2R-4390", "P2R-4348", "P2R-4376", "P2R-4343", "P2R-4354",
    "P2R-4395", "P2R-4377", "P2R-4342", "P2R-4349", "P2R-4344", "P2R-4341",
    "P2R-4374", "P2R-4388", "P2R-4358", "P2R-4340", "P2R-4367", "P2R-4385",
    "P2R-4355", "P2R-4352", "P2R-4382",
  ],
  promoPods: [
    "P2R-8959", "P2R-8958", "P2R-8957", "P2R-8956", "P2R-8955", "P2R-8954",
    "P2R-8404", "P2R-8403", "P2R-8402", "P2R-8401", "P2R-8400", "P2R-8399",
    "P2R-8398", "P2R-8397", "P2R-8396", "P2R-8395", "P2R-8341", "P2R-8340",
    "P2R-8339", "P2R-8338", "P2R-8337", "P2R-8336", "P2R-8335", "P2R-8334",
    "P2R-8333", "P2R-8332", "P2R-8326", "P2R-8325", "P2R-8324", "P2R-8323",
    "P2R-8322", "P2R-8321", "P2R-8320", "P2R-8319", "P2R-8318", "P2R-8317",
    "P2R-8268", "P2R-8267", "P2R-8266", "P2R-6979", "P2R-6978", "P2R-6977",
    "P2R-6976", "P2R-6975", "P2R-6974", "P2R-6973", "P2R-6972", "P2R-6971",
    "P2R-6970", "P2R-6969", "P2R-6968", "P2R-6967", "P2R-6966", "P2R-6965",
    "P2R-5941", "P2R-5940", "P2R-5939", "P2R-5938", "P2R-5937", "P2R-5936",
    "P2R-5935", "P2R-5934", "P2R-5949", "P2R-5933", "P2R-5948", "P2R-5932",
    "P2R-5947", "P2R-5931", "P2R-5946", "P2R-5930", "P2R-5945", "P2R-5944",
    "P2R-5943", "P2R-5942", "P2R-5292", "P2R-3887", "P2R-3888", "P2R-4284",
    "P2R-3886", "P2R-3893", "P2R-4277", "P2R-4273", "P2R-3894", "P2R-3892",
    "P2R-4288", "P2R-3891", "P2R-3889", "P2R-3890", "P2R-3895", "P2R-4410",
    "P2R-4409", "P2R-4408", "P2R-4441", "P2R-4427", "P2R-4451", "P2R-4426",
    "P2R-4406", "P2R-4425", "P2R-4405", "P2R-4439", "P2R-4404", "P2R-4438",
    "P2R-4423", "P2R-4437", "P2R-4422", "P2R-4402", "P2R-4436", "P2R-4421",
    "P2R-4420", "P2R-4449", "P2R-4400", "P2R-4434", "P2R-4419", "P2R-4448",
    "P2R-4399", "P2R-4433", "P2R-4418", "P2R-4447", "P2R-4450", "P2R-4417",
    "P2R-4416", "P2R-4445", "P2R-4431", "P2R-4415", "P2R-4430", "P2R-4398",
    "P2R-4414", "P2R-4443", "P2R-4429", "P2R-4397", "P2R-4413", "P2R-4442",
    "P2R-4396", "P2R-4428", "P2R-4412",
  ],
};
