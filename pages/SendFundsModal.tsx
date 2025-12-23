import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle2, QrCode, User } from 'lucide-react';
import { TransactionService } from '../src/lib/transactionService';
import { Profile } from '../src/context/types';

interface SendFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onSuccess: () => void;
  onOpenQRScanner: () => void;
}

type SendStep = 'input' | 'confirm' | 'processing' | 'success' | 'error';

const SendFundsModal: React.FC<SendFundsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onSuccess,
  onOpenQRScanner 
}) => {
  const [step, setStep] = useState<SendStep>('input');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiverProfile, setReceiverProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFindRecipient = async () => {
    setError('');
    
    if (!recipient.trim()) {
      setError('Please enter a wallet address or username');
      return;
    }

    const profile = await TransactionService.getUserByIdentifier(recipient.trim());
    
    if (!profile) {
      setError('Recipient not found. Please check the wallet address or username.');
      return;
    }

    if (profile.id === currentUser.id) {
      setError('You cannot send funds to yourself');
      return;
    }

    setReceiverProfile(profile);
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!receiverProfile) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > currentUser.balance) {
      setError(`Insufficient balance. Available: ₱${currentUser.balance.toFixed(2)}`);
      return;
    }

    setStep('processing');
    setError('');

    const result = await TransactionService.sendFunds({
      sender_id: currentUser.id,
      receiver_id: receiverProfile.id,
      amount: amountNum,
      currency: 'PHP',
      description: description.trim() || undefined,
    });

    if (result.success) {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } else {
      setStep('error');
      setError(result.error || 'Transaction failed');
    }
  };

  const handleClose = () => {
    setStep('input');
    setRecipient('');
    setAmount('');
    setDescription('');
    setReceiverProfile(null);
    setError('');
    onClose();
  };

  const handleBack = () => {
    setStep('input');
    setReceiverProfile(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-cardbg border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ethblue/20 rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-ethblue" />
            </div>
            <h2 className="text-xl font-bold text-white">Send Funds</h2>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Input Step */}
          {step === 'input' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Recipient
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="@username or wallet address"
                      className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-ethblue transition-colors"
                      onKeyPress={(e) => e.key === 'Enter' && handleFindRecipient()}
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  </div>
                </div>

                <button
                  onClick={onOpenQRScanner}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white font-bold transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Scan QR Code
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleFindRecipient}
                disabled={!recipient.trim()}
                className="w-full bg-ethblue hover:bg-ethblue/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && receiverProfile && (
            <>
              <div className="bg-darkbg border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(receiverProfile.full_name)}&background=3C3CFF&color=fff&rounded=true`}
                    alt={receiverProfile.full_name}
                    className="w-16 h-16 rounded-full border-2 border-ethblue"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-white">{receiverProfile.full_name}</h3>
                    <p className="text-sm text-slate-400">@{receiverProfile.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">₱</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white placeholder-slate-700 focus:outline-none focus:border-ethblue transition-colors"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Available: ₱{currentUser.balance.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this for?"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-ethblue transition-colors"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 bg-ethblue hover:bg-ethblue/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Send ₱{parseFloat(amount || '0').toFixed(2)}
                </button>
              </div>
            </>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-16 h-16 text-ethblue animate-spin" />
              <p className="text-white font-bold">Processing transaction...</p>
              <p className="text-slate-500 text-sm">Please wait</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Transaction Successful!</h3>
                <p className="text-slate-400">
                  ₱{parseFloat(amount).toFixed(2)} sent to {receiverProfile?.full_name}
                </p>
              </div>
              {/* Branding */}
              <div className="flex items-center gap-2 text-ethblue/60 text-sm font-bold">
                <div className="w-6 h-6 bg-ethblue/20 rounded-full flex items-center justify-center">
                  <span className="text-xs">L</span>
                </div>
                Lapore-Finance
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="py-8 space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center space-y-2">
                <X className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">Transaction Failed</h3>
                <p className="text-red-400 text-sm">{error}</p>
              </div>

              <button
                onClick={handleBack}
                className="w-full bg-ethblue hover:bg-ethblue/90 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendFundsModal;