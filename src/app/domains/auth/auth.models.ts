export interface AuthUser {
  name: string | null;
  email: string | null;
  id: string | null;
  role: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}
