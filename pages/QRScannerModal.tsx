import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { TransactionService } from '../lib/transactionService';

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
  const [scanStatus, setScanStatus] = useState<string>('Initializing scanner...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const jsQRRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setError('');
      setPermissionDenied(false);
      setHasPermission(null);
      setScanStatus('Initializing scanner...');
      
      // Load jsQR library
      loadJsQR().then(() => {
        startCamera();
      });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const loadJsQR = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if jsQR is already loaded
      if ((window as any).jsQR) {
        jsQRRef.current = (window as any).jsQR;
        resolve();
        return;
      }

      // Load jsQR from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js';
      script.async = true;
      script.onload = () => {
        jsQRRef.current = (window as any).jsQR;
        console.log('jsQR loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load jsQR library');
        reject(new Error('Failed to load QR scanner library'));
      };
      document.head.appendChild(script);
    });
  };

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

      setScanStatus('Requesting camera permission...');

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
          videoRef.current?.play().then(() => {
            setHasPermission(true);
            setIsScanning(true);
            setPermissionDenied(false);
            setScanStatus('Scanning for QR code...');
            
            // Start scanning after video is playing
            setTimeout(() => {
              startQRScanning();
            }, 500);
          }).catch(err => {
            console.error('Error playing video:', err);
            setError('Failed to start camera preview');
          });
        };
      }
      
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
    if (!videoRef.current || !canvasRef.current || !jsQRRef.current) {
      console.error('Scanner not ready:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        jsQR: !!jsQRRef.current
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    console.log('Starting QR code scanning loop...');

    const scan = () => {
      if (!isScanning || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Try to decode QR code
      const code = jsQRRef.current(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        console.log('QR Code detected:', code.data);
        handleQRCodeDetected(code.data);
      }
    };

    // Scan every 300ms
    scanIntervalRef.current = window.setInterval(scan, 300);
  };

  const handleQRCodeDetected = (qrData: string) => {
    console.log('Processing QR data:', qrData);
    
    // Stop scanning
    setIsScanning(false);
    setScanStatus('QR Code found! Processing...');
    
    // Parse the QR data
    const parsed = TransactionService.parseQRData(qrData);
    
    if (parsed && parsed.userId) {
      console.log('Valid QR code:', parsed);
      // Success! Close modal and pass data
      onScanSuccess(parsed.userId, parsed.username);
      handleClose();
    } else {
      // Invalid QR code format
      console.error('Invalid QR code format:', qrData);
      setError('Invalid QR code. Please scan a valid Lapore-Capital QR code.');
      setScanStatus('Invalid QR code detected');
      
      // Resume scanning after 2 seconds
      setTimeout(() => {
        setError('');
        setScanStatus('Scanning for QR code...');
        setIsScanning(true);
        startQRScanning();
      }, 2000);
    }
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

  // Simulated QR scan success (for testing when you don't have a QR code)
  const simulateScan = () => {
    // Get a test user ID - you can replace this with an actual user ID from your database
    const testQRData = TransactionService.generateReceiveQRData(
      'test-user-id', // Replace with real user ID for testing
      'testuser'
    );
    handleQRCodeDetected(testQRData);
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
          
          {/* Hidden canvas for QR code processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanning Overlay */}
          {isScanning && hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-ethblue rounded-tl-2xl animate-pulse"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-ethblue rounded-tr-2xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-ethblue rounded-bl-2xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-ethblue rounded-br-2xl animate-pulse"></div>
                
                {/* Scanning line animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-transparent via-ethblue to-transparent animate-scan"></div>
                </div>
              </div>
              
              {/* Scan status */}
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <div className="inline-block bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
                  <p className="text-white text-sm font-medium">{scanStatus}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {hasPermission === null && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-4">
                <Loader2 className="w-16 h-16 text-ethblue animate-spin mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{scanStatus}</h3>
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
            <div className="bg-ethblue/10 border border-ethblue/20 rounded-xl p-4">
              <p className="text-ethblue text-sm text-center font-medium">
                📱 Position the QR code within the frame
              </p>
            </div>
          )}

          {error && (
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

          {/* Dev Testing Button - Shows in development */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={simulateScan}
              className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 text-green-400 font-bold py-2 rounded-xl transition-colors text-sm"
            >
              [Dev] Simulate Valid QR Scan
            </button>
          )}

          {/* Security Notice for HTTP */}
          {!window.isSecureContext && window.location.hostname !== 'localhost' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 text-xs text-center">
                <strong>Note:</strong> Camera access requires HTTPS. For testing, use manual entry or access via HTTPS/localhost.
              </p>
            </div>
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