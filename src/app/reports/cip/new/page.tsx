"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/format";

interface Machine {
  id: string;
  name: string;
  steps: string[];
  eitherOrGroups?: number[][]; // groups of step indices where only one needs to be checked
}

const MACHINES: Machine[] = [
  {
    id: "kettle-500-filler-specialties",
    name: "Kettle 500 gal & Filler Specialties",
    steps: [
      "Filled kettle with 140° water to top",
      "Added CIP",
      "Ran for 1.5 hours and drained",
      "Ran for 4.5 hours and drained",
      "Refilled with 140° water",
      "Rinsed and drained",
      "Sprayed with Sani 10",
      "Removed all valves, cleaned, disinfected, and replaced",
    ],
    eitherOrGroups: [[2, 3]], // steps at index 2 and 3 are either/or
  },
  {
    id: "kettle-300",
    name: "Kettle - 300 gal",
    steps: [
      "Filled kettle with 140° water to top",
      "Added CIP",
      "Ran for 1.5 hours and drained",
      "Refilled with 140° water",
      "Rinsed and drained",
      "Sprayed with Sani 10",
    ],
  },
  {
    id: "filler-packline-410",
    name: "Filler - Packline (410)",
    steps: [
      "Disassembled",
      "Washed filler, pump, and hose with 140° water",
      "Rinsed",
      "Reassembled",
      "Sprayed Sani 10 on equipment",
    ],
  },
  {
    id: "filler-packline-510",
    name: "Filler - Packline (510)",
    steps: [
      "Disassembled",
      "Washed filler, pump, and hose with 140° water",
      "Rinsed",
      "Reassembled",
      "Sprayed Sani 10 on equipment",
    ],
  },
  {
    id: "filler-liquid-bagger-1",
    name: "Filler - Liquid Bagger #1",
    steps: [
      "Rinsed with 140° water",
      "Added Sani 10",
      "Ran for 20 minutes",
      "Disassemble, wash, and reassemble",
    ],
  },
  {
    id: "filler-liquid-bagger-2",
    name: "Filler - Liquid Bagger #2",
    steps: [
      "Rinsed with 140° water",
      "Added Sani 10",
      "Ran for 20 minutes",
      "Disassemble, wash, and reassemble",
    ],
  },
  {
    id: "filler-liquid-bagger-3",
    name: "Filler - Liquid Bagger #3",
    steps: [
      "Rinsed with 140° water",
      "Added Sani 10",
      "Ran for 20 minutes",
      "Disassemble, wash, and reassemble",
    ],
  },
  {
    id: "filler-liquid-bagger-4",
    name: "Filler - Liquid Bagger #4",
    steps: [
      "Rinsed with 140° water",
      "Added Sani 10",
      "Ran for 20 minutes",
      "Disassemble, wash, and reassemble",
    ],
  },
];

type Step = "machine" | "checklist" | "confirm";

export default function NewCIPReportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("machine");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [operatorName, setOperatorName] = useState("");
  const [reportDate, setReportDate] = useState(todayISO());
  const [lastLotCode, setLastLotCode] = useState("");
  const [cleaningProducts, setCleaningProducts] = useState<string[]>([]);
  const [signature, setSignature] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const CLEANING_PRODUCTS = ["Sani 10%", "CIP 400", "Bleach"];

  const toggleProduct = (product: string) => {
    setCleaningProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  };

  const selectMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setChecked(new Array(machine.steps.length).fill(false));
    setStep("checklist");
  };

  const getEitherOrGroup = (index: number): number[] | null => {
    if (!selectedMachine?.eitherOrGroups) return null;
    return selectedMachine.eitherOrGroups.find((g) => g.includes(index)) || null;
  };

  const toggleStep = (index: number) => {
    const group = getEitherOrGroup(index);
    setChecked((prev) => {
      const updated = [...prev];
      if (group) {
        // Radio behavior: uncheck others in the group, toggle this one
        group.forEach((i) => {
          if (i !== index) updated[i] = false;
        });
      }
      updated[index] = !updated[index];
      return updated;
    });
  };

  const allRequiredChecked = () => {
    if (checked.length === 0) return false;
    const eitherOrIndices = new Set(
      (selectedMachine?.eitherOrGroups || []).flat()
    );
    // All non-either/or steps must be checked
    for (let i = 0; i < checked.length; i++) {
      if (!eitherOrIndices.has(i) && !checked[i]) return false;
    }
    // At least one in each either/or group must be checked
    for (const group of selectedMachine?.eitherOrGroups || []) {
      if (!group.some((i) => checked[i])) return false;
    }
    return true;
  };

  const goToConfirm = () => {
    if (!allRequiredChecked()) {
      showToast("Complete all steps before continuing");
      return;
    }
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!operatorName.trim()) {
      showToast("Enter operator name");
      return;
    }
    if (!selectedMachine) return;
    setSaving(true);

    try {
      const processDescription = selectedMachine.steps
        .filter((_, i) => checked[i])
        .map((s, i) => `${i + 1}. ${s} ✓`)
        .join("\n");

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "cip",
          companyReceiving: selectedMachine.name,
          reportDate,
          operatorName: operatorName.trim(),
          signature: signature.trim(),
          machineName: selectedMachine.name,
          lastLotCode: lastLotCode.trim(),
          cleaningProduct: cleaningProducts.join(", "),
          processUsed: processDescription,
          items: [],
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

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-white px-6 py-3 rounded-xl z-50 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {["machine", "checklist", "confirm"].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s === step || (s === "machine" && step !== "machine") || (s === "checklist" && step === "confirm")
                ? "bg-amber-600"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Select Machine */}
      {step === "machine" && (
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
            <h1 className="text-xl font-bold">Select Machine</h1>
            <div className="w-12" />
          </div>

          <p className="text-sm text-muted mb-4">Which machine was cleaned?</p>

          <div className="space-y-2">
            {MACHINES.map((machine) => (
              <button
                key={machine.id}
                type="button"
                onClick={() => selectMachine(machine)}
                className="w-full text-left bg-card border border-border rounded-xl px-4 py-4 active:bg-gray-50 transition-colors"
              >
                <p className="font-semibold">{machine.name}</p>
                <p className="text-xs text-muted mt-0.5">{machine.steps.length} steps</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Checklist + Info */}
      {step === "checklist" && selectedMachine && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setStep("machine")}
              className="text-primary font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold">CIP Checklist</h1>
            <button
              type="button"
              onClick={goToConfirm}
              className={`font-semibold ${allRequiredChecked() ? "text-primary" : "text-muted"}`}
            >
              Next
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <p className="font-semibold text-amber-800">{selectedMachine.name}</p>
          </div>

          {/* Info fields */}
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Operator *</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Operator name"
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-base bg-card"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-base bg-card"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Last Lot Code Used on Equipment</label>
              <input
                type="text"
                value={lastLotCode}
                onChange={(e) => setLastLotCode(e.target.value)}
                placeholder="Enter last lot code"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-base bg-card"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Product(s) Used to Clean</label>
              <div className="flex gap-2">
                {CLEANING_PRODUCTS.map((product) => (
                  <button
                    key={product}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      cleaningProducts.includes(product)
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-card border-border text-foreground"
                    }`}
                  >
                    {product}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <p className="text-sm font-semibold mb-3">Cleaning Procedures:</p>

          <div className="space-y-2">
            {selectedMachine.steps.map((stepText, idx) => {
              const group = getEitherOrGroup(idx);
              const isEitherOr = !!group;
              const isFirstInGroup = isEitherOr && group![0] === idx;
              const isSecondInGroup = isEitherOr && group![0] !== idx;

              return (
                <div key={idx}>
                  {isSecondInGroup && (
                    <div className="flex items-center gap-2 my-1 px-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-bold text-amber-600 uppercase">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  {isFirstInGroup && (
                    <p className="text-xs font-medium text-amber-600 px-4 mb-1">Select one:</p>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleStep(idx)}
                    className={`w-full text-left flex items-start gap-3 rounded-xl px-4 py-4 border transition-colors ${
                      checked[idx]
                        ? "bg-green-50 border-green-300"
                        : isEitherOr
                        ? "bg-amber-50/30 border-amber-200"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className={`mt-0.5 w-6 h-6 ${isEitherOr ? "rounded-full" : "rounded-md"} border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked[idx]
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 bg-white"
                    }`}>
                      {checked[idx] && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted mb-0.5">Step {idx + 1}</p>
                      <p className={`font-medium ${checked[idx] ? "text-green-800" : ""}`}>{stepText}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted">
              {checked.filter(Boolean).length} of {checked.length} completed
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm & Submit */}
      {step === "confirm" && selectedMachine && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setStep("checklist")}
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

          {/* Summary */}
          <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-amber-50">
              <p className="font-semibold text-amber-800">{selectedMachine.name}</p>
            </div>
            <div className="px-4 py-3">
              {selectedMachine.steps.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-green-500 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <p className="text-sm">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info summary */}
          <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50">
              <p className="font-semibold">Report Info</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-muted">Operator</p>
                <p className="text-sm font-medium">{operatorName}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted">Date</p>
                <p className="text-sm font-medium">{reportDate}</p>
              </div>
              {lastLotCode && (
                <div className="flex justify-between">
                  <p className="text-sm text-muted">Last Lot Code</p>
                  <p className="text-sm font-medium">{lastLotCode}</p>
                </div>
              )}
              {cleaningProducts.length > 0 && (
                <div className="flex justify-between">
                  <p className="text-sm text-muted">Cleaning Product(s)</p>
                  <p className="text-sm font-medium">{cleaningProducts.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="mb-6">
            <label className="text-sm font-medium text-muted mb-1 block">Signature</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type name as signature"
              className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card italic"
              autoFocus
            />
          </div>

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
