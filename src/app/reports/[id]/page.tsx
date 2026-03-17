"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";

interface ReportDetail {
  id: number;
  reportType: string;
  companyReceiving: string;
  reportDate: string;
  receivingMethod: string;
  invoiceNumber: string;
  poNumber: string;
  operatorName: string;
  signature: string;
  items: Array<{
    productName: string;
    lotCode: string;
    quantity: string;
    condition: string;
  }>;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then((r) => r.json())
      .then(setReport)
      .catch(() => {});
  }, [params.id]);

  if (!report) {
    return (
      <div className="px-4 pt-4">
        <p className="text-muted text-center py-12">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
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
        <h1 className="text-xl font-bold">Report #{report.id}</h1>
        <div className="w-12" />
      </div>

      <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-gray-50">
          <p className="font-semibold">SQF Outgoing Report</p>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between">
            <p className="text-sm text-muted">Company</p>
            <p className="text-sm font-medium">{report.companyReceiving}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted">Date</p>
            <p className="text-sm font-medium">{formatDate(report.reportDate)}</p>
          </div>
          {report.receivingMethod && (
            <div className="flex justify-between">
              <p className="text-sm text-muted">Method</p>
              <p className="text-sm font-medium">{report.receivingMethod}</p>
            </div>
          )}
          {report.invoiceNumber && (
            <div className="flex justify-between">
              <p className="text-sm text-muted">Invoice #</p>
              <p className="text-sm font-medium">{report.invoiceNumber}</p>
            </div>
          )}
          {report.poNumber && (
            <div className="flex justify-between">
              <p className="text-sm text-muted">PO #</p>
              <p className="text-sm font-medium">{report.poNumber}</p>
            </div>
          )}
          <div className="flex justify-between">
            <p className="text-sm text-muted">Operator</p>
            <p className="text-sm font-medium">{report.operatorName}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-gray-50">
          <p className="font-semibold">Products ({report.items.length})</p>
        </div>
        {report.items.map((item, idx) => (
          <div key={idx} className="px-4 py-3 border-b border-border last:border-b-0">
            <p className="font-medium">{item.productName}</p>
            <div className="flex gap-4 mt-1">
              {item.lotCode && <p className="text-xs text-muted">Lot: {item.lotCode}</p>}
              {item.quantity && <p className="text-xs text-muted">Qty: {item.quantity}</p>}
              {item.condition && <p className="text-xs text-muted">Condition: {item.condition}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
