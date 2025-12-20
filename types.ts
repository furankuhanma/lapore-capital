
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  balance: number; // Added balance field
  created_at: string;
}

export interface UserSession {
  id: string;
  email: string | undefined;
  profile?: Profile;
}

export type AuthMode = 'login' | 'register';
