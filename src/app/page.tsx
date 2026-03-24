import Link from "next/link";

export default function HomePage() {
  return (
    <div className="px-4 pt-12 flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-3xl font-bold text-center mb-2">SQF Reports</h1>
      <p className="text-muted text-center mb-12">Safe Quality Food Reporting</p>

      <div className="w-full space-y-4">
        <Link
          href="/reports/incoming/new"
          className="flex items-center justify-center gap-3 w-full bg-primary text-white rounded-2xl py-6 text-xl font-semibold active:opacity-90 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Incoming Report
        </Link>

        <Link
          href="/reports/outgoing/new"
          className="flex items-center justify-center gap-3 w-full bg-primary text-white rounded-2xl py-6 text-xl font-semibold active:opacity-90 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Outgoing Report
        </Link>

        <Link
          href="/reports/cip/new"
          className="flex items-center justify-center gap-3 w-full bg-amber-600 text-white rounded-2xl py-6 text-xl font-semibold active:opacity-90 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          Food Quality (CIP)
        </Link>

      </div>
    </div>
  );
}
