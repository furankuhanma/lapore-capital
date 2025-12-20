import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { Profile } from '../types';
import { TransactionService } from '../lib/transactionService';

interface ReceiveFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
}

const ReceiveFundsModal: React.FC<ReceiveFundsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser 
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, currentUser]);

  const generateQRCode = async () => {
    // Generate QR code data
    const qrData = TransactionService.generateReceiveQRData(
      currentUser.id, 
      currentUser.username
    );

    // Load QRCode library dynamically if not already loaded
    if (typeof window !== 'undefined' && !(window as any).QRCode) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = () => generateQRWithLibrary(qrData);
      document.head.appendChild(script);
    } else {
      generateQRWithLibrary(qrData);
    }
  };

  const generateQRWithLibrary = (qrData: string) => {
    if (!qrContainerRef.current) return;

    // Clear previous QR code
    qrContainerRef.current.innerHTML = '';

    try {
      // Check if QRCode is available
      const QRCodeConstructor = (window as any).QRCode;
      
      if (QRCodeConstructor) {
        new QRCodeConstructor(qrContainerRef.current, {
          text: qrData,
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCodeConstructor.CorrectLevel.H
        });
      } else {
        // Fallback: draw placeholder
        drawPlaceholderQR();
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      drawPlaceholderQR();
    }
  };

  const drawPlaceholderQR = () => {
    if (!qrContainerRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 256);

    // Draw simplified QR pattern
    ctx.fillStyle = '#000000';
    const blockSize = 8;
    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 32; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
        }
      }
    }

    // Draw corner markers
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, 48, 48);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 8, y + 8, 32, 32);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 16, y + 16, 16, 16);
    };

    drawCorner(8, 8);
    drawCorner(200, 8);
    drawCorner(8, 200);

    // Draw logo in center
    ctx.fillStyle = '#3C3CFF';
    ctx.fillRect(104, 104, 48, 48);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', 128, 128);

    qrContainerRef.current.appendChild(canvas);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQR = () => {
    const container = qrContainerRef.current;
    if (!container) return;

    const canvas = container.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `lapore-capital-qr-${currentUser.username}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Lapore-Capital Wallet',
          text: `Send me funds on Lapore-Capital! Username: @${currentUser.username}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyAddress();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-cardbg border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ethblue/20 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-ethblue rotate-180" />
            </div>
            <h2 className="text-xl font-bold text-white">Receive Funds</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* User Info */}
          <div className="text-center space-y-2">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name)}&background=3C3CFF&color=fff&rounded=true`}
              alt={currentUser.full_name}
              className="w-20 h-20 rounded-full mx-auto border-2 border-ethblue shadow-lg shadow-ethblue/20"
            />
            <h3 className="text-xl font-bold text-white">{currentUser.full_name}</h3>
            <p className="text-sm text-slate-400">@{currentUser.username}</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
            <div 
              ref={qrContainerRef}
              className="flex items-center justify-center"
              style={{ minHeight: '256px', minWidth: '256px' }}
            />
          </div>

          <p className="text-center text-slate-400 text-sm">
            Share this QR code with anyone who wants to send you funds
          </p>

          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono truncate">
                {currentUser.id}
              </div>
              <button
                onClick={handleCopyAddress}
                className="w-12 h-12 bg-ethblue/20 hover:bg-ethblue/30 rounded-xl flex items-center justify-center transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-ethblue" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Download className="w-5 h-5" />
              Save QR
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-ethblue hover:bg-ethblue/90 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Branding */}
          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
            <div className="w-5 h-5 bg-ethblue/20 rounded-full flex items-center justify-center">
              <span className="text-xs text-ethblue font-bold">L</span>
            </div>
            Powered by Lapore-Capital
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveFundsModal;