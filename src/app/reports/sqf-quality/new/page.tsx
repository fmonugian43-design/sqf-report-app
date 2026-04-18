"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/format";

type Step = "product" | "details" | "ingredients";

interface Recipe {
  id: number;
  name: string;
  recipeType: string;
  finishedItemId: number | null;
  finishedItemName: string | null;
}

interface FinishedProduct {
  finishedItemName: string;
  finishedItemId: number;
  mixRecipeIds: number[]; // only mix recipe IDs (raw ingredients)
}

interface Ingredient {
  itemName: string;
  unit: string;
  sortOrder: number;
  parentRecipe: string | null;
}

const CATEGORIES: { label: string; match: (name: string) => boolean }[] = [
  { label: "Cups", match: (name) => /cup|margarita rim/i.test(name) },
  { label: "Dips", match: (name) => /dip/i.test(name) },
  { label: "Rounders", match: (name) => /rounder/i.test(name) },
  { label: "Bottles", match: (name) => /bottle|25oz|margarita/i.test(name) },
  { label: "Bags", match: (name) => /bag|gallon|liter/i.test(name) },
  { label: "Shakers", match: (name) => /shaker/i.test(name) },
];

export default function SQFQualityPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("product");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Step 1 - Product
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesError, setRecipesError] = useState("");
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FinishedProduct | null>(null);

  // Ingredients (fetched on recipe select)
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);

  // Step 2 - Details
  const [productLotCode, setProductLotCode] = useState("");
  const [hotFill, setHotFill] = useState<"yes" | "no" | "">("");
  const [reportDate, setReportDate] = useState(todayISO());
  const [expirationDate, setExpirationDate] = useState("");
  const [operatorName, setOperatorName] = useState("");
  // Step 3 - Ingredient lot codes
  const [ingredientLotCodes, setIngredientLotCodes] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Fetch recipes on mount
  useEffect(() => {
    setRecipesLoading(true);
    fetch("/api/sqf-quality/recipes")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setRecipes(data);
        setRecipesLoading(false);
      })
      .catch(() => {
        setRecipesError("Could not load recipes from inventory app");
        setRecipesLoading(false);
      });
  }, []);

  // Fetch ingredients from all recipes for a finished product (deduped by name)
  const fetchIngredients = async (recipeIds: number[]) => {
    setIngredientsLoading(true);
    try {
      const allIngredients: Ingredient[] = [];
      const seen = new Set<string>();
      for (const rid of recipeIds) {
        const res = await fetch(`/api/sqf-quality/ingredients/${rid}`);
        if (!res.ok) continue;
        const data: Ingredient[] = await res.json();
        for (const ing of data) {
          if (!seen.has(ing.itemName)) {
            seen.add(ing.itemName);
            allIngredients.push({ ...ing, sortOrder: allIngredients.length });
          }
        }
      }
      setIngredients(allIngredients);
      setIngredientLotCodes(new Array(allIngredients.length).fill(""));
    } catch {
      showToast("Could not load ingredients");
      setIngredients([]);
      setIngredientLotCodes([]);
    } finally {
      setIngredientsLoading(false);
    }
  };

  // Group recipes by finished product — only keep mix recipe IDs for ingredients
  const productMap = new Map<number, FinishedProduct>();
  for (const r of recipes) {
    if (!r.finishedItemId || !r.finishedItemName) continue;
    if (r.name.toLowerCase() === "test") continue;
    const existing = productMap.get(r.finishedItemId);
    if (existing) {
      if (r.recipeType === "mix") existing.mixRecipeIds.push(r.id);
    } else {
      productMap.set(r.finishedItemId, {
        finishedItemName: r.finishedItemName,
        finishedItemId: r.finishedItemId,
        mixRecipeIds: r.recipeType === "mix" ? [r.id] : [],
      });
    }
  }
  const finishedProducts = Array.from(productMap.values());

  // Categorize by finished product name
  const categorizedProducts: { label: string; products: FinishedProduct[] }[] = CATEGORIES.map((cat) => ({
    label: cat.label,
    products: [],
  }));
  const otherProducts: FinishedProduct[] = [];

  for (const product of finishedProducts) {
    const catIdx = CATEGORIES.findIndex((cat) => cat.match(product.finishedItemName));
    if (catIdx >= 0) {
      categorizedProducts[catIdx].products.push(product);
    } else {
      otherProducts.push(product);
    }
  }

  const filteredCategories = categorizedProducts.filter((c) => c.products.length > 0);
  if (otherProducts.length > 0) {
    filteredCategories.push({ label: "Other", products: otherProducts });
  }

  const stepIndex = step === "product" ? 0 : step === "details" ? 1 : 2;

  const goToDetails = () => {
    if (!selectedProduct) {
      showToast("Select a product");
      return;
    }
    setStep("details");
  };

  const goToIngredients = () => {
    if (!productLotCode.trim()) { showToast("Enter lot code"); return; }
    if (!hotFill) { showToast("Select Hot Fill"); return; }
    if (!expirationDate) { showToast("Enter expiration date"); return; }
    if (!operatorName.trim()) { showToast("Enter operator name"); return; }
    setStep("ingredients");
  };

  const allLotCodesFilled = ingredientLotCodes.every((c) => c.trim() !== "");

  const handleSubmit = async () => {
    if (!allLotCodesFilled) {
      showToast("Enter all ingredient lot codes");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "sqf-quality",
          companyReceiving: selectedProduct!.finishedItemName,
          reportDate,
          lastLotCode: productLotCode.trim(),
          hotFill: hotFill === "yes" ? "Yes" : "No",
          expirationDate,
          operatorName: operatorName.trim(),
          items: ingredients.map((ing, idx) => ({
            productName: ing.itemName,
            lotCode: ingredientLotCodes[idx].trim(),
          })),
        }),
      });

      const data = await res.json();
      router.push(`/reports/${data.id}`);
    } catch {
      showToast("Failed to save");
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-8">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-white px-6 py-3 rounded-xl z-50 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      {/* Recipe Picker Modal */}
      {showRecipePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h2 className="text-lg font-bold">Select Product</h2>
              <button
                type="button"
                onClick={() => setShowRecipePicker(false)}
                className="text-muted text-sm font-medium"
              >
                Cancel
              </button>
            </div>
            <div className="overflow-y-auto p-3 pb-6">
              {filteredCategories.map((category) => (
                <div key={category.label} className="mb-3">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide px-2 mb-1">
                    {category.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {category.products.map((product) => (
                      <button
                        key={product.finishedItemId}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowRecipePicker(false);
                          fetchIngredients(product.mixRecipeIds);
                        }}
                        className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedProduct?.finishedItemId === product.finishedItemId
                            ? "bg-violet-600 text-white"
                            : "active:bg-gray-100"
                        }`}
                      >
                        <p className="font-medium">{product.finishedItemName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            if (step === "ingredients") setStep("details");
            else if (step === "details") setStep("product");
            else router.back();
          }}
          className="text-violet-600 font-medium flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold">SQF Quality</h1>
        <div className="w-12" />
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-violet-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Product */}
      {step === "product" && (
        <div>
          <h2 className="text-lg font-bold mb-4">What product was produced?</h2>

          {recipesLoading && (
            <div className="text-center py-8">
              <p className="text-muted">Loading products...</p>
            </div>
          )}

          {recipesError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700 text-sm font-medium">{recipesError}</p>
              <button type="button" onClick={() => window.location.reload()} className="text-red-600 text-sm font-semibold mt-2">
                Retry
              </button>
            </div>
          )}

          {!recipesLoading && !recipesError && (
            <>
              <button
                type="button"
                onClick={() => setShowRecipePicker(true)}
                className={`w-full text-left border rounded-xl px-4 py-3 text-base mb-6 ${
                  selectedProduct
                    ? "bg-violet-50 border-violet-300 text-violet-800 font-medium"
                    : "bg-card border-border text-gray-400"
                }`}
              >
                {selectedProduct ? selectedProduct.finishedItemName : "Select Product"}
              </button>

              {ingredientsLoading && (
                <p className="text-sm text-muted text-center">Loading ingredients...</p>
              )}

              {selectedProduct && !ingredientsLoading && ingredients.length > 0 && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-6">
                  <p className="text-xs font-bold text-violet-600 uppercase mb-2">
                    {ingredients.length} Ingredients
                  </p>
                  <div className="space-y-1">
                    {ingredients.map((ing, idx) => (
                      <p key={idx} className="text-sm text-violet-800">
                        {ing.parentRecipe && (
                          <span className="text-violet-500 text-xs mr-1">({ing.parentRecipe})</span>
                        )}
                        {ing.itemName}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={goToDetails}
                disabled={!selectedProduct || ingredientsLoading}
                className="w-full bg-violet-600 text-white rounded-2xl py-4 text-lg font-semibold active:opacity-90 transition-opacity disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Product Details */}
      {step === "details" && (
        <div>
          <h2 className="text-lg font-bold mb-1">{selectedProduct?.finishedItemName}</h2>
          <p className="text-sm text-muted mb-4">Enter product details</p>

          <div className="space-y-4">
            {/* Lot Code */}
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Lot Code # *</label>
              <input
                type="text"
                value={productLotCode}
                onChange={(e) => setProductLotCode(e.target.value)}
                placeholder="Enter lot code"
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
              />
            </div>

            {/* Hot Fill Toggle */}
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Hot Fill? *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHotFill("yes")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-base transition-colors ${
                    hotFill === "yes"
                      ? "bg-violet-600 text-white"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHotFill("no")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-base transition-colors ${
                    hotFill === "no"
                      ? "bg-violet-600 text-white"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Date *</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
              />
            </div>

            {/* Expiration Date */}
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Expiration Date *</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "9 Mo", months: 9 },
                  { label: "1 Yr", months: 12 },
                  { label: "18 Mo", months: 18 },
                  { label: "2 Yr", months: 24 },
                ].map((opt) => {
                  const d = new Date(reportDate);
                  d.setMonth(d.getMonth() + opt.months);
                  const val = d.toISOString().split("T")[0];
                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setExpirationDate(val)}
                      className={`py-2 rounded-lg font-semibold text-sm transition-colors ${
                        expirationDate === val
                          ? "bg-violet-600 text-white"
                          : "bg-card border border-border text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {expirationDate && (
                <p className="text-xs text-muted mt-1.5 text-center">{expirationDate}</p>
              )}
            </div>

            {/* Operator */}
            <div>
              <label className="text-sm font-medium text-muted mb-1 block">Operator in Charge *</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Who is in charge?"
                className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
              />
            </div>

            <button
              type="button"
              onClick={goToIngredients}
              className="w-full bg-violet-600 text-white rounded-2xl py-4 text-lg font-semibold active:opacity-90 transition-opacity mt-2"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ingredient Lot Codes */}
      {step === "ingredients" && (
        <div>
          <h2 className="text-lg font-bold mb-1">Ingredient Lot Codes</h2>
          <p className="text-sm text-muted mb-4">
            {ingredientLotCodes.filter((c) => c.trim()).length} of {ingredients.length} entered
          </p>

          <div className="space-y-3">
            {ingredients.map((ing, idx) => {
              // Show group header for first ingredient in a sub-recipe group
              const showGroupHeader =
                ing.parentRecipe &&
                (idx === 0 || ingredients[idx - 1].parentRecipe !== ing.parentRecipe);

              return (
                <div key={idx}>
                  {showGroupHeader && (
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-wide mt-4 mb-2">
                      From: {ing.parentRecipe}
                    </p>
                  )}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {ing.itemName}
                    </label>
                    <input
                      type="text"
                      value={ingredientLotCodes[idx] || ""}
                      onChange={(e) => {
                        const updated = [...ingredientLotCodes];
                        updated[idx] = e.target.value;
                        setIngredientLotCodes(updated);
                      }}
                      placeholder="Lot code"
                      className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {ingredients.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-700 text-sm">No ingredients found for this recipe. You can still submit.</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || (ingredients.length > 0 && !allLotCodesFilled)}
            className="w-full bg-violet-600 text-white rounded-2xl py-5 text-xl font-semibold active:opacity-90 transition-opacity disabled:opacity-50 mt-6"
          >
            {saving ? "Saving..." : "Submit Report"}
          </button>
        </div>
      )}
    </div>
  );
}
