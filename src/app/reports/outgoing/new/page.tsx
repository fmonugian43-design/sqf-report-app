"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { todayISO } from "@/lib/format";
import BarcodeScanner from "@/components/BarcodeScanner";

interface ProductEntry {
  productName: string;
  lotCode: string;
  quantity: string;
  condition: string;
}

const emptyProduct = (): ProductEntry => ({
  productName: "",
  lotCode: "",
  quantity: "",
  condition: "",
});

const COMPANIES = [
  "Company 1 (placeholder)",
  "Company 2 (placeholder)",
  "Company 3 (placeholder)",
];

const METHODS = ["Pickup", "Delivered", "Trucking"];

type Step = "header" | "products" | "review";

function NewOutgoingReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("header");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Header fields
  const [companyReceiving, setCompanyReceiving] = useState("");
  const [reportDate, setReportDate] = useState(todayISO());
  const [receivingMethod, setReceivingMethod] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");

  // Products
  const [products, setProducts] = useState<ProductEntry[]>([emptyProduct()]);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);

  // Footer
  const [operatorName, setOperatorName] = useState("");
  const [signature, setSignature] = useState("");

  // Pre-fill from last report
  useEffect(() => {
    const from = searchParams.get("from");
    if (from !== "latest") return;

    setLoading(true);
    fetch("/api/reports/latest")
      .then((r) => {
        if (!r.ok) throw new Error("No reports");
        return r.json();
      })
      .then((data) => {
        setCompanyReceiving(data.companyReceiving || "");
        setReceivingMethod(data.receivingMethod || "");
        setInvoiceNumber(data.invoiceNumber || "");
        setPoNumber(data.poNumber || "");
        setOperatorName(data.operatorName || "");
        setSignature(data.signature || "");
        // Date stays as today
        if (data.items && data.items.length > 0) {
          setProducts(
            data.items.map((item: { productName: string; lotCode: string; quantity: string; condition: string }) => ({
              productName: item.productName || "",
              lotCode: item.lotCode || "",
              quantity: item.quantity || "",
              condition: item.condition || "",
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => {
        showToast("No previous reports found");
        setLoading(false);
      });
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const updateProduct = (index: number, field: keyof ProductEntry, value: string) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, emptyProduct()]);
  };

  const removeProduct = (index: number) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (value: string) => {
    if (scanningIndex !== null) {
      updateProduct(scanningIndex, "productName", value);
      setScanningIndex(null);
    }
  };

  const goToProducts = () => {
    if (!companyReceiving) {
      showToast("Select a company");
      return;
    }
    setStep("products");
  };

  const goToReview = () => {
    const filledProducts = products.filter((p) => p.productName.trim());
    if (filledProducts.length === 0) {
      showToast("Add at least one product");
      return;
    }
    setStep("review");
  };

  const handleSubmit = async () => {
    if (!operatorName.trim()) {
      showToast("Enter operator name");
      return;
    }
    setSaving(true);

    try {
      const filledProducts = products.filter((p) => p.productName.trim());
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "outgoing",
          companyReceiving: companyReceiving.trim(),
          reportDate,
          receivingMethod: receivingMethod.trim(),
          invoiceNumber: invoiceNumber.trim(),
          poNumber: poNumber.trim(),
          operatorName: operatorName.trim(),
          signature: signature.trim(),
          items: filledProducts.map((p) => ({
            productName: p.productName.trim(),
            lotCode: p.lotCode.trim(),
            quantity: p.quantity.trim(),
            condition: p.condition.trim(),
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const report = await res.json();
      router.push(`/reports/${report.id}`);
    } catch {
      showToast("Failed to save report");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-8">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-200" />
          ))}
        </div>
        <p className="text-center text-muted py-12">Loading last report...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-white px-6 py-3 rounded-xl z-50 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scanningIndex !== null && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setScanningIndex(null)}
        />
      )}

      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {["header", "products", "review"].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s === step || (s === "header" && step !== "header") || (s === "products" && step === "review")
                ? "bg-primary"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Header Info */}
      {step === "header" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-primary font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold">Outgoing Report</h1>
            <button
              type="button"
              onClick={goToProducts}
              className="text-primary font-semibold"
            >
              Next
            </button>
          </div>

          <p className="text-sm text-muted mb-6">Fill in the report header information</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Company Receiving Product *</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {COMPANIES.map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => setCompanyReceiving(company)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      companyReceiving === company
                        ? "bg-primary text-white border-primary"
                        : "bg-card border-border active:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium">{company}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Method</label>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setReceivingMethod(method)}
                    className={`px-3 py-3 rounded-xl border text-center font-medium transition-colors ${
                      receivingMethod === method
                        ? "bg-primary text-white border-primary"
                        : "bg-card border-border active:bg-gray-50"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Invoice #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted mb-1 block">PO #</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Enter PO number"
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Products */}
      {step === "products" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setStep("header")}
              className="text-primary font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold">Add Products</h1>
            <button
              type="button"
              onClick={goToReview}
              className="text-primary font-semibold"
            >
              Next
            </button>
          </div>

          <p className="text-sm text-muted mb-4">Add products to the report. Use the scan button to scan barcodes.</p>

          <div className="space-y-4">
            {products.map((product, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-muted">Product {idx + 1}</p>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(idx)}
                      className="text-danger text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Product Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={product.productName}
                      onChange={(e) => updateProduct(idx, "productName", e.target.value)}
                      placeholder="Product name"
                      className="flex-1 border border-border rounded-xl px-3 py-2.5 text-base bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setScanningIndex(idx)}
                      className="px-3 py-2.5 bg-gray-100 border border-border rounded-xl active:bg-gray-200 shrink-0"
                      title="Scan barcode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">Lot Code #</label>
                    <input
                      type="text"
                      value={product.lotCode}
                      onChange={(e) => updateProduct(idx, "lotCode", e.target.value)}
                      placeholder="Lot code"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-base bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted mb-1 block">Quantity</label>
                    <input
                      type="text"
                      value={product.quantity}
                      onChange={(e) => updateProduct(idx, "quantity", e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-base bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Condition</label>
                  <input
                    type="text"
                    value={product.condition}
                    onChange={(e) => updateProduct(idx, "condition", e.target.value)}
                    placeholder="e.g. Good, Damaged"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-base bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addProduct}
            className="w-full mt-4 border-2 border-dashed border-border rounded-xl py-3 text-primary font-semibold active:bg-gray-50"
          >
            + Add Another Product
          </button>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === "review" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setStep("products")}
              className="text-primary font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold">Review & Submit</h1>
            <div className="w-12" />
          </div>

          {/* Report summary */}
          <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50">
              <p className="font-semibold">Report Details</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-muted">Company</p>
                <p className="text-sm font-medium">{companyReceiving}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted">Date</p>
                <p className="text-sm font-medium">{reportDate}</p>
              </div>
              {receivingMethod && (
                <div className="flex justify-between">
                  <p className="text-sm text-muted">Method</p>
                  <p className="text-sm font-medium">{receivingMethod}</p>
                </div>
              )}
              {invoiceNumber && (
                <div className="flex justify-between">
                  <p className="text-sm text-muted">Invoice #</p>
                  <p className="text-sm font-medium">{invoiceNumber}</p>
                </div>
              )}
              {poNumber && (
                <div className="flex justify-between">
                  <p className="text-sm text-muted">PO #</p>
                  <p className="text-sm font-medium">{poNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Products summary */}
          <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50">
              <p className="font-semibold">Products ({products.filter((p) => p.productName.trim()).length})</p>
            </div>
            {products
              .filter((p) => p.productName.trim())
              .map((product, idx) => (
                <div key={idx} className="px-4 py-3 border-b border-border last:border-b-0">
                  <p className="font-medium">{product.productName}</p>
                  <div className="flex gap-4 mt-1">
                    {product.lotCode && <p className="text-xs text-muted">Lot: {product.lotCode}</p>}
                    {product.quantity && <p className="text-xs text-muted">Qty: {product.quantity}</p>}
                    {product.condition && <p className="text-xs text-muted">Condition: {product.condition}</p>}
                  </div>
                </div>
              ))}
          </div>

          {/* Operator info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Operator Accepting Items *</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Enter operator name"
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Signature</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type name as signature"
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card italic"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-success text-white rounded-2xl py-5 text-xl font-semibold active:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Submit Report"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewOutgoingReportPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-4 pb-8">
          <p className="text-center text-muted py-12">Loading...</p>
        </div>
      }
    >
      <NewOutgoingReportForm />
    </Suspense>
  );
}
