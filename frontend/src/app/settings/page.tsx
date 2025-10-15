// ABOUTME: Settings page with email integrations and user preferences
// ABOUTME: Manages Zoho Mail and Outlook connections, profile settings, and role display

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useIntegrationsStore, type EmailProvider } from '@/lib/store/integrations-store';
import { formatDistanceToNow } from 'date-fns';

export default function SettingsPage() {
  const user = useAuthStore(state => state.user);
  const {
    emailIntegrations,
    isLoading,
    error,
    fetchIntegrations,
    connectEmail,
    disconnectEmail,
    syncEmail,
  } = useIntegrationsStore();

  const [activeTab, setActiveTab] = useState<'integrations' | 'profile'>('integrations');

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getProviderName = (provider: EmailProvider) => {
    return provider === 'zoho-mail' ? 'Zoho Mail' : 'Outlook';
  };

  const getProviderIcon = (provider: EmailProvider) => {
    if (provider === 'zoho-mail') {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v.01L12 12l8-5.99V6L12 12 4 6.01z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.5 3h19l-9 7.5L2.5 3z" />
        <path d="M2.5 21V5l9 7.5L21.5 5v16H2.5z" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Connected
          </span>
        );
      case 'syncing':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Syncing...
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
            Not Connected
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-600">
            Manage your integrations, profile, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('integrations')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Email Integration</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Connect your email accounts to automatically create tasks from emails
                </p>
              </div>

              {isLoading && !emailIntegrations.length ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-slate-600">Loading integrations...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailIntegrations.map((integration) => (
                    <div
                      key={integration.provider}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          integration.provider === 'zoho-mail' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {getProviderIcon(integration.provider)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {getProviderName(integration.provider)}
                            </h3>
                            {integration.provider === 'zoho-mail' && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {integration.connected ? integration.email : 'Not connected'}
                          </p>
                          {integration.connected && integration.lastSync && (
                            <p className="text-xs text-slate-500 mt-1">
                              Last synced {formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })}
                            </p>
                          )}
                          {integration.status === 'error' && integration.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">
                              {integration.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(integration.status)}
                        {integration.connected ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => syncEmail(integration.provider)}
                              disabled={integration.status === 'syncing'}
                              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Sync Now
                            </button>
                            <button
                              onClick={() => disconnectEmail(integration.provider)}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => connectEmail(integration.provider)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">About Email Integration</p>
                    <p className="text-blue-800">
                      When connected, the system will monitor your inbox for emails that can be converted to tasks.
                      You'll receive notifications for new tasks created from emails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Profile Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-slate-100 text-slate-900 rounded-md font-medium">
                      {user?.role || 'Member'}
                    </span>
                    <span className="text-sm text-slate-500">
                      (Read-only, contact admin to change)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={user?.department || 'Not assigned'}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
