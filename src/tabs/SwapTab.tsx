import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, Info, Loader2, AlertCircle, Search, X, ChevronDown } from 'lucide-react';

interface Profile {
  balance: number;
  cryptoBalances?: { [key: string]: number };
}

interface SwapTabProps {
  currentUser: Profile;
  onRefresh?: () => void;
}

interface Token {
  symbol: string;
  name: string;
  logoUrl: string;
  coingeckoId: string;
  balance: number;
}

interface TokenPrice {
  usd: number;
  usd_24h_change: number;
}

const SwapTab: React.FC<SwapTabProps> = ({ currentUser, onRefresh }) => {
  // Available tokens with CoinGecko IDs and logo URLs
  const availableTokens: Token[] = [
    { 
      symbol: 'SOL', 
      name: 'Solana', 
      logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      coingeckoId: 'solana', 
      balance: 0 
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin', 
      logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
      coingeckoId: 'usd-coin', 
      balance: 0 
    },
    { 
      symbol: 'USDT', 
      name: 'Tether', 
      logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      coingeckoId: 'tether', 
      balance: 0 
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      coingeckoId: 'ethereum', 
      balance: 0 
    },
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      coingeckoId: 'bitcoin', 
      balance: 0 
    },
    { 
      symbol: 'WBTC', 
      name: 'Wrapped Bitcoin', 
      logoUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      coingeckoId: 'wrapped-bitcoin', 
      balance: 0 
    },
    { 
      symbol: 'RAY', 
      name: 'Raydium', 
      logoUrl: 'https://assets.coingecko.com/coins/images/13928/small/PSigc4ie_400x400.jpg',
      coingeckoId: 'raydium', 
      balance: 0 
    },
    { 
      symbol: 'ORCA', 
      name: 'Orca', 
      logoUrl: 'https://assets.coingecko.com/coins/images/17547/small/Orca_Logo.png',
      coingeckoId: 'orca', 
      balance: 0 
    },
  ];

  const [fromToken, setFromToken] = useState<Token>(availableTokens[2]); // USDT
  const [toToken, setToToken] = useState<Token>(availableTokens[4]); // BTC
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState(1);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectingToken, setSelectingToken] = useState<'from' | 'to'>('from');
  const [searchQuery, setSearchQuery] = useState('');
  const [prices, setPrices] = useState<{ [key: string]: TokenPrice }>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prices from CoinGecko
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    setPriceLoading(true);
    setError(null);
    
    try {
      const ids = availableTokens.map(t => t.coingeckoId).join(',');
      const apiKey = import.meta.env.VITE_COINGECKO_API_KEY || '';
      
      // CoinGecko API endpoint
      const url = apiKey 
        ? `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${apiKey}`
        : `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError('Failed to load prices. Using demo mode.');
      
      // Fallback demo prices
      const demoData: { [key: string]: TokenPrice } = {
        'solana': { usd: 238.50, usd_24h_change: 2.5 },
        'usd-coin': { usd: 1.00, usd_24h_change: 0.01 },
        'tether': { usd: 1.00, usd_24h_change: 0.0 },
        'ethereum': { usd: 3850.25, usd_24h_change: 1.8 },
        'bitcoin': { usd: 98500.00, usd_24h_change: 3.2 },
        'wrapped-bitcoin': { usd: 98450.00, usd_24h_change: 3.1 },
        'raydium': { usd: 5.45, usd_24h_change: -1.2 },
        'orca': { usd: 4.20, usd_24h_change: 0.8 },
      };
      setPrices(demoData);
    } finally {
      setPriceLoading(false);
    }
  };

  // Calculate exchange when fromAmount changes
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      calculateToAmount(fromAmount);
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken, prices]);

  const calculateToAmount = (amount: string) => {
    const fromPrice = prices[fromToken.coingeckoId]?.usd || 0;
    const toPrice = prices[toToken.coingeckoId]?.usd || 0;
    
    if (fromPrice && toPrice) {
      const fromValue = parseFloat(amount);
      const toValue = (fromValue * fromPrice) / toPrice;
      const withSlippage = toValue * (1 - slippage / 100);
      setToAmount(withSlippage.toFixed(8));
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Swap amounts
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleFromAmountChange = (value: string) => {
    // Allow only numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
    }
  };

  const handleMaxClick = () => {
    setFromAmount(fromToken.balance.toString());
  };

  const handleTokenSelect = (token: Token) => {
    if (selectingToken === 'from') {
      if (token.symbol === toToken.symbol) {
        setToToken(fromToken);
      }
      setFromToken(token);
    } else {
      if (token.symbol === fromToken.symbol) {
        setFromToken(toToken);
      }
      setToToken(token);
    }
    setShowTokenModal(false);
    setSearchQuery('');
  };

  const openTokenModal = (type: 'from' | 'to') => {
    setSelectingToken(type);
    setShowTokenModal(true);
  };

  const filteredTokens = availableTokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setLoading(true);
    
    // Simulate swap transaction
    setTimeout(() => {
      setLoading(false);
      alert(`Swap executed!\n${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`);
      setFromAmount('');
      setToAmount('');
      onRefresh?.();
    }, 2000);
  };

  const getUsdValue = (amount: string, token: Token) => {
    if (!amount || isNaN(parseFloat(amount))) return '$0.00';
    const price = prices[token.coingeckoId]?.usd || 0;
    const value = parseFloat(amount) * price;
    return `$${value.toFixed(2)}`;
  };

  const getExchangeRate = () => {
    const fromPrice = prices[fromToken.coingeckoId]?.usd || 0;
    const toPrice = prices[toToken.coingeckoId]?.usd || 0;
    if (!fromPrice || !toPrice) return '...';
    const rate = fromPrice / toPrice;
    return rate.toFixed(8);
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-md mx-auto space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Swap Tokens</h2>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400 bg-slate-800 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
              {slippage}% Slippage
            </div>
            <button
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              className="p-2 rounded-full hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Slippage Settings */}
        {showSlippageSettings && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 animate-in slide-in-from-top">
            <h3 className="text-sm font-bold text-white mb-3">Slippage Tolerance</h3>
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1.0, 3.0].map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setSlippage(value);
                    setShowSlippageSettings(false);
                  }}
                  className={`py-2 rounded-xl font-bold text-sm transition-colors ${
                    slippage === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* You Pay Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs sm:text-sm font-medium text-slate-400">You Pay</label>
            <span className="text-xs text-slate-500 truncate max-w-[180px]">
              Balance: {fromToken.balance.toFixed(4)} {fromToken.symbol}
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <button
              onClick={() => openTokenModal('from')}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-700 hover:bg-slate-600 px-2 sm:px-3 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <img 
                src={fromToken.logoUrl} 
                alt={fromToken.symbol}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/32/1e293b/ffffff?text=' + fromToken.symbol;
                }}
              />
              <span className="font-bold text-white text-sm sm:text-base">{fromToken.symbol}</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
            </button>
            
            <input
              type="text"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-right text-xl sm:text-3xl font-bold text-white placeholder-slate-600 focus:outline-none min-w-0"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleMaxClick}
              className="text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors"
            >
              Max
            </button>
            <span className="text-xs sm:text-sm text-slate-500">
              {getUsdValue(fromAmount, fromToken)}
            </span>
          </div>
        </div>

        {/* Swap Arrow Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center hover:bg-slate-700 transition-all flex-shrink-0"
          >
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* You Receive Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs sm:text-sm font-medium text-slate-400">You Receive</label>
            <span className="text-xs text-slate-500 truncate max-w-[180px]">
              Balance: {toToken.balance.toFixed(4)} {toToken.symbol}
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <button
              onClick={() => openTokenModal('to')}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-700 hover:bg-slate-600 px-2 sm:px-3 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <img 
                src={toToken.logoUrl} 
                alt={toToken.symbol}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/32/1e293b/ffffff?text=' + toToken.symbol;
                }}
              />
              <span className="font-bold text-white text-sm sm:text-base">{toToken.symbol}</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
            </button>
            
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0"
              className="flex-1 bg-transparent text-right text-xl sm:text-3xl font-bold text-white placeholder-slate-600 focus:outline-none min-w-0 break-all"
            />
          </div>

          <div className="flex justify-end">
            <span className="text-xs sm:text-sm text-slate-500">
              {getUsdValue(toAmount, toToken)}
            </span>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {fromAmount && toAmount && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Price</span>
              <span className="text-white font-medium text-right break-all max-w-[60%]">
                1 {fromToken.symbol} ≈ {getExchangeRate()} {toToken.symbol}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400">Provider</span>
              <span className="text-white font-medium truncate max-w-[60%]">
                Lifinity V2 via Jupiter →
              </span>
            </div>
          </div>
        )}

        {/* Price Loading Indicator */}
        {priceLoading && (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating prices...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-400 text-xs">{error}</p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > fromToken.balance || loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Swapping...
            </>
          ) : (
            <>
              {!fromAmount || parseFloat(fromAmount) <= 0
                ? 'Enter an amount'
                : parseFloat(fromAmount) > fromToken.balance
                ? 'Insufficient balance'
                : 'Review Swap'}
            </>
          )}
        </button>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 text-sm font-medium">
              Demo Mode Active
            </p>
            <p className="text-blue-400/70 text-xs mt-1">
              Add your VITE_COINGECKO_API_KEY to .env for live prices. Currently using demo data.
            </p>
          </div>
        </div>
      </div>

      {/* Token Selection Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Select Token</h3>
                <button
                  onClick={() => {
                    setShowTokenModal(false);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Token List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              {filteredTokens.map((token) => {
                const price = prices[token.coingeckoId];
                const isSelected = token.symbol === (selectingToken === 'from' ? fromToken.symbol : toToken.symbol);
                
                return (
                  <button
                    key={token.symbol}
                    onClick={() => handleTokenSelect(token)}
                    disabled={isSelected}
                    className={`w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors ${
                      isSelected ? 'bg-slate-700/50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={token.logoUrl} 
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/40/1e293b/ffffff?text=' + token.symbol;
                        }}
                      />
                      <div className="text-left min-w-0">
                        <div className="font-bold text-white">{token.symbol}</div>
                        <div className="text-xs text-slate-400 truncate">{token.name}</div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-2">
                      {price ? (
                        <>
                          <div className="font-medium text-white text-sm">
                            ${price.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs ${
                            price.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {price.usd_24h_change >= 0 ? '+' : ''}
                            {price.usd_24h_change.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-500 text-sm">Loading...</div>
                      )}
                    </div>
                  </button>
                );
              })}
              
              {filteredTokens.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No tokens found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapTab;