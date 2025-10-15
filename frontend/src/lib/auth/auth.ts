// ABOUTME: Authentication service managing JWT tokens and user sessions
// ABOUTME: Handles login, logout, token refresh, and authentication state

import { API_ENDPOINTS } from '../api/config';
import { User } from '@/types';

interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

interface TokenStorage {
  accessToken: string | null;
  refreshToken: string | null;
}

const TOKEN_KEY = 'synapse_tokens';
const USER_KEY = 'synapse_user';

export class AuthService {
  private getTokens(): TokenStorage {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }

    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return { accessToken: null, refreshToken: null };

    try {
      return JSON.parse(stored);
    } catch {
      return { accessToken: null, refreshToken: null };
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken }));
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getAccessToken(): string | null {
    return this.getTokens().accessToken;
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<User> {
    // Check if using mock API (port 3001)
    const isMockAPI = API_ENDPOINTS.auth.login.includes(':3001');

    if (isMockAPI) {
      // Mock authentication - find user by email
      const response = await fetch(API_ENDPOINTS.users);
      if (!response.ok) {
        throw new Error('Failed to fetch users from mock API');
      }

      const users: User[] = await response.json();
      console.log('Mock API: Fetched users:', users.length, 'Looking for email:', email);
      console.log('First user email:', users[0]?.email);

      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        console.log('Available emails:', users.map(u => u.email));
        throw new Error('User not found. Try: ' + users.slice(0, 3).map(u => u.email).join(', '));
      }

      // Create mock tokens
      const mockTokens = {
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
      };

      this.setTokens(mockTokens.access_token, mockTokens.refresh_token);
      this.setUser(user);
      return user;
    }

    // Production authentication
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    this.setTokens(data.access_token, data.refresh_token);
    this.setUser(data.user);

    return data.user;
  }

  async logout(): Promise<void> {
    const token = this.getAccessToken();

    if (token) {
      try {
        await fetch(API_ENDPOINTS.auth.logout, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    this.clearTokens();
  }

  async refreshToken(): Promise<string> {
    const tokens = this.getTokens();

    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data: RefreshResponse = await response.json();
    this.setTokens(data.access_token, tokens.refreshToken);

    return data.access_token;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    // Check if using mock API (token starts with 'mock_')
    if (token.startsWith('mock_')) {
      // Return stored user from localStorage
      return this.getStoredUser();
    }

    // Production: fetch from API
    try {
      const response = await fetch(API_ENDPOINTS.auth.me, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const user: User = await response.json();
      this.setUser(user);
      return user;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
