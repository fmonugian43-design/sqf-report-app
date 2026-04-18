"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";

interface ReportSummary {
  id: number;
  reportType: string;
  companyReceiving: string;
  reportDate: string;
  itemCount: number;
}

export default function ReportHistoryPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setReports)
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Report History</h1>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted">No reports yet</p>
        </div>
      )}

      <div className="space-y-2">
        {reports.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="block bg-card border border-border rounded-xl p-4 active:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{r.companyReceiving}</p>
                <p className="text-sm text-muted">{formatDate(r.reportDate)}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                  r.reportType === "cip" ? "bg-amber-50 text-amber-700" :
                  r.reportType === "production" ? "bg-emerald-50 text-emerald-700" :
                  r.reportType === "sqf-quality" ? "bg-violet-50 text-violet-700" :
                  "bg-blue-50 text-primary"
                }`}>
                  {r.reportType === "cip" ? "CIP" :
                   r.reportType === "production" ? "Production" :
                   r.reportType === "sqf-quality" ? "SQF Quality" :
                   r.reportType}
                </span>
                <p className="text-sm text-muted mt-1">{r.itemCount} items</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
