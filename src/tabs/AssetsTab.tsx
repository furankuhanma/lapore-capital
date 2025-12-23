import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Plus, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, CryptoAsset, CryptoPrice } from '../../src/context/types';
import { CryptoService } from '../lib/cryptoService';

interface AssetsTabProps {
  currentUser: Profile;
  onRefresh?: () => void;
}

interface AssetWithPrice extends CryptoAsset {
  currentPrice?: number;
  priceChange24h?: number;
  usdValue?: number;
}

const AssetsTab: React.FC<AssetsTabProps> = ({ currentUser, onRefresh }) => {
  const [assets, setAssets] = useState<AssetWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [portfolioChange, setPortfolioChange] = useState(0);

  useEffect(() => {
    fetchAssets();
  }, [currentUser.id]);

  const fetchAssets = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch user's crypto assets
      const { data: cryptoAssets, error } = await supabase
        .from('crypto_assets')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!cryptoAssets || cryptoAssets.length === 0) {
        setAssets([]);
        setTotalPortfolioValue(0);
        setPortfolioChange(0);
        return;
      }

      // Get unique coin IDs
      const coinIds = [...new Set(cryptoAssets.map(a => a.coin_id))];

      // Fetch current prices
      const prices = await CryptoService.getCryptoPrices(coinIds);

      // Combine assets with price data
      const assetsWithPrices: AssetWithPrice[] = cryptoAssets.map(asset => {
        const priceData = prices[asset.coin_id];
        const currentPrice = priceData?.usd || 0;
        const priceChange24h = priceData?.usd_24h_change || 0;
        const usdValue = currentPrice * asset.amount;

        return {
          ...asset,
          currentPrice,
          priceChange24h,
          usdValue,
        };
      });

      setAssets(assetsWithPrices);

      // Calculate total portfolio value
      const totalValue = assetsWithPrices.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);
      setTotalPortfolioValue(totalValue);

      // Calculate average portfolio change (weighted by value)
      const avgChange = assetsWithPrices.reduce((sum, asset) => {
        const weight = (asset.usdValue || 0) / totalValue;
        return sum + ((asset.priceChange24h || 0) * weight);
      }, 0);
      setPortfolioChange(avgChange);

    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAssets(true);
    if (onRefresh) onRefresh();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-ethblue animate-spin" />
        <p className="text-slate-500 text-sm">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Portfolio Summary */}
      <div className="space-y-4">
        {/* Total Balance Card */}
        <div className="bg-cardbg border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Total Portfolio
            </h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-full hover:bg-white/5 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tight">
              {formatCurrency(totalPortfolioValue)}
            </h2>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              portfolioChange >= 0 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              {portfolioChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-bold ${
                portfolioChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatPercent(portfolioChange)}
              </span>
              <span className="text-xs text-slate-500">24h</span>
            </div>
          </div>
        </div>

        {/* Fiat Balance Card */}
        <div className="bg-cardbg border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Fiat Balance
              </p>
              <h3 className="text-2xl font-black text-white">
                ₱{currentUser.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Assets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Crypto Assets
          </h3>
          <button className="text-xs font-bold text-ethblue uppercase tracking-widest hover:text-white transition-colors">
            Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <div className="bg-cardbg border border-white/5 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-bold">No crypto assets yet</p>
              <p className="text-slate-500 text-xs mt-1">
                Start building your crypto portfolio
              </p>
            </div>
            <button className="bg-ethblue/20 hover:bg-ethblue/30 text-ethblue text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all">
              Add Asset
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-cardbg border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Coin Icon */}
                  <div className="w-12 h-12 rounded-full bg-ethblue/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-ethblue uppercase">
                      {asset.symbol.slice(0, 2)}
                    </span>
                  </div>

                  {/* Asset Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-white font-bold text-sm">
                          {asset.symbol.toUpperCase()}
                        </h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {asset.amount} {asset.symbol.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-white">
                          {formatCurrency(asset.usdValue || 0)}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          (asset.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(asset.priceChange24h || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 bg-ethblue hover:bg-ethblue/90 text-white font-bold py-3 rounded-xl transition-colors">
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
        <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
          Refresh Prices
        </button>
      </div>
    </div>
  );
};

export default AssetsTab;