// ABOUTME: Zustand store for email integrations state management
// ABOUTME: Handles Zoho Mail and Outlook connection status and sync

import { create } from 'zustand';

export type EmailProvider = 'zoho-mail' | 'outlook';

export interface EmailIntegration {
  provider: EmailProvider;
  email: string;
  connected: boolean;
  lastSync?: Date;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorMessage?: string;
}

interface IntegrationsState {
  emailIntegrations: EmailIntegration[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchIntegrations: () => Promise<void>;
  connectEmail: (provider: EmailProvider) => Promise<void>;
  disconnectEmail: (provider: EmailProvider) => Promise<void>;
  syncEmail: (provider: EmailProvider) => Promise<void>;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  emailIntegrations: [],
  isLoading: false,
  error: null,

  fetchIntegrations: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/v1/integrations');
      // const data = await response.json();

      // Mock data for now
      const mockData: EmailIntegration[] = [
        {
          provider: 'zoho-mail',
          email: '',
          connected: false,
          status: 'disconnected',
        },
        {
          provider: 'outlook',
          email: '',
          connected: false,
          status: 'disconnected',
        },
      ];

      set({ emailIntegrations: mockData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch integrations', isLoading: false });
    }
  },

  connectEmail: async (provider: EmailProvider) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real OAuth flow
      const authUrl = provider === 'zoho-mail'
        ? '/api/v1/integrations/zoho-mail/auth'
        : '/api/v1/integrations/outlook/auth';

      // Redirect to OAuth flow (backend will handle)
      window.location.href = authUrl;
    } catch (error: any) {
      set({ error: error.message || 'Failed to connect email', isLoading: false });
    }
  },

  disconnectEmail: async (provider: EmailProvider) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API call
      const endpoint = provider === 'zoho-mail'
        ? '/api/v1/integrations/zoho-mail/disconnect'
        : '/api/v1/integrations/outlook/disconnect';

      // await fetch(endpoint, { method: 'POST' });

      // Update local state
      const integrations = get().emailIntegrations.map(integration =>
        integration.provider === provider
          ? { ...integration, connected: false, email: '', status: 'disconnected' as const }
          : integration
      );

      set({ emailIntegrations: integrations, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to disconnect email', isLoading: false });
    }
  },

  syncEmail: async (provider: EmailProvider) => {
    // Update status to syncing
    const integrations = get().emailIntegrations.map(integration =>
      integration.provider === provider
        ? { ...integration, status: 'syncing' as const }
        : integration
    );
    set({ emailIntegrations: integrations });

    try {
      // TODO: Replace with real API call
      const endpoint = provider === 'zoho-mail'
        ? '/api/v1/integrations/zoho-mail/sync'
        : '/api/v1/integrations/outlook/sync';

      // await fetch(endpoint, { method: 'POST' });

      // Update lastSync time
      const updatedIntegrations = get().emailIntegrations.map(integration =>
        integration.provider === provider
          ? { ...integration, status: 'connected' as const, lastSync: new Date() }
          : integration
      );

      set({ emailIntegrations: updatedIntegrations });
    } catch (error: any) {
      // Update status to error
      const errorIntegrations = get().emailIntegrations.map(integration =>
        integration.provider === provider
          ? { ...integration, status: 'error' as const, errorMessage: error.message }
          : integration
      );
      set({ emailIntegrations: errorIntegrations, error: error.message });
    }
  },
}));
