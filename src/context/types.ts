// src/context/types.ts
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  balance: number; // Fiat balance (PHP)
  created_at: string;
}

export interface UserSession {
  id: string;
  email: string | undefined;
  profile?: Profile;
}

export type AuthMode = 'login' | 'register';

// Transaction types
export interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  type: 'send' | 'receive';
  timestamp: string;
  description?: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface TransactionRequest {
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface TransactionResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

// Crypto Asset types
export interface CryptoAsset {
  id: string;
  user_id: string;
  symbol: string; // BTC, ETH, etc.
  name: string; // Bitcoin, Ethereum, etc.
  amount: number; // How much crypto the user owns
  purchase_price_usd: number; // Average purchase price in USD
  created_at: string;
  updated_at: string;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  current_price_usd: number;
  price_change_24h: number; // Percentage
  last_updated: string;
}

export interface PortfolioAsset extends CryptoAsset {
  current_price_usd: number;
  current_value_usd: number;
  profit_loss_usd: number;
  profit_loss_percentage: number;
}

// Navigation types
export type NavigationTab = 'wallet' | 'assets' | 'swap' | 'activity' | 'settings';

// User Settings Update Request
export interface UserSettingsUpdateRequest {
  full_name?: string;
  username?: string;
}
export type ActiveTab = 'wallet' | 'assets' | 'swap' | 'activity' | 'settings';

export interface CryptoAsset {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  amount: number;
  created_at: string;
}

