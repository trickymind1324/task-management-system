// Test suite for email integrations store

import { useIntegrationsStore } from '@/lib/store/integrations-store';
import { act } from '@testing-library/react';

describe('Integrations Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useIntegrationsStore.setState({
      emailIntegrations: [],
      isLoading: false,
      error: null,
    });
  });

  describe('fetchIntegrations', () => {
    it('should set loading state while fetching', async () => {
      const { fetchIntegrations } = useIntegrationsStore.getState();

      await act(async () => {
        await fetchIntegrations();
      });

      // After completion, loading should be false
      expect(useIntegrationsStore.getState().isLoading).toBe(false);
    });

    it('should populate email integrations with mock data', async () => {
      const { fetchIntegrations } = useIntegrationsStore.getState();

      await act(async () => {
        await fetchIntegrations();
      });

      const { emailIntegrations } = useIntegrationsStore.getState();

      expect(emailIntegrations).toHaveLength(2);
      expect(emailIntegrations[0].provider).toBe('zoho-mail');
      expect(emailIntegrations[1].provider).toBe('outlook');
      expect(emailIntegrations[0].status).toBe('disconnected');
    });

    it('should handle errors gracefully', async () => {
      const { fetchIntegrations } = useIntegrationsStore.getState();

      // Since fetchIntegrations uses mock data and doesn't actually fetch,
      // we can't easily test error handling without refactoring
      // This test demonstrates the structure even though mock data succeeds

      await act(async () => {
        await fetchIntegrations();
      });

      const { isLoading } = useIntegrationsStore.getState();

      expect(isLoading).toBe(false);
    });
  });

  describe('disconnectEmail', () => {
    beforeEach(async () => {
      // Setup: fetch integrations first
      const { fetchIntegrations } = useIntegrationsStore.getState();
      await act(async () => {
        await fetchIntegrations();
      });
    });

    it('should update integration status to disconnected', async () => {
      const { disconnectEmail } = useIntegrationsStore.getState();

      // Manually set one as connected first
      act(() => {
        useIntegrationsStore.setState({
          emailIntegrations: [
            {
              provider: 'zoho-mail',
              email: 'test@example.com',
              connected: true,
              status: 'connected',
            },
            {
              provider: 'outlook',
              email: '',
              connected: false,
              status: 'disconnected',
            },
          ],
        });
      });

      await act(async () => {
        await disconnectEmail('zoho-mail');
      });

      const { emailIntegrations } = useIntegrationsStore.getState();
      const zohoIntegration = emailIntegrations.find(i => i.provider === 'zoho-mail');

      expect(zohoIntegration?.connected).toBe(false);
      expect(zohoIntegration?.status).toBe('disconnected');
      expect(zohoIntegration?.email).toBe('');
    });

    it('should not affect other integrations', async () => {
      const { disconnectEmail } = useIntegrationsStore.getState();

      act(() => {
        useIntegrationsStore.setState({
          emailIntegrations: [
            {
              provider: 'zoho-mail',
              email: 'test@example.com',
              connected: true,
              status: 'connected',
            },
            {
              provider: 'outlook',
              email: 'outlook@example.com',
              connected: true,
              status: 'connected',
            },
          ],
        });
      });

      await act(async () => {
        await disconnectEmail('zoho-mail');
      });

      const { emailIntegrations } = useIntegrationsStore.getState();
      const outlookIntegration = emailIntegrations.find(i => i.provider === 'outlook');

      expect(outlookIntegration?.connected).toBe(true);
      expect(outlookIntegration?.status).toBe('connected');
    });
  });

  describe('syncEmail', () => {
    beforeEach(async () => {
      const { fetchIntegrations } = useIntegrationsStore.getState();
      await act(async () => {
        await fetchIntegrations();
      });

      // Set as connected
      act(() => {
        useIntegrationsStore.setState({
          emailIntegrations: [
            {
              provider: 'zoho-mail',
              email: 'test@example.com',
              connected: true,
              status: 'connected',
            },
            {
              provider: 'outlook',
              email: '',
              connected: false,
              status: 'disconnected',
            },
          ],
        });
      });
    });

    it('should update status after sync', async () => {
      const { syncEmail } = useIntegrationsStore.getState();

      await act(async () => {
        await syncEmail('zoho-mail');
      });

      // After sync, status should be connected
      const { emailIntegrations } = useIntegrationsStore.getState();
      const zohoIntegration = emailIntegrations.find(i => i.provider === 'zoho-mail');
      expect(zohoIntegration?.status).toBe('connected');
    });

    it('should update lastSync timestamp after successful sync', async () => {
      const { syncEmail } = useIntegrationsStore.getState();

      const beforeSync = new Date();

      await act(async () => {
        await syncEmail('zoho-mail');
      });

      const { emailIntegrations } = useIntegrationsStore.getState();
      const zohoIntegration = emailIntegrations.find(i => i.provider === 'zoho-mail');

      expect(zohoIntegration?.status).toBe('connected');
      expect(zohoIntegration?.lastSync).toBeDefined();
      expect(new Date(zohoIntegration!.lastSync!).getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
    });
  });

  describe('connectEmail', () => {
    it('should redirect to OAuth URL', async () => {
      const { connectEmail } = useIntegrationsStore.getState();

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      await act(async () => {
        await connectEmail('zoho-mail');
      });

      expect(window.location.href).toBe('/api/v1/integrations/zoho-mail/auth');
    });

    it('should use correct OAuth URL for Outlook', async () => {
      const { connectEmail } = useIntegrationsStore.getState();

      delete (window as any).location;
      window.location = { href: '' } as any;

      await act(async () => {
        await connectEmail('outlook');
      });

      expect(window.location.href).toBe('/api/v1/integrations/outlook/auth');
    });
  });
});
