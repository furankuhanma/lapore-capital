import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!qrRef.current) return;

    const qrCode = new Html5Qrcode("qr-reader");

    const config = { fps: 10, qrbox: 250 };

    qrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          qrCode.stop();
        },
        (errorMessage) => {
          console.warn(errorMessage);
        }
      )
      .catch((err) => console.error("Failed to start QR scanner:", err));

    return () => {
      qrCode.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div
      id="qr-reader"
      ref={qrRef}
      className="w-[300px] h-[300px] rounded-xl overflow-hidden bg-black"
    />
  );
};

export default QRScanner;
