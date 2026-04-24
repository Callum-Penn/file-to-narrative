import { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, FileSpreadsheet, Settings2, Sparkles, AlertTriangle, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  parseWorkbook,
  computeResults,
  exportResultsToXlsx,
  LineItem,
  OrderResult,
} from "@/lib/processOrders";
import {
  DEFAULT_RULES,
  DEFAULT_COLLECTIONS,
  DealRule,
  Collections,
} from "@/lib/dealRules";

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const Index = () => {
  const [lines, setLines] = useState<LineItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [rules, setRules] = useState<DealRule[]>(DEFAULT_RULES);
  const [collections, setCollections] = useState<Collections>(DEFAULT_COLLECTIONS);
  const [uncapped, setUncapped] = useState<Set<string>>(new Set(["VL-43387"]));
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAdmin, signOut } = useAuth();

  const handleFile = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const { rows, sheetName, rawCount } = parseWorkbook(buf);
      setLines(rows);
      setFileName(file.name);
      toast.success(`Loaded ${rawCount} rows from "${sheetName}"`);
    } catch (e: any) {
      toast.error(`Failed to read file: ${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const results = useMemo(
    () => (lines.length ? computeResults(lines, rules, collections, uncapped) : []),
    [lines, rules, collections, uncapped]
  );

  const totals = useMemo(() => {
    return {
      orders: results.length,
      freeUnits: results.reduce((s, r) => s + r.cappedFreeUnits, 0),
      freeValue: results.reduce((s, r) => s + r.freeValue, 0),
      discount: results.reduce((s, r) => s + r.totalDiscount, 0),
    };
  }, [results]);

  const allOrderIds = useMemo(
    () => Array.from(new Set(lines.map((l) => l.orderId))).sort(),
    [lines]
  );

  const diagnostics = useMemo(() => {
    if (!lines.length) return null;
    const products = lines.filter((l) => l.rowType === "product");
    const discounts = lines.filter((l) => l.rowType === "discount");
    const codesFound = Array.from(
      new Set(discounts.map((d) => (d.discountCode || "").trim()).filter(Boolean))
    );
    const ruleCodes = new Set(rules.map((r) => r.code.toUpperCase()));
    const matched = codesFound.filter((c) => ruleCodes.has(c.toUpperCase()));
    const unmatched = codesFound.filter((c) => !ruleCodes.has(c.toUpperCase()));
    return {
      totalLines: lines.length,
      orderCount: allOrderIds.length,
      productLines: products.length,
      discountLines: discounts.length,
      codesFound,
      matched,
      unmatched,
    };
  }, [lines, rules, allOrderIds]);

  const toggleUncapped = (id: string) => {
    setUncapped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadReport = () => {
    if (!results.length) return;
    const blob = exportResultsToXlsx(results);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chargeback-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Chargeback Calculator</h1>
              <p className="text-xs text-muted-foreground">Upload an orders export — get free items, by code.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <Button onClick={downloadReport} variant="default" className="gap-2">
                <Download className="h-4 w-4" /> Download report
              </Button>
            )}
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/admin/invite"><UserPlus className="h-4 w-4" /> Invite user</Link>
              </Button>
            )}
            {user && (
              <Button onClick={signOut} variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* UPLOAD */}
        <Card className="border-dashed shadow-card">
          <CardContent className="p-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="flex flex-col items-center justify-center gap-3 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-medium">
                  {fileName ? <>Loaded <span className="text-primary">{fileName}</span></> : "Drop your orders export here"}
                </p>
                <p className="text-sm text-muted-foreground">.xlsx or .csv — we'll find the orders sheet automatically</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {busy ? "Reading…" : fileName ? "Replace file" : "Choose file"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <>
            {/* TOTALS */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Orders with codes" value={totals.orders.toString()} />
              <StatCard label="Free units" value={totals.freeUnits.toString()} />
              <StatCard label="Chargeback value" value={fmtGBP(totals.freeValue)} accent />
              <StatCard label="Discount on file" value={fmtGBP(totals.discount)} muted />
            </div>

            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
                <TabsTrigger value="rules">Deal rules</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
              </TabsList>

              {/* RESULTS */}
              <TabsContent value="results" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Per-order breakdown</CardTitle>
                    <CardDescription>Sorted by chargeback value. Click an order in the Exceptions tab to lift its 2-use cap.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Codes</TableHead>
                          <TableHead className="text-right">IVG qty</TableHead>
                          <TableHead className="text-right">Pods qty</TableHead>
                          <TableHead className="text-right">Free units</TableHead>
                          <TableHead className="text-right">Chargeback</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((r) => (
                          <TableRow key={r.orderId}>
                            <TableCell className="font-mono text-sm">
                              {r.orderId}
                              {r.uncapped && (
                                <Badge variant="secondary" className="ml-2 bg-warning/15 text-warning-foreground border-warning/30">
                                  uncapped
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[280px]">
                              <div className="flex flex-wrap gap-1">
                                {r.codes.map((c, i) => (
                                  <Badge key={i} variant="outline" className="font-mono text-[10px]">
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{r.ivgDealsQty}</TableCell>
                            <TableCell className="text-right">{r.promoPodsQty}</TableCell>
                            <TableCell className="text-right font-medium">
                              {r.cappedFreeUnits}
                              {r.rawFreeUnits !== r.cappedFreeUnits && (
                                <span className="text-xs text-muted-foreground"> / {r.rawFreeUnits}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">{fmtGBP(r.freeValue)}</TableCell>
                            <TableCell>
                              {r.notes.length > 0 && (
                                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 text-warning shrink-0" />
                                  <span>{r.notes.join(" • ")}</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXCEPTIONS */}
              <TabsContent value="exceptions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Uncapped orders</CardTitle>
                    <CardDescription>
                      The 2-uses-per-order cap applies by default. Toggle any orders that should be uncapped.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[480px] overflow-y-auto pr-2">
                      {allOrderIds.map((id) => (
                        <label
                          key={id}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <span className="font-mono text-sm truncate">{id}</span>
                          <Switch
                            checked={uncapped.has(id)}
                            onCheckedChange={() => toggleUncapped(id)}
                          />
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* RULES */}
              <TabsContent value="rules" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Deal rules</CardTitle>
                      <CardDescription>Edit only if the deal mechanics change.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setRules(DEFAULT_RULES)} className="gap-2">
                      <Settings2 className="h-4 w-4" /> Reset
                    </Button>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Buy qty</TableHead>
                          <TableHead>From collection</TableHead>
                          <TableHead>Free qty</TableHead>
                          <TableHead>Free collection</TableHead>
                          <TableHead>Max uses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.code}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={r.buyQty}
                                onChange={(e) =>
                                  setRules((rs) => rs.map((x, j) => (j === i ? { ...x, buyQty: +e.target.value } : x)))
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                value={r.buyCollection}
                                onChange={(e) =>
                                  setRules((rs) =>
                                    rs.map((x, j) => (j === i ? { ...x, buyCollection: e.target.value as any } : x))
                                  )
                                }
                                className="rounded-md border bg-background px-2 py-1 text-sm"
                              >
                                <option value="IVG_DEALS">IVG Deals</option>
                                <option value="ANY">Any</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={r.freeQty}
                                onChange={(e) =>
                                  setRules((rs) => rs.map((x, j) => (j === i ? { ...x, freeQty: +e.target.value } : x)))
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                value={r.freeCollection}
                                onChange={(e) =>
                                  setRules((rs) =>
                                    rs.map((x, j) => (j === i ? { ...x, freeCollection: e.target.value as any } : x))
                                  )
                                }
                                className="rounded-md border bg-background px-2 py-1 text-sm"
                              >
                                <option value="IVG_DEALS">IVG Deals</option>
                                <option value="PROMO_PODS">Promo Pods</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={r.maxUses}
                                onChange={(e) =>
                                  setRules((rs) => rs.map((x, j) => (j === i ? { ...x, maxUses: +e.target.value } : x)))
                                }
                                className="w-20"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* COLLECTIONS */}
              <TabsContent value="collections" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Product collections</CardTitle>
                      <CardDescription>
                        One keyword or SKU per line. Matches anywhere in product name or SKU (case-insensitive).
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCollections(DEFAULT_COLLECTIONS)} className="gap-2">
                      <Settings2 className="h-4 w-4" /> Reset
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>IVG Deals collection</Label>
                      <Textarea
                        rows={10}
                        value={collections.ivgDeals.join("\n")}
                        onChange={(e) =>
                          setCollections((c) => ({ ...c, ivgDeals: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Promo Pods collection</Label>
                      <Textarea
                        rows={10}
                        value={collections.promoPods.join("\n")}
                        onChange={(e) =>
                          setCollections((c) => ({ ...c, promoPods: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {diagnostics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What we found in your file</CardTitle>
              <CardDescription>
                Use this to confirm the orders sheet was read correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Rows parsed</p>
                <p className="text-xl font-semibold">{diagnostics.totalLines}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Orders</p>
                <p className="text-xl font-semibold">{diagnostics.orderCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Product lines</p>
                <p className="text-xl font-semibold">{diagnostics.productLines}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Discount lines</p>
                <p className="text-xl font-semibold">{diagnostics.discountLines}</p>
              </div>
              <div className="md:col-span-4 space-y-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Discount codes detected ({diagnostics.codesFound.length})
                </p>
                {diagnostics.codesFound.length === 0 ? (
                  <p className="text-muted-foreground">
                    No discount codes were found. Check that your export includes a "Line: Type" column
                    with "Discount" rows and a "Line: Name" column with the code.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {diagnostics.matched.map((c) => (
                      <Badge key={c} variant="default" className="font-mono text-[10px]">
                        ✓ {c}
                      </Badge>
                    ))}
                    {diagnostics.unmatched.map((c) => (
                      <Badge
                        key={c}
                        variant="outline"
                        className="font-mono text-[10px] border-warning/50 text-warning-foreground"
                      >
                        ? {c}
                      </Badge>
                    ))}
                  </div>
                )}
                {diagnostics.unmatched.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Codes marked "?" aren't in your Deal rules tab — add them to include those orders.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!results.length && lines.length > 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No orders matched any of your deal codes. See the diagnostics above and check the Deal rules tab.
            </CardContent>
          </Card>
        )}

        {lines.length === 0 && fileName && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              The file loaded but no rows were detected. The orders sheet may use unexpected column names —
              expected columns include "Name" (order ID), "Line: Type", "Line: Name", "Line: Quantity", "Line: Price".
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) => (
  <Card className="shadow-card">
    <CardContent className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          accent ? "text-primary" : muted ? "text-muted-foreground" : ""
        }`}
      >
        {value}
      </p>
    </CardContent>
  </Card>
);

export default Index;
