"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/format";

interface Recipe {
  id: number;
  name: string;
  recipeType: string;
  finishedItemId: number | null;
}

interface Shortage {
  itemName: string;
  required: number;
  available: number;
  unit: string;
}

export default function NewProductionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesError, setRecipesError] = useState("");
  const [showRecipePicker, setShowRecipePicker] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [lbs, setLbs] = useState("");
  const [reportDate, setReportDate] = useState(todayISO());
  const [operatorName, setOperatorName] = useState("");

  const [shortages, setShortages] = useState<Shortage[]>([]);
  const [showShortageWarning, setShowShortageWarning] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    setRecipesLoading(true);
    fetch("/api/production/recipes")
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

  // Deduplicate by name, keep first occurrence
  const seen = new Set<string>();
  const mixRecipes = recipes.filter((r) => {
    if (r.recipeType !== "mix") return false;
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });

  const MIX_CATEGORIES: { label: string; match: (name: string) => boolean }[] = [
    { label: "Cups", match: (name) => /cup|chili rim mix|chili cup/i.test(name) },
    { label: "Dips", match: (name) => /dip/i.test(name) },
    { label: "Rounders", match: (name) => /rounder/i.test(name) },
    { label: "Bottles", match: (name) => /bottle|prep|preparado|syrup|margarita/i.test(name) },
  ];

  const categorizedRecipes: { label: string; recipes: Recipe[] }[] = MIX_CATEGORIES.map((cat) => ({
    label: cat.label,
    recipes: [],
  }));
  const otherRecipes: Recipe[] = [];

  for (const recipe of mixRecipes) {
    if (recipe.name.toLowerCase() === "test") continue;
    const catIdx = MIX_CATEGORIES.findIndex((cat) => cat.match(recipe.name));
    if (catIdx >= 0) {
      categorizedRecipes[catIdx].recipes.push(recipe);
    } else {
      otherRecipes.push(recipe);
    }
  }

  const filteredCategories = categorizedRecipes.filter((c) => c.recipes.length > 0);
  if (otherRecipes.length > 0) {
    filteredCategories.push({ label: "Other", recipes: otherRecipes });
  }

  const handleSubmit = async (forceBypass = false) => {
    if (!selectedRecipe) {
      showToast("Select a recipe");
      return;
    }
    if (!lbs.trim()) {
      showToast("Enter pounds");
      return;
    }
    if (!operatorName.trim()) {
      showToast("Who made the batch?");
      return;
    }
    setSaving(true);
    setShowShortageWarning(false);

    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeName: selectedRecipe.name,
          recipeType: selectedRecipe.recipeType,
          finishedItemId: selectedRecipe.finishedItemId,
          lbs: lbs.trim(),
          reportDate,
          operatorName: operatorName.trim(),
          forceBypass,
        }),
      });

      const data = await res.json();

      if (data.inventoryError && data.shortages && !forceBypass) {
        setShortages(data.shortages);
        setShowShortageWarning(true);
        setSaving(false);
        return;
      }

      if (data.inventoryError && !data.shortages) {
        showToast(data.message || "Inventory sync failed — saved locally");
      }

      router.push(`/reports/${data.report.id}`);
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
              <h2 className="text-lg font-bold">Select Recipe</h2>
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
                    {category.recipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setShowRecipePicker(false);
                          setLbs("");
                        }}
                        className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedRecipe?.id === recipe.id
                            ? "bg-emerald-600 text-white"
                            : "active:bg-gray-100"
                        }`}
                      >
                        <p className="font-medium">{recipe.name}</p>
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
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-emerald-600 font-medium flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold">Production</h1>
        <div className="w-12" />
      </div>

      {recipesLoading && (
        <div className="text-center py-8">
          <p className="text-muted">Loading recipes...</p>
        </div>
      )}

      {recipesError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm font-medium">{recipesError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-red-600 text-sm font-semibold mt-2"
          >
            Retry
          </button>
        </div>
      )}

      {!recipesLoading && !recipesError && (
        <div className="space-y-4">
          {/* Recipe */}
          <div>
            <label className="text-sm font-medium text-muted mb-1 block">Recipe *</label>
            <button
              type="button"
              onClick={() => setShowRecipePicker(true)}
              className={`w-full text-left border rounded-xl px-4 py-3 text-base ${
                selectedRecipe
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                  : "bg-card border-border text-gray-400"
              }`}
            >
              {selectedRecipe ? selectedRecipe.name : "Select Recipe"}
            </button>
          </div>

          {/* Pounds */}
          <div>
            <label className="text-sm font-medium text-muted mb-1 block">Pounds (lbs) *</label>
            <input
              type="number"
              inputMode="decimal"
              value={lbs}
              onChange={(e) => setLbs(e.target.value)}
              placeholder="Enter total lbs"
              className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-muted mb-1 block">Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
            />
          </div>

          {/* Operator */}
          <div>
            <label className="text-sm font-medium text-muted mb-1 block">Who made the batch? *</label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Who made the batch?"
              className="w-full border border-border rounded-xl px-4 py-3 text-base bg-card"
            />
          </div>

          {/* Shortage Warning */}
          {showShortageWarning && shortages.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 bg-amber-100">
                <p className="font-semibold text-amber-800">Insufficient Stock</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {shortages.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <p className="text-amber-900">{s.itemName}</p>
                    <p className="text-amber-700 font-medium">
                      Need {s.required} / Have {s.available} {s.unit}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                  className="w-full bg-amber-600 text-white rounded-xl py-3 font-semibold"
                >
                  {saving ? "Saving..." : "Submit Anyway"}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          {!showShortageWarning && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="w-full bg-emerald-600 text-white rounded-2xl py-5 text-xl font-semibold active:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {saving ? "Saving..." : "Submit Production"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
