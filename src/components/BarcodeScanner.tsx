"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const html5QrCodeRef = useRef<unknown>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const scannerId = "barcode-scanner-region";
        const scanner = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
            onClose();
          },
          () => {}
        );
      } catch (err) {
        if (mounted) {
          setError("Could not access camera. Please allow camera permissions.");
          console.error("Scanner error:", err);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Scan Barcode</h3>
          <button
            type="button"
            onClick={() => {
              const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
              if (scanner) scanner.stop().catch(() => {});
              onClose();
            }}
            className="text-muted font-medium text-sm"
          >
            Cancel
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-danger text-sm mb-4">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="text-primary font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <div id="barcode-scanner-region" ref={scannerRef} className="w-full" />
          )}
          <p className="text-xs text-muted text-center mt-3">
            Point camera at the barcode on the product
          </p>
        </div>
      </div>
    </div>
  );
}
