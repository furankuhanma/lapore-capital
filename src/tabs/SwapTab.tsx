import React, { useState } from 'react';
import { ArrowDown, Settings, Info, Loader2, AlertCircle } from 'lucide-react';
import { Profile } from '../../src/context/types';

interface SwapTabProps {
  currentUser: Profile;
  onRefresh?: () => void;
}

interface SwapAsset {
  symbol: string;
  name: string;
  balance: number;
  icon: string;
}

const SwapTab: React.FC<SwapTabProps> = ({ currentUser, onRefresh }) => {
  const [fromAsset, setFromAsset] = useState<SwapAsset>({
    symbol: 'PHP',
    name: 'Philippine Peso',
    balance: currentUser.balance,
    icon: '₱'
  });
  
  const [toAsset, setToAsset] = useState<SwapAsset | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  // Placeholder assets - will be replaced with real data
  const availableAssets: SwapAsset[] = [
    { symbol: 'PHP', name: 'Philippine Peso', balance: currentUser.balance, icon: '₱' },
    { symbol: 'BTC', name: 'Bitcoin', balance: 0, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', balance: 0, icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', balance: 0, icon: '$' },
  ];

  const handleSwapAssets = () => {
    if (!toAsset) return;
    
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    
    // Swap amounts
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    
    // Calculate estimated toAmount (placeholder calculation)
    if (value && !isNaN(parseFloat(value))) {
      const estimated = parseFloat(value) * 0.95; // Placeholder conversion rate
      setToAmount(estimated.toFixed(6));
    } else {
      setToAmount('');
    }
  };

  const handleSwap = async () => {
    if (!toAsset || !fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }

    setLoading(true);
    
    // Placeholder for swap logic
    setTimeout(() => {
      setLoading(false);
      alert('Swap functionality will be implemented soon!');
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Swap</h2>
        <button
          onClick={() => setShowSlippageSettings(!showSlippageSettings)}
          className="p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Slippage Settings */}
      {showSlippageSettings && (
        <div className="bg-cardbg border border-white/5 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-bold text-white mb-3">Slippage Tolerance</h3>
          <div className="grid grid-cols-4 gap-2">
            {[0.1, 0.5, 1.0, 3.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`py-2 rounded-xl font-bold text-sm transition-colors ${
                  slippage === value
                    ? 'bg-ethblue text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Swap Container */}
      <div className="space-y-2">
        {/* From Section */}
        <div className="bg-cardbg border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              From
            </label>
            <span className="text-xs text-slate-500">
              Balance: {fromAsset.balance.toFixed(2)} {fromAsset.symbol}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors">
              <span className="text-2xl">{fromAsset.icon}</span>
              <span className="font-bold text-white">{fromAsset.symbol}</span>
            </button>
            
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-right text-2xl font-bold text-white placeholder-slate-700 focus:outline-none"
            />
          </div>
          
          <button
            onClick={() => handleFromAmountChange(fromAsset.balance.toString())}
            className="text-xs text-ethblue font-bold mt-2 hover:text-white transition-colors"
          >
            Max
          </button>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            onClick={handleSwapAssets}
            disabled={!toAsset}
            className="w-10 h-10 bg-cardbg border border-white/10 rounded-full flex items-center justify-center hover:bg-white/5 hover:border-ethblue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDown className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* To Section */}
        <div className="bg-cardbg border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              To
            </label>
            {toAsset && (
              <span className="text-xs text-slate-500">
                Balance: {toAsset.balance.toFixed(2)} {toAsset.symbol}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {toAsset ? (
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors">
                <span className="text-2xl">{toAsset.icon}</span>
                <span className="font-bold text-white">{toAsset.symbol}</span>
              </button>
            ) : (
              <button 
                onClick={() => setToAsset(availableAssets[1])}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors"
              >
                <span className="font-bold text-slate-500">Select token</span>
              </button>
            )}
            
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-right text-2xl font-bold text-white placeholder-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Rate Info */}
      {fromAmount && toAmount && toAsset && (
        <div className="bg-cardbg border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Rate</span>
            <span className="text-white font-medium">
              1 {fromAsset.symbol} ≈ 0.95 {toAsset.symbol}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Network Fee</span>
            <span className="text-white font-medium">~₱5.00</span>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
            <span className="text-slate-500">You'll receive</span>
            <span className="text-white font-bold">
              {toAmount} {toAsset.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 text-sm font-medium">
            Swap Feature Coming Soon
          </p>
          <p className="text-blue-400/70 text-xs mt-1">
            This interface is ready for when swap functionality is implemented. Connect your preferred exchange API to enable trading.
          </p>
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!toAsset || !fromAmount || parseFloat(fromAmount) <= 0 || loading}
        className="w-full bg-ethblue hover:bg-ethblue/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Swapping...
          </>
        ) : (
          <>
            {!toAsset || !fromAmount || parseFloat(fromAmount) <= 0
              ? 'Enter an amount'
              : `Swap ${fromAsset.symbol} for ${toAsset.symbol}`}
          </>
        )}
      </button>

      {/* Warning */}
      {fromAmount && parseFloat(fromAmount) > fromAsset.balance && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">
            Insufficient balance. You have {fromAsset.balance.toFixed(2)} {fromAsset.symbol}
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-600">
        <p>Swaps are powered by decentralized exchanges</p>
        <p className="mt-1">Always verify transaction details before confirming</p>
      </div>
    </div>
  );
};

export default SwapTab;