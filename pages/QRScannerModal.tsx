import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { TransactionService } from '../src/lib/transactionService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userId: string, username?: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ 
  isOpen, 
  onClose, 
  onScanSuccess 
}) => {
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setError('');
      setPermissionDenied(false);
      setHasPermission(null);
      
      // Small delay to allow modal to render
      setTimeout(() => {
        startCamera();
      }, 300);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      // Check if running on HTTPS (required for camera access)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
      
      if (!isSecureContext && window.location.hostname !== 'localhost') {
        setError('Camera access requires HTTPS. Your site must be served over a secure connection.');
        setHasPermission(false);
        return;
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        setError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
        setHasPermission(false);
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        setError('Camera API is not available. Please update your browser to the latest version.');
        setHasPermission(false);
        return;
      }

      // Request camera permission with optimal constraints for mobile
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Error playing video:', err);
            setError('Failed to start camera preview');
          });
        };
      }
      
      setHasPermission(true);
      setIsScanning(true);
      setPermissionDenied(false);
      
      // Start scanning for QR codes
      startQRScanning();
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      // Handle specific error types
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera permission was denied. Please enable camera access in your browser/device settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not support the required features.');
      } else {
        setError('Unable to access camera. Please check your browser permissions.');
      }
      
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const startQRScanning = () => {
    // Simple QR code detection simulation
    // In a real implementation, you would use a library like jsQR
    scanIntervalRef.current = window.setInterval(() => {
      if (videoRef.current && isScanning) {
        // This is a placeholder for actual QR scanning logic
        // You would typically:
        // 1. Create a canvas
        // 2. Draw the video frame to canvas
        // 3. Use jsQR to decode the image data
        console.log('Scanning for QR code...');
      }
    }, 500);
  };

  const handleManualInput = () => {
    // Close scanner and allow manual input
    stopCamera();
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    setError('');
    onClose();
  };

  const handleRetryCamera = () => {
    setError('');
    setPermissionDenied(false);
    setHasPermission(null);
    startCamera();
  };

  const openDeviceSettings = () => {
    // Provide guidance on how to enable camera permissions
    const userAgent = navigator.userAgent.toLowerCase();
    let settingsGuide = '';

    if (userAgent.includes('android')) {
      settingsGuide = 'Android: Settings > Apps > Browser > Permissions > Camera';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      settingsGuide = 'iOS: Settings > Safari > Camera (or Settings > Chrome > Camera)';
    } else {
      settingsGuide = 'Desktop: Click the camera icon in your browser\'s address bar';
    }

    alert(`To enable camera access:\n\n${settingsGuide}\n\nAfter enabling, return here and click "Try Again".`);
  };

  // Simulated QR scan success (for testing)
  const simulateScan = (qrData: string) => {
    const parsed = TransactionService.parseQRData(qrData);
    if (parsed) {
      onScanSuccess(parsed.userId, parsed.username);
      handleClose();
    } else {
      setError('Invalid QR code. Please scan a valid Lapore-Finance QR code.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-cardbg border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ethblue/20 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-ethblue" />
            </div>
            <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black aspect-square">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />
          
          {/* Scanning Overlay */}
          {isScanning && hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-ethblue rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-ethblue rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-ethblue rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-ethblue rounded-br-2xl"></div>
                
                {/* Scanning line animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-transparent via-ethblue to-transparent animate-scan"></div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {hasPermission === null && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-ethblue border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Requesting Camera Access</h3>
                  <p className="text-slate-400 text-sm">
                    Please allow camera permission when prompted
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Permission Error */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
              <div className="text-center space-y-4 max-w-sm">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {permissionDenied ? 'Camera Access Denied' : 'Camera Access Required'}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {error}
                  </p>
                </div>
                
                {permissionDenied && (
                  <div className="space-y-3">
                    <button
                      onClick={openDeviceSettings}
                      className="w-full flex items-center justify-center gap-2 bg-ethblue/20 hover:bg-ethblue/30 border border-ethblue/30 text-ethblue font-bold py-3 rounded-xl transition-colors"
                    >
                      <SettingsIcon className="w-5 h-5" />
                      How to Enable Camera
                    </button>
                    <button
                      onClick={handleRetryCamera}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-4">
          {isScanning && (
            <p className="text-center text-slate-400 text-sm">
              Position the QR code within the frame to scan
            </p>
          )}

          {error && !hasPermission && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleManualInput}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Enter Wallet Address Manually
          </button>

          {/* Security Notice for HTTP */}
          {!window.isSecureContext && window.location.hostname !== 'localhost' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 text-xs text-center">
                <strong>Note:</strong> Camera access requires HTTPS. For testing, use manual entry or access via HTTPS/localhost.
              </p>
            </div>
          )}

          {/* Dev Testing Button - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => simulateScan(JSON.stringify({
                type: 'lapore-finance-transfer',
                userId: 'test-user-id',
                username: 'testuser',
                timestamp: Date.now()
              }))}
              className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 text-green-400 font-bold py-2 rounded-xl transition-colors text-sm"
            >
              [Dev] Simulate Scan
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(256px);
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScannerModal;