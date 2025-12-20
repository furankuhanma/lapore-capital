
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  type: 'send' | 'receive';
  description: string | null;
  created_at: string;
}

export interface UserSession {
  id: string;
  email: string | undefined;
  profile?: Profile;
}

export type AuthMode = 'login' | 'register';
