/**
 * CRM Integration Service
 * Bi-directional sync with Salesforce, HubSpot, Pipedrive
 * 
 * Features:
 * - OAuth authentication
 * - Field mapping
 * - Bi-directional sync
 * - Conflict resolution
 * - Sync history & logs
 */

// ============================================================================
// CRM PROVIDERS
// ============================================================================

export const CRM_PROVIDERS = {
  SALESFORCE: 'salesforce',
  HUBSPOT: 'hubspot',
  PIPEDRIVE: 'pipedrive',
  ZOHO: 'zoho',
  CLOSE: 'close',
};

export const SYNC_DIRECTION = {
  PUSH: 'push',      // LeadGen -> CRM
  PULL: 'pull',      // CRM -> LeadGen
  BIDIRECTIONAL: 'bidirectional',
};

export const SYNC_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  SYNCING: 'syncing',
  ERROR: 'error',
  PENDING: 'pending',
};

export const OBJECT_TYPES = {
  LEAD: 'lead',
  CONTACT: 'contact',
  ACCOUNT: 'account',
  OPPORTUNITY: 'opportunity',
  TASK: 'task',
  NOTE: 'note',
};

// ============================================================================
// FIELD MAPPINGS
// ============================================================================

const DEFAULT_FIELD_MAPPINGS = {
  salesforce: {
    lead: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      title: 'Title',
      status: 'Status',
      score: 'Lead_Score__c',
      source: 'LeadSource',
      value: 'Estimated_Value__c',
    },
    contact: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Account.Name',
      title: 'Title',
    },
  },
  hubspot: {
    contact: {
      name: 'firstname,lastname',
      email: 'email',
      phone: 'phone',
      company: 'company',
      title: 'jobtitle',
      status: 'lifecyclestage',
      score: 'hubspotscore',
      source: 'hs_analytics_source',
    },
    deal: {
      value: 'amount',
      status: 'dealstage',
      name: 'dealname',
    },
  },
  pipedrive: {
    person: {
      name: 'name',
      email: 'email.0.value',
      phone: 'phone.0.value',
      company: 'org_id.name',
    },
    deal: {
      value: 'value',
      status: 'stage_id',
      name: 'title',
    },
  },
};

// ============================================================================
// CRM SERVICE
// ============================================================================

class CRMService {
  constructor() {
    this.connections = new Map();
    this.syncLogs = [];
    this.fieldMappings = new Map();
  }

  // ===== CONNECTION MANAGEMENT =====

  // Initialize connection (OAuth flow would happen here)
  async connect(provider, credentials) {
    // In production, this would:
    // 1. Redirect to OAuth authorization URL
    // 2. Handle callback with auth code
    // 3. Exchange for access/refresh tokens
    // 4. Store encrypted tokens

    const connection = {
      id: `conn-${Date.now()}`,
      provider,
      status: SYNC_STATUS.CONNECTED,
      connectedAt: new Date().toISOString(),
      lastSyncAt: null,
      settings: {
        syncDirection: SYNC_DIRECTION.BIDIRECTIONAL,
        syncInterval: 15, // minutes
        objectTypes: [OBJECT_TYPES.LEAD, OBJECT_TYPES.CONTACT],
        autoSync: true,
      },
      credentials: {
        // In production, these would be encrypted
        accessToken: credentials.accessToken || 'mock-token',
        refreshToken: credentials.refreshToken || 'mock-refresh',
        instanceUrl: credentials.instanceUrl || 'https://api.example.com',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      stats: {
        totalSynced: 0,
        lastSyncCount: 0,
        errors: 0,
      },
    };

    this.connections.set(provider, connection);
    this.fieldMappings.set(provider, DEFAULT_FIELD_MAPPINGS[provider] || {});
    
    this.log('connect', provider, 'success', `Connected to ${provider}`);
    
    return connection;
  }

  // Disconnect CRM
  disconnect(provider) {
    const connection = this.connections.get(provider);
    if (!connection) throw new Error('Connection not found');

    connection.status = SYNC_STATUS.DISCONNECTED;
    this.connections.delete(provider);
    
    this.log('disconnect', provider, 'success', `Disconnected from ${provider}`);
    
    return true;
  }

  // Get connection status
  getConnection(provider) {
    return this.connections.get(provider);
  }

  // List all connections
  listConnections() {
    return Array.from(this.connections.values());
  }

  // ===== FIELD MAPPING =====

  // Get field mappings for provider
  getFieldMappings(provider) {
    return this.fieldMappings.get(provider) || {};
  }

  // Update field mapping
  updateFieldMapping(provider, objectType, mappings) {
    const current = this.fieldMappings.get(provider) || {};
    current[objectType] = { ...current[objectType], ...mappings };
    this.fieldMappings.set(provider, current);
    return current;
  }

  // ===== SYNC OPERATIONS =====

  // Sync leads to CRM
  async pushLeads(provider, leads) {
    const connection = this.connections.get(provider);
    if (!connection || connection.status !== SYNC_STATUS.CONNECTED) {
      throw new Error('CRM not connected');
    }

    connection.status = SYNC_STATUS.SYNCING;
    const results = { success: [], failed: [] };

    for (const lead of leads) {
      try {
        const mapped = this.mapLeadToCRM(provider, lead);
        // In production: await this.apiClient.create(provider, 'lead', mapped);
        
        results.success.push({
          leadId: lead.id,
          crmId: `crm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mappedData: mapped,
        });
      } catch (error) {
        results.failed.push({
          leadId: lead.id,
          error: error.message,
        });
      }
    }

    connection.status = SYNC_STATUS.CONNECTED;
    connection.lastSyncAt = new Date().toISOString();
    connection.stats.totalSynced += results.success.length;
    connection.stats.lastSyncCount = results.success.length;
    connection.stats.errors += results.failed.length;

    this.log('push', provider, 'success', 
      `Pushed ${results.success.length} leads, ${results.failed.length} failed`);

    return results;
  }

  // Pull leads from CRM
  async pullLeads(provider, options = {}) {
    const connection = this.connections.get(provider);
    if (!connection || connection.status !== SYNC_STATUS.CONNECTED) {
      throw new Error('CRM not connected');
    }

    connection.status = SYNC_STATUS.SYNCING;

    // In production, this would fetch from actual CRM API
    // Mock data for demonstration
    const crmLeads = this.generateMockCRMLeads(provider, options.limit || 10);

    const mappedLeads = crmLeads.map(crmLead => 
      this.mapCRMToLead(provider, crmLead)
    );

    connection.status = SYNC_STATUS.CONNECTED;
    connection.lastSyncAt = new Date().toISOString();
    connection.stats.totalSynced += mappedLeads.length;
    connection.stats.lastSyncCount = mappedLeads.length;

    this.log('pull', provider, 'success', `Pulled ${mappedLeads.length} leads`);

    return mappedLeads;
  }

  // Full bidirectional sync
  async syncAll(provider) {
    const connection = this.connections.get(provider);
    if (!connection) throw new Error('Connection not found');

    const results = {
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Pull from CRM
      const pulled = await this.pullLeads(provider, { limit: 100 });
      results.pulled = pulled.length;

      // In production, would compare and resolve conflicts
      // Then push updates back

    } catch (error) {
      results.errors.push(error.message);
      this.log('sync', provider, 'error', error.message);
    }

    return results;
  }

  // ===== MAPPING HELPERS =====

  mapLeadToCRM(provider, lead) {
    const mappings = this.fieldMappings.get(provider)?.lead || {};
    const mapped = {};

    Object.entries(mappings).forEach(([localField, crmField]) => {
      if (lead[localField] !== undefined) {
        // Handle nested fields (e.g., "Account.Name")
        if (crmField.includes('.')) {
          const parts = crmField.split('.');
          let current = mapped;
          for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = current[parts[i]] || {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = lead[localField];
        } else {
          mapped[crmField] = lead[localField];
        }
      }
    });

    return mapped;
  }

  mapCRMToLead(provider, crmRecord) {
    const mappings = this.fieldMappings.get(provider)?.lead || {};
    const lead = { crmId: crmRecord.id, crmProvider: provider };

    Object.entries(mappings).forEach(([localField, crmField]) => {
      // Handle nested fields
      let value = crmRecord;
      const parts = crmField.split('.');
      for (const part of parts) {
        value = value?.[part];
      }
      if (value !== undefined) {
        lead[localField] = value;
      }
    });

    return lead;
  }

  generateMockCRMLeads(provider, count) {
    const names = ['Alex Rivera', 'Jordan Kim', 'Taylor Chen', 'Morgan Lee', 'Casey Park'];
    const companies = ['TechFlow Inc', 'DataWave', 'CloudSync', 'Innovate Labs', 'GrowthCo'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `crm-${provider}-${i + 1}`,
      Name: names[i % names.length],
      Email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@${companies[i % companies.length].toLowerCase().replace(' ', '')}.com`,
      Phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      Company: companies[i % companies.length],
      Title: ['CEO', 'VP Sales', 'Director', 'Manager'][Math.floor(Math.random() * 4)],
      Status: ['Open', 'Working', 'Qualified', 'Closed'][Math.floor(Math.random() * 4)],
      CreatedDate: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
    }));
  }

  // ===== LOGGING =====

  log(action, provider, status, message) {
    this.syncLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      provider,
      status,
      message,
    });

    // Keep only last 100 logs
    if (this.syncLogs.length > 100) {
      this.syncLogs = this.syncLogs.slice(0, 100);
    }
  }

  getSyncLogs(provider = null, limit = 20) {
    let logs = this.syncLogs;
    if (provider) {
      logs = logs.filter(l => l.provider === provider);
    }
    return logs.slice(0, limit);
  }
}

// ============================================================================
// PROVIDER-SPECIFIC CONFIGURATIONS
// ============================================================================

export const CRM_CONFIGS = {
  salesforce: {
    name: 'Salesforce',
    icon: 'salesforce',
    color: '#00A1E0',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token', 'offline_access'],
    objects: ['Lead', 'Contact', 'Account', 'Opportunity', 'Task'],
  },
  hubspot: {
    name: 'HubSpot',
    icon: 'hubspot',
    color: '#FF7A59',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['contacts', 'crm.objects.deals.read', 'crm.objects.deals.write'],
    objects: ['Contact', 'Company', 'Deal', 'Task'],
  },
  pipedrive: {
    name: 'Pipedrive',
    icon: 'pipedrive',
    color: '#017737',
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    scopes: ['deals:full', 'persons:full', 'organizations:full'],
    objects: ['Person', 'Organization', 'Deal', 'Activity'],
  },
  zoho: {
    name: 'Zoho CRM',
    icon: 'zoho',
    color: '#C8202B',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    scopes: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL'],
    objects: ['Lead', 'Contact', 'Account', 'Deal', 'Task'],
  },
};

// Singleton instance
export const crmService = new CRMService();

export default CRMService;
