// src/context/lib/cryptoService.ts
import { supabase } from './supabase';
import { CryptoAsset, CryptoPrice, PortfolioAsset } from '../context/types';

/**
 * CryptoService handles cryptocurrency data and portfolio management
 * Uses CoinGecko API for real-time prices (free tier)
 */
export class CryptoService {
  // CoinGecko API base URL (no API key required for basic usage)
  private static readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  
  // Cache prices for 1 minute to avoid rate limiting
  private static priceCache = new Map<string, { price: CryptoPrice; timestamp: number }>();
  private static readonly CACHE_DURATION = 60000; // 1 minute

  /**
   * Get current cryptocurrency prices
   * @param symbols Array of crypto symbols (e.g., ['BTC', 'ETH'])
   * @returns Map of symbol to price data
   */
  static async getCryptoPrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    const prices = new Map<string, CryptoPrice>();
    const now = Date.now();

    // Filter out cached prices
    const symbolsToFetch = symbols.filter(symbol => {
      const cached = this.priceCache.get(symbol);
      if (cached && now - cached.timestamp < this.CACHE_DURATION) {
        prices.set(symbol, cached.price);
        return false;
      }
      return true;
    });

    if (symbolsToFetch.length === 0) {
      return prices; // All prices were cached
    }

    try {
      // Convert symbols to CoinGecko IDs (BTC -> bitcoin, ETH -> ethereum)
      const coinIds = symbolsToFetch.map(s => this.symbolToCoinGeckoId(s)).join(',');

      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse response and cache
      for (const symbol of symbolsToFetch) {
        const coinId = this.symbolToCoinGeckoId(symbol);
        const priceData = data[coinId];

        if (priceData) {
          const price: CryptoPrice = {
            symbol,
            name: this.symbolToName(symbol),
            current_price_usd: priceData.usd,
            price_change_24h: priceData.usd_24h_change || 0,
            last_updated: new Date().toISOString(),
          };

          prices.set(symbol, price);
          this.priceCache.set(symbol, { price, timestamp: now });
        }
      }

      return prices;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return prices; // Return whatever we have (possibly from cache)
    }
  }

  /**
   * Get user's crypto portfolio with current values
   */
  static async getUserPortfolio(userId: string): Promise<PortfolioAsset[]> {
    try {
      // Fetch user's crypto assets
      const { data: assets, error } = await supabase
        .from('crypto_assets')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching crypto assets:', error);
        return [];
      }

      if (!assets || assets.length === 0) {
        return [];
      }

      // Get current prices for all assets
      const symbols = assets.map(a => a.symbol);
      const prices = await this.getCryptoPrices(symbols);

      // Calculate portfolio values
      const portfolio: PortfolioAsset[] = assets.map(asset => {
        const price = prices.get(asset.symbol);
        const currentPriceUsd = price?.current_price_usd || 0;
        const currentValueUsd = asset.amount * currentPriceUsd;
        const purchaseValueUsd = asset.amount * asset.purchase_price_usd;
        const profitLossUsd = currentValueUsd - purchaseValueUsd;
        const profitLossPercentage = purchaseValueUsd > 0 
          ? (profitLossUsd / purchaseValueUsd) * 100 
          : 0;

        return {
          ...asset,
          current_price_usd: currentPriceUsd,
          current_value_usd: currentValueUsd,
          profit_loss_usd: profitLossUsd,
          profit_loss_percentage: profitLossPercentage,
        };
      });

      return portfolio;
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      return [];
    }
  }

  /**
   * Get total portfolio value in USD
   */
  static async getPortfolioValue(userId: string): Promise<number> {
    const portfolio = await this.getUserPortfolio(userId);
    return portfolio.reduce((total, asset) => total + asset.current_value_usd, 0);
  }

  /**
   * Convert crypto symbol to CoinGecko ID
   * Add more mappings as needed
   */
  private static symbolToCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'TRX': 'tron',
      'TON': 'the-open-network',
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
      'LTC': 'litecoin',
      'SHIB': 'shiba-inu',
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Convert symbol to full name
   */
  private static symbolToName(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BNB': 'BNB',
      'SOL': 'Solana',
      'USDC': 'USD Coin',
      'XRP': 'XRP',
      'ADA': 'Cardano',
      'DOGE': 'Dogecoin',
      'TRX': 'TRON',
      'TON': 'Toncoin',
      'MATIC': 'Polygon',
      'DOT': 'Polkadot',
      'LTC': 'Litecoin',
      'SHIB': 'Shiba Inu',
    };

    return mapping[symbol.toUpperCase()] || symbol;
  }

  /**
   * Add or update crypto asset
   */
  static async upsertCryptoAsset(
    userId: string,
    symbol: string,
    amount: number,
    purchasePriceUsd: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('crypto_assets')
        .upsert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
          name: this.symbolToName(symbol),
          amount,
          purchase_price_usd: purchasePriceUsd,
        }, {
          onConflict: 'user_id,symbol',
        });

      if (error) {
        console.error('Error upserting crypto asset:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error upserting crypto asset:', error);
      return { success: false, error: error.message };
    }
  }
}