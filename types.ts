export interface Profile {
  id: string;
  full_name: string;
  username: string;
  balance: number;
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