import Link from "next/link";

export default function HomePage() {
  return (
    <div className="px-4 pt-12 flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-3xl font-bold text-center mb-2">SQF Reports</h1>
      <p className="text-muted text-center mb-12">Safe Quality Food Reporting</p>

      <div className="w-full space-y-4">
        <button
          disabled
          className="flex items-center justify-center gap-3 w-full bg-gray-100 border-2 border-border rounded-2xl py-6 text-xl font-semibold text-muted cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Incoming Report
        </button>

        <Link
          href="/reports/outgoing/new"
          className="flex items-center justify-center gap-3 w-full bg-primary text-white rounded-2xl py-6 text-xl font-semibold active:bg-primary-dark transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Outgoing Report
        </Link>
      </div>

      <p className="text-xs text-muted mt-8 text-center">Incoming reports coming soon</p>
    </div>
  );
}
