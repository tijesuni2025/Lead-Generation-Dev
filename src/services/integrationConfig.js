/**
 * Integration Configuration Service
 * Manages API credentials and connection setup for all integrations
 */

// Storage key for persisting configs (localStorage in browser)
const STORAGE_KEY = 'leadgen_integrations';

// ============================================================================
// INTEGRATION DEFINITIONS
// ============================================================================

export const INTEGRATIONS = {
  // CRM Integrations
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Sync leads and contacts with Salesforce CRM',
    authType: 'oauth2',
    color: '#00A1E0',
    docsUrl: 'https://developer.salesforce.com/docs',
    setupSteps: [
      'Go to Salesforce Setup > Apps > App Manager',
      'Click "New Connected App"',
      'Enable OAuth Settings',
      'Add callback URL: {callback_url}',
      'Select scopes: api, refresh_token, offline_access',
      'Save and copy Consumer Key & Secret',
    ],
    requiredFields: [
      { key: 'clientId', label: 'Consumer Key', type: 'text', placeholder: '3MVG9...' },
      { key: 'clientSecret', label: 'Consumer Secret', type: 'password', placeholder: 'Your consumer secret' },
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://yourorg.salesforce.com' },
    ],
    oauthConfig: {
      authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      scopes: ['api', 'refresh_token', 'offline_access'],
    },
  },
  
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Sync contacts and deals with HubSpot CRM',
    authType: 'oauth2',
    color: '#FF7A59',
    docsUrl: 'https://developers.hubspot.com/docs',
    setupSteps: [
      'Go to HubSpot > Settings > Integrations > Private Apps',
      'Click "Create a private app"',
      'Name your app and select scopes',
      'Required scopes: crm.objects.contacts, crm.objects.deals',
      'Copy your Access Token',
    ],
    requiredFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'pat-na1-...' },
    ],
    // HubSpot private apps use access tokens directly
  },
  
  pipedrive: {
    id: 'pipedrive',
    name: 'Pipedrive',
    category: 'crm',
    description: 'Sync persons and deals with Pipedrive',
    authType: 'apikey',
    color: '#017737',
    docsUrl: 'https://developers.pipedrive.com/docs',
    setupSteps: [
      'Go to Pipedrive > Settings > Personal Preferences',
      'Click on "API" tab',
      'Copy your API Token',
    ],
    requiredFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Your Pipedrive API token' },
      { key: 'companyDomain', label: 'Company Domain', type: 'text', placeholder: 'yourcompany (from yourcompany.pipedrive.com)' },
    ],
  },

  // Calendar Integrations
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Sync meetings and enable booking links',
    authType: 'oauth2',
    color: '#4285F4',
    docsUrl: 'https://developers.google.com/calendar',
    setupSteps: [
      'Go to Google Cloud Console > APIs & Services',
      'Create a new project or select existing',
      'Enable Google Calendar API',
      'Go to Credentials > Create Credentials > OAuth Client ID',
      'Application type: Web application',
      'Add authorized redirect URI: {callback_url}',
      'Copy Client ID and Client Secret',
    ],
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: '123456789.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-...' },
    ],
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    },
  },
  
  outlook_calendar: {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    description: 'Sync with Microsoft Outlook calendar',
    authType: 'oauth2',
    color: '#0078D4',
    docsUrl: 'https://docs.microsoft.com/en-us/graph/api/resources/calendar',
    setupSteps: [
      'Go to Azure Portal > App Registrations',
      'Click "New Registration"',
      'Add redirect URI: {callback_url}',
      'Go to Certificates & Secrets > New Client Secret',
      'Go to API Permissions > Add: Calendars.ReadWrite',
      'Copy Application (client) ID and Secret',
    ],
    requiredFields: [
      { key: 'clientId', label: 'Application (Client) ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your client secret' },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'common or your tenant ID' },
    ],
    oauthConfig: {
      authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
      scopes: ['Calendars.ReadWrite', 'offline_access'],
    },
  },

  // Enrichment Integrations  
  clearbit: {
    id: 'clearbit',
    name: 'Clearbit',
    category: 'enrichment',
    description: 'Enrich leads with company and contact data',
    authType: 'apikey',
    color: '#3B82F6',
    docsUrl: 'https://clearbit.com/docs',
    setupSteps: [
      'Sign up at clearbit.com',
      'Go to API > API Keys',
      'Copy your API Key',
    ],
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk_...' },
    ],
    endpoints: {
      enrichCompany: 'https://company.clearbit.com/v2/companies/find',
      enrichPerson: 'https://person.clearbit.com/v2/people/find',
    },
  },
  
  apollo: {
    id: 'apollo',
    name: 'Apollo.io',
    category: 'enrichment',
    description: 'B2B contact database and enrichment',
    authType: 'apikey',
    color: '#5B5FC7',
    docsUrl: 'https://apolloio.github.io/apollo-api-docs/',
    setupSteps: [
      'Log into Apollo.io',
      'Go to Settings > Integrations > API Keys',
      'Click "Create New Key"',
      'Copy your API Key',
    ],
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Apollo API key' },
    ],
    endpoints: {
      enrichPerson: 'https://api.apollo.io/v1/people/match',
      enrichOrganization: 'https://api.apollo.io/v1/organizations/enrich',
      search: 'https://api.apollo.io/v1/mixed_people/search',
    },
  },

  // Email Integrations
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'email',
    description: 'Send emails through SendGrid',
    authType: 'apikey',
    color: '#1A82E2',
    docsUrl: 'https://docs.sendgrid.com/',
    setupSteps: [
      'Log into SendGrid',
      'Go to Settings > API Keys',
      'Click "Create API Key"',
      'Select "Full Access" or custom permissions',
      'Copy your API Key (shown only once)',
    ],
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG.xxxx...' },
      { key: 'fromEmail', label: 'From Email', type: 'email', placeholder: 'noreply@yourdomain.com' },
      { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Company' },
    ],
  },

  // Communication Integrations
  twilio: {
    id: 'twilio',
    name: 'Twilio',
    category: 'communication',
    description: 'SMS and voice calls via Twilio',
    authType: 'apikey',
    color: '#F22F46',
    docsUrl: 'https://www.twilio.com/docs',
    setupSteps: [
      'Log into Twilio Console',
      'Copy Account SID from dashboard',
      'Copy Auth Token from dashboard',
      'Get a phone number from Phone Numbers > Manage > Buy a Number',
    ],
    requiredFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Your auth token' },
      { key: 'phoneNumber', label: 'Twilio Phone Number', type: 'text', placeholder: '+1234567890' },
    ],
  },

  // Verification
  zerobounce: {
    id: 'zerobounce',
    name: 'ZeroBounce',
    category: 'verification',
    description: 'Email verification and validation',
    authType: 'apikey',
    color: '#00D4AA',
    docsUrl: 'https://www.zerobounce.net/docs/',
    setupSteps: [
      'Sign up at zerobounce.net',
      'Go to API > API Keys',
      'Copy your API Key',
    ],
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your ZeroBounce API key' },
    ],
    endpoints: {
      validate: 'https://api.zerobounce.net/v2/validate',
      validateBatch: 'https://api.zerobounce.net/v2/validatebatch',
    },
  },
  
  neverbounce: {
    id: 'neverbounce',
    name: 'NeverBounce',
    category: 'verification',
    description: 'Real-time email verification',
    authType: 'apikey',
    color: '#2ECC71',
    docsUrl: 'https://developers.neverbounce.com/',
    setupSteps: [
      'Sign up at neverbounce.com',
      'Go to Settings > API',
      'Copy your API Key',
    ],
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your NeverBounce API key' },
    ],
  },
};

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

class IntegrationConfigManager {
  constructor() {
    this.configs = this.loadConfigs();
    this.listeners = [];
  }

  // Load configs from localStorage
  loadConfigs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load integration configs:', e);
      return {};
    }
  }

  // Save configs to localStorage
  saveConfigs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.configs));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save integration configs:', e);
    }
  }

  // Get config for an integration
  getConfig(integrationId) {
    return this.configs[integrationId] || null;
  }

  // Check if integration is configured
  isConfigured(integrationId) {
    const config = this.configs[integrationId];
    if (!config) return false;
    
    const integration = INTEGRATIONS[integrationId];
    if (!integration) return false;
    
    // Check all required fields are filled
    return integration.requiredFields.every(field => 
      config[field.key] && config[field.key].trim() !== ''
    );
  }

  // Check if integration is connected (configured + tokens valid)
  isConnected(integrationId) {
    const config = this.configs[integrationId];
    if (!config || !this.isConfigured(integrationId)) return false;
    
    // For OAuth integrations, check if we have valid tokens
    const integration = INTEGRATIONS[integrationId];
    if (integration.authType === 'oauth2') {
      return config.accessToken && (!config.expiresAt || new Date(config.expiresAt) > new Date());
    }
    
    return true;
  }

  // Save integration config
  saveConfig(integrationId, config) {
    this.configs[integrationId] = {
      ...this.configs[integrationId],
      ...config,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfigs();
  }

  // Remove integration config
  removeConfig(integrationId) {
    delete this.configs[integrationId];
    this.saveConfigs();
  }

  // Save OAuth tokens
  saveTokens(integrationId, tokens) {
    this.configs[integrationId] = {
      ...this.configs[integrationId],
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() 
        : null,
      tokenType: tokens.token_type,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfigs();
  }

  // Get all configured integrations
  getConfiguredIntegrations() {
    return Object.keys(this.configs).filter(id => this.isConfigured(id));
  }

  // Subscribe to config changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(l => l(this.configs));
  }

  // Generate OAuth authorization URL
  getOAuthUrl(integrationId, redirectUri) {
    const integration = INTEGRATIONS[integrationId];
    const config = this.configs[integrationId];
    
    if (!integration?.oauthConfig || !config?.clientId) return null;
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: integration.oauthConfig.scopes.join(' '),
      state: integrationId,
      access_type: 'offline',
      prompt: 'consent',
    });
    
    let authUrl = integration.oauthConfig.authUrl;
    if (config.tenantId) {
      authUrl = authUrl.replace('{tenantId}', config.tenantId);
    }
    
    return `${authUrl}?${params.toString()}`;
  }

  // Export configs (for backup)
  exportConfigs() {
    const exported = {};
    for (const [id, config] of Object.entries(this.configs)) {
      // Don't export sensitive tokens
      const { accessToken, refreshToken, ...safeConfig } = config;
      exported[id] = safeConfig;
    }
    return exported;
  }

  // Test connection for an integration
  async testConnection(integrationId) {
    const integration = INTEGRATIONS[integrationId];
    const config = this.configs[integrationId];
    
    if (!integration || !config) {
      return { success: false, error: 'Integration not configured' };
    }

    try {
      // Integration-specific test endpoints
      switch (integrationId) {
        case 'hubspot':
          return await this.testHubSpot(config);
        case 'pipedrive':
          return await this.testPipedrive(config);
        case 'sendgrid':
          return await this.testSendGrid(config);
        case 'clearbit':
          return await this.testClearbit(config);
        case 'apollo':
          return await this.testApollo(config);
        case 'twilio':
          return await this.testTwilio(config);
        case 'zerobounce':
          return await this.testZeroBounce(config);
        default:
          return { success: true, message: 'Configuration saved (test not available)' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testHubSpot(config) {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: { 'Authorization': `Bearer ${config.accessToken}` }
    });
    if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`);
    return { success: true, message: 'Connected to HubSpot successfully' };
  }

  async testPipedrive(config) {
    const response = await fetch(
      `https://${config.companyDomain}.pipedrive.com/api/v1/users/me?api_token=${config.apiToken}`
    );
    if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`);
    return { success: true, message: 'Connected to Pipedrive successfully' };
  }

  async testSendGrid(config) {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`);
    return { success: true, message: 'Connected to SendGrid successfully' };
  }

  async testClearbit(config) {
    const response = await fetch('https://company.clearbit.com/v2/companies/find?domain=clearbit.com', {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    if (!response.ok) throw new Error(`Clearbit API error: ${response.status}`);
    return { success: true, message: 'Connected to Clearbit successfully' };
  }

  async testApollo(config) {
    const response = await fetch('https://api.apollo.io/v1/auth/health', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ api_key: config.apiKey })
    });
    if (!response.ok) throw new Error(`Apollo API error: ${response.status}`);
    return { success: true, message: 'Connected to Apollo successfully' };
  }

  async testTwilio(config) {
    const auth = btoa(`${config.accountSid}:${config.authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`,
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    if (!response.ok) throw new Error(`Twilio API error: ${response.status}`);
    return { success: true, message: 'Connected to Twilio successfully' };
  }

  async testZeroBounce(config) {
    const response = await fetch(
      `https://api.zerobounce.net/v2/getcredits?api_key=${config.apiKey}`
    );
    if (!response.ok) throw new Error(`ZeroBounce API error: ${response.status}`);
    const data = await response.json();
    return { success: true, message: `Connected. Credits remaining: ${data.Credits}` };
  }
}

// Singleton instance
export const integrationConfig = new IntegrationConfigManager();

// ============================================================================
// ENVIRONMENT TEMPLATE GENERATOR
// ============================================================================

export function generateEnvTemplate() {
  const lines = [
    '# LeadGen Pro Integration Configuration',
    '# Copy this file to .env.local and fill in your credentials',
    '',
  ];

  const categories = {
    crm: '# CRM Integrations',
    calendar: '# Calendar Integrations', 
    enrichment: '# Data Enrichment',
    email: '# Email Services',
    communication: '# Communication (SMS/Voice)',
    verification: '# Email Verification',
  };

  for (const [category, header] of Object.entries(categories)) {
    const integrations = Object.values(INTEGRATIONS).filter(i => i.category === category);
    if (integrations.length === 0) continue;

    lines.push(header);
    
    for (const integration of integrations) {
      lines.push(`# ${integration.name}`);
      for (const field of integration.requiredFields) {
        const envKey = `${integration.id.toUpperCase()}_${field.key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        lines.push(`${envKey}=`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export default IntegrationConfigManager;
