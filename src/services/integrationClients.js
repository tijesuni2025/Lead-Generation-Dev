/**
 * Integration API Clients
 * Real API implementations for all integrations
 */

import { integrationConfig, INTEGRATIONS } from './integrationConfig';

// ============================================================================
// BASE API CLIENT
// ============================================================================

class BaseAPIClient {
  constructor(integrationId) {
    this.integrationId = integrationId;
    this.integration = INTEGRATIONS[integrationId];
  }

  getConfig() {
    return integrationConfig.getConfig(this.integrationId);
  }

  isConnected() {
    return integrationConfig.isConnected(this.integrationId);
  }

  async request(url, options = {}) {
    const config = this.getConfig();
    if (!config) throw new Error(`${this.integration.name} not configured`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(config),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  getAuthHeaders(config) {
    // Override in subclasses
    return {};
  }
}

// ============================================================================
// HUBSPOT CLIENT
// ============================================================================

export class HubSpotClient extends BaseAPIClient {
  constructor() {
    super('hubspot');
    this.baseUrl = 'https://api.hubapi.com';
  }

  getAuthHeaders(config) {
    return { 'Authorization': `Bearer ${config.accessToken}` };
  }

  // Contacts
  async getContacts(limit = 100, after = null) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (after) params.append('after', after);
    
    return this.request(`${this.baseUrl}/crm/v3/objects/contacts?${params}`);
  }

  async createContact(properties) {
    return this.request(`${this.baseUrl}/crm/v3/objects/contacts`, {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  async updateContact(contactId, properties) {
    return this.request(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
  }

  async searchContacts(filters, limit = 100) {
    return this.request(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters }],
        limit,
      }),
    });
  }

  // Deals
  async getDeals(limit = 100) {
    return this.request(`${this.baseUrl}/crm/v3/objects/deals?limit=${limit}`);
  }

  async createDeal(properties) {
    return this.request(`${this.baseUrl}/crm/v3/objects/deals`, {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  // Sync lead to HubSpot
  async syncLead(lead) {
    const properties = {
      email: lead.email,
      firstname: lead.name.split(' ')[0],
      lastname: lead.name.split(' ').slice(1).join(' '),
      company: lead.company,
      jobtitle: lead.title,
      phone: lead.phone,
      leadscore: String(lead.score || 0),
    };

    // Try to find existing contact by email
    try {
      const search = await this.searchContacts([
        { propertyName: 'email', operator: 'EQ', value: lead.email }
      ], 1);

      if (search.results?.length > 0) {
        return this.updateContact(search.results[0].id, properties);
      }
    } catch (e) {
      // Contact not found, create new
    }

    return this.createContact(properties);
  }
}

// ============================================================================
// PIPEDRIVE CLIENT
// ============================================================================

export class PipedriveClient extends BaseAPIClient {
  constructor() {
    super('pipedrive');
  }

  get baseUrl() {
    const config = this.getConfig();
    return `https://${config?.companyDomain || 'api'}.pipedrive.com/api/v1`;
  }

  buildUrl(endpoint) {
    const config = this.getConfig();
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${this.baseUrl}${endpoint}${separator}api_token=${config.apiToken}`;
  }

  async request(endpoint, options = {}) {
    const config = this.getConfig();
    if (!config) throw new Error('Pipedrive not configured');

    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Pipedrive API error');
    }

    return data;
  }

  // Persons (Contacts)
  async getPersons(start = 0, limit = 100) {
    return this.request(`/persons?start=${start}&limit=${limit}`);
  }

  async createPerson(data) {
    return this.request('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerson(personId, data) {
    return this.request(`/persons/${personId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async searchPersons(term) {
    return this.request(`/persons/search?term=${encodeURIComponent(term)}`);
  }

  // Deals
  async getDeals(start = 0, limit = 100) {
    return this.request(`/deals?start=${start}&limit=${limit}`);
  }

  async createDeal(data) {
    return this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sync lead to Pipedrive
  async syncLead(lead) {
    const personData = {
      name: lead.name,
      email: [{ value: lead.email, primary: true }],
      phone: lead.phone ? [{ value: lead.phone, primary: true }] : undefined,
    };

    // Search for existing person by email
    try {
      const search = await this.searchPersons(lead.email);
      if (search.data?.items?.length > 0) {
        const existingId = search.data.items[0].item.id;
        return this.updatePerson(existingId, personData);
      }
    } catch (e) {
      // Not found, create new
    }

    return this.createPerson(personData);
  }
}

// ============================================================================
// SENDGRID CLIENT
// ============================================================================

export class SendGridClient extends BaseAPIClient {
  constructor() {
    super('sendgrid');
    this.baseUrl = 'https://api.sendgrid.com/v3';
  }

  getAuthHeaders(config) {
    return { 'Authorization': `Bearer ${config.apiKey}` };
  }

  async sendEmail({ to, subject, html, text }) {
    const config = this.getConfig();
    
    return this.request(`${this.baseUrl}/mail/send`, {
      method: 'POST',
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { 
          email: config.fromEmail, 
          name: config.fromName 
        },
        subject,
        content: [
          ...(text ? [{ type: 'text/plain', value: text }] : []),
          ...(html ? [{ type: 'text/html', value: html }] : []),
        ],
      }),
    });
  }

  async sendBulkEmails(emails) {
    // SendGrid supports up to 1000 personalizations per request
    const results = [];
    
    for (const email of emails) {
      try {
        await this.sendEmail(email);
        results.push({ email: email.to, success: true });
      } catch (error) {
        results.push({ email: email.to, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async getStats(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    
    return this.request(`${this.baseUrl}/stats?${params}`);
  }
}

// ============================================================================
// TWILIO CLIENT
// ============================================================================

export class TwilioClient extends BaseAPIClient {
  constructor() {
    super('twilio');
  }

  get baseUrl() {
    const config = this.getConfig();
    return `https://api.twilio.com/2010-04-01/Accounts/${config?.accountSid}`;
  }

  getAuthHeaders(config) {
    const auth = btoa(`${config.accountSid}:${config.authToken}`);
    return { 'Authorization': `Basic ${auth}` };
  }

  async sendSMS(to, body) {
    const config = this.getConfig();
    
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', config.phoneNumber);
    formData.append('Body', body);

    const response = await fetch(`${this.baseUrl}/Messages.json`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(config),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    return response.json();
  }

  async getMessages(limit = 50) {
    const config = this.getConfig();
    
    const response = await fetch(`${this.baseUrl}/Messages.json?PageSize=${limit}`, {
      headers: this.getAuthHeaders(config),
    });

    return response.json();
  }

  async makeCall(to, twiml) {
    const config = this.getConfig();
    
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', config.phoneNumber);
    formData.append('Twiml', twiml);

    const response = await fetch(`${this.baseUrl}/Calls.json`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(config),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    return response.json();
  }
}

// ============================================================================
// CLEARBIT CLIENT
// ============================================================================

export class ClearbitClient extends BaseAPIClient {
  constructor() {
    super('clearbit');
  }

  getAuthHeaders(config) {
    return { 'Authorization': `Bearer ${config.apiKey}` };
  }

  async enrichCompany(domain) {
    return this.request(
      `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`
    );
  }

  async enrichPerson(email) {
    return this.request(
      `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`
    );
  }

  async enrichLead(lead) {
    const results = { lead };
    
    // Enrich person by email
    if (lead.email) {
      try {
        results.person = await this.enrichPerson(lead.email);
      } catch (e) {
        results.personError = e.message;
      }
    }

    // Enrich company by domain
    const domain = lead.email?.split('@')[1];
    if (domain) {
      try {
        results.company = await this.enrichCompany(domain);
      } catch (e) {
        results.companyError = e.message;
      }
    }

    return results;
  }
}

// ============================================================================
// APOLLO CLIENT
// ============================================================================

export class ApolloClient extends BaseAPIClient {
  constructor() {
    super('apollo');
    this.baseUrl = 'https://api.apollo.io/v1';
  }

  async request(endpoint, options = {}) {
    const config = this.getConfig();
    if (!config) throw new Error('Apollo not configured');

    const body = options.body ? JSON.parse(options.body) : {};
    body.api_key = config.apiKey;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  async enrichPerson(email) {
    return this.request('/people/match', {
      body: JSON.stringify({ email }),
    });
  }

  async enrichOrganization(domain) {
    return this.request('/organizations/enrich', {
      body: JSON.stringify({ domain }),
    });
  }

  async searchPeople(filters = {}) {
    return this.request('/mixed_people/search', {
      body: JSON.stringify({
        person_titles: filters.titles,
        person_locations: filters.locations,
        organization_industry_tag_ids: filters.industries,
        page: filters.page || 1,
        per_page: filters.perPage || 25,
      }),
    });
  }

  async enrichLead(lead) {
    const results = { lead };
    
    if (lead.email) {
      try {
        const personResult = await this.enrichPerson(lead.email);
        results.person = personResult.person;
        results.organization = personResult.organization;
      } catch (e) {
        results.error = e.message;
      }
    }

    return results;
  }
}

// ============================================================================
// ZEROBOUNCE CLIENT (Email Verification)
// ============================================================================

export class ZeroBounceClient extends BaseAPIClient {
  constructor() {
    super('zerobounce');
    this.baseUrl = 'https://api.zerobounce.net/v2';
  }

  async verifyEmail(email) {
    const config = this.getConfig();
    
    const response = await fetch(
      `${this.baseUrl}/validate?api_key=${config.apiKey}&email=${encodeURIComponent(email)}`
    );

    return response.json();
  }

  async verifyBatch(emails) {
    const config = this.getConfig();
    
    const response = await fetch(`${this.baseUrl}/validatebatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.apiKey,
        email_batch: emails.map(email => ({ email_address: email })),
      }),
    });

    return response.json();
  }

  async getCredits() {
    const config = this.getConfig();
    
    const response = await fetch(
      `${this.baseUrl}/getcredits?api_key=${config.apiKey}`
    );

    return response.json();
  }
}

// ============================================================================
// GOOGLE CALENDAR CLIENT
// ============================================================================

export class GoogleCalendarClient extends BaseAPIClient {
  constructor() {
    super('google_calendar');
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  getAuthHeaders(config) {
    return { 'Authorization': `Bearer ${config.accessToken}` };
  }

  async getCalendars() {
    return this.request(`${this.baseUrl}/users/me/calendarList`);
  }

  async getEvents(calendarId = 'primary', timeMin, timeMax) {
    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    return this.request(`${this.baseUrl}/calendars/${calendarId}/events?${params}`);
  }

  async createEvent(calendarId = 'primary', event) {
    return this.request(`${this.baseUrl}/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async getFreeBusy(timeMin, timeMax, calendarIds = ['primary']) {
    return this.request(`${this.baseUrl}/freeBusy`, {
      method: 'POST',
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: calendarIds.map(id => ({ id })),
      }),
    });
  }

  async scheduleMeeting(attendeeEmail, startTime, endTime, title, description) {
    return this.createEvent('primary', {
      summary: title,
      description,
      start: { dateTime: startTime, timeZone: 'America/New_York' },
      end: { dateTime: endTime, timeZone: 'America/New_York' },
      attendees: [{ email: attendeeEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 30 },
        ],
      },
    });
  }
}

// ============================================================================
// UNIFIED INTEGRATION SERVICE
// ============================================================================

export class IntegrationService {
  constructor() {
    this.clients = {
      hubspot: new HubSpotClient(),
      pipedrive: new PipedriveClient(),
      sendgrid: new SendGridClient(),
      twilio: new TwilioClient(),
      clearbit: new ClearbitClient(),
      apollo: new ApolloClient(),
      zerobounce: new ZeroBounceClient(),
      google_calendar: new GoogleCalendarClient(),
    };
  }

  getClient(integrationId) {
    return this.clients[integrationId];
  }

  isAvailable(integrationId) {
    return integrationConfig.isConnected(integrationId);
  }

  // Sync lead to all connected CRMs
  async syncLeadToCRMs(lead) {
    const results = {};
    
    if (this.isAvailable('hubspot')) {
      try {
        results.hubspot = await this.clients.hubspot.syncLead(lead);
      } catch (e) {
        results.hubspot = { error: e.message };
      }
    }

    if (this.isAvailable('pipedrive')) {
      try {
        results.pipedrive = await this.clients.pipedrive.syncLead(lead);
      } catch (e) {
        results.pipedrive = { error: e.message };
      }
    }

    return results;
  }

  // Enrich lead with all available enrichment services
  async enrichLead(lead) {
    const results = { lead };

    if (this.isAvailable('clearbit')) {
      try {
        const clearbitData = await this.clients.clearbit.enrichLead(lead);
        results.clearbit = clearbitData;
      } catch (e) {
        results.clearbitError = e.message;
      }
    }

    if (this.isAvailable('apollo')) {
      try {
        const apolloData = await this.clients.apollo.enrichLead(lead);
        results.apollo = apolloData;
      } catch (e) {
        results.apolloError = e.message;
      }
    }

    return results;
  }

  // Verify email
  async verifyEmail(email) {
    if (this.isAvailable('zerobounce')) {
      return this.clients.zerobounce.verifyEmail(email);
    }
    throw new Error('No email verification service configured');
  }

  // Send email
  async sendEmail(options) {
    if (this.isAvailable('sendgrid')) {
      return this.clients.sendgrid.sendEmail(options);
    }
    throw new Error('No email service configured');
  }

  // Send SMS
  async sendSMS(to, body) {
    if (this.isAvailable('twilio')) {
      return this.clients.twilio.sendSMS(to, body);
    }
    throw new Error('No SMS service configured');
  }
}

// Singleton
export const integrationService = new IntegrationService();

export default IntegrationService;
