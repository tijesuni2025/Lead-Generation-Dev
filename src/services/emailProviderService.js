/**
 * Email Provider Integration Service
 * Supports Gmail, Outlook, and Custom SMTP
 * 
 * Features:
 * - OAuth2 authentication for Gmail/Outlook
 * - Email sending with deliverability optimization
 * - Domain verification and DNS management
 * - Email warmup scheduling
 * - Spam score checking
 * - Rate limiting and throttling
 */

// ============================================================================
// PROVIDER CONFIGURATIONS
// ============================================================================

export const EMAIL_PROVIDERS = {
  GMAIL: {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    icon: 'mail',
    authType: 'oauth2',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    sendEndpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    dailyLimit: 500, // Google Workspace limit
    rateLimitPerSecond: 1,
    features: ['tracking', 'scheduling', 'threads'],
  },
  OUTLOOK: {
    id: 'outlook',
    name: 'Microsoft Outlook / 365',
    icon: 'mail',
    authType: 'oauth2',
    scopes: [
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/User.Read',
    ],
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    sendEndpoint: 'https://graph.microsoft.com/v1.0/me/sendMail',
    dailyLimit: 10000, // Microsoft 365 limit
    rateLimitPerSecond: 4,
    features: ['tracking', 'scheduling', 'threads', 'categories'],
  },
  SMTP: {
    id: 'smtp',
    name: 'Custom SMTP',
    icon: 'server',
    authType: 'credentials',
    features: ['tracking'],
    dailyLimit: null, // Depends on provider
    rateLimitPerSecond: null,
  },
};

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  EXPIRED: 'expired',
};

export const WARMUP_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

// ============================================================================
// EMAIL PROVIDER SERVICE
// ============================================================================

class EmailProviderService {
  constructor() {
    this.connections = new Map();
    this.tokens = new Map();
    this.sendQueue = [];
    this.rateLimiters = new Map();
  }

  // ============================================================================
  // OAUTH AUTHENTICATION
  // ============================================================================

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(providerId, redirectUri, state = null) {
    const provider = EMAIL_PROVIDERS[providerId.toUpperCase()];
    if (!provider || provider.authType !== 'oauth2') {
      throw new Error('Invalid OAuth provider');
    }

    const params = new URLSearchParams({
      client_id: process.env[`${providerId.toUpperCase()}_CLIENT_ID`] || 'demo_client_id',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(providerId, code, redirectUri) {
    const provider = EMAIL_PROVIDERS[providerId.toUpperCase()];
    if (!provider) throw new Error('Invalid provider');

    // In production, this would make actual API call
    // For demo, simulate token exchange
    const mockTokens = {
      access_token: `mock_access_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: provider.scopes.join(' '),
    };

    const connection = {
      id: `conn_${Date.now()}`,
      providerId,
      email: 'user@example.com', // Would come from profile API
      status: CONNECTION_STATUS.CONNECTED,
      tokens: mockTokens,
      connectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + mockTokens.expires_in * 1000).toISOString(),
    };

    this.connections.set(connection.id, connection);
    this.tokens.set(connection.id, mockTokens);

    return connection;
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');

    const tokens = this.tokens.get(connectionId);
    if (!tokens?.refresh_token) throw new Error('No refresh token available');

    // Mock token refresh
    const newTokens = {
      ...tokens,
      access_token: `mock_refreshed_${Date.now()}`,
      expires_in: 3600,
    };

    this.tokens.set(connectionId, newTokens);
    connection.expiresAt = new Date(Date.now() + 3600000).toISOString();
    connection.status = CONNECTION_STATUS.CONNECTED;

    return newTokens;
  }

  /**
   * Disconnect email account
   */
  disconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = CONNECTION_STATUS.DISCONNECTED;
      this.tokens.delete(connectionId);
    }
    return connection;
  }

  // ============================================================================
  // EMAIL SENDING
  // ============================================================================

  /**
   * Send email through connected provider
   */
  async sendEmail(connectionId, email) {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');
    if (connection.status !== CONNECTION_STATUS.CONNECTED) {
      throw new Error('Email account not connected');
    }

    // Check rate limit
    await this.checkRateLimit(connectionId);

    const provider = EMAIL_PROVIDERS[connection.providerId.toUpperCase()];
    
    // Build email with tracking pixel and link tracking
    const trackedEmail = this.addTracking(email);

    // In production, would call actual API
    // For demo, simulate send
    const result = {
      id: `msg_${Date.now()}`,
      threadId: `thread_${Date.now()}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
      provider: connection.providerId,
      tracking: {
        pixelId: trackedEmail.pixelId,
        links: trackedEmail.trackedLinks,
      },
    };

    // Update rate limiter
    this.updateRateLimit(connectionId);

    return result;
  }

  /**
   * Add tracking pixel and link tracking to email
   */
  addTracking(email) {
    const pixelId = `px_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trackingPixel = `<img src="https://track.bluestarai.com/open/${pixelId}" width="1" height="1" style="display:none" />`;
    
    // Track links
    const trackedLinks = [];
    let body = email.htmlBody || email.body;
    
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;
    body = body.replace(linkRegex, (match, url) => {
      const linkId = `lnk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      trackedLinks.push({ id: linkId, originalUrl: url });
      return `href="https://track.bluestarai.com/click/${linkId}"`;
    });

    // Append tracking pixel
    if (body.includes('</body>')) {
      body = body.replace('</body>', `${trackingPixel}</body>`);
    } else {
      body += trackingPixel;
    }

    return {
      ...email,
      htmlBody: body,
      pixelId,
      trackedLinks,
    };
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(connectionId) {
    const connection = this.connections.get(connectionId);
    const provider = EMAIL_PROVIDERS[connection.providerId.toUpperCase()];
    
    if (!this.rateLimiters.has(connectionId)) {
      this.rateLimiters.set(connectionId, {
        lastSend: 0,
        dailyCount: 0,
        dailyReset: Date.now() + 86400000,
      });
    }

    const limiter = this.rateLimiters.get(connectionId);
    
    // Check daily limit
    if (Date.now() > limiter.dailyReset) {
      limiter.dailyCount = 0;
      limiter.dailyReset = Date.now() + 86400000;
    }

    if (provider.dailyLimit && limiter.dailyCount >= provider.dailyLimit) {
      throw new Error(`Daily email limit reached (${provider.dailyLimit})`);
    }

    // Check rate limit
    if (provider.rateLimitPerSecond) {
      const minInterval = 1000 / provider.rateLimitPerSecond;
      const elapsed = Date.now() - limiter.lastSend;
      if (elapsed < minInterval) {
        await new Promise(r => setTimeout(r, minInterval - elapsed));
      }
    }
  }

  /**
   * Update rate limit after send
   */
  updateRateLimit(connectionId) {
    const limiter = this.rateLimiters.get(connectionId);
    if (limiter) {
      limiter.lastSend = Date.now();
      limiter.dailyCount++;
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Get all connections
   */
  listConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection by ID
   */
  getConnection(id) {
    return this.connections.get(id);
  }

  /**
   * Check connection health
   */
  async checkConnectionHealth(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return { healthy: false, error: 'Connection not found' };

    // Check if token is expired
    if (new Date(connection.expiresAt) < new Date()) {
      try {
        await this.refreshToken(connectionId);
      } catch (error) {
        connection.status = CONNECTION_STATUS.EXPIRED;
        return { healthy: false, error: 'Token expired and refresh failed' };
      }
    }

    return { healthy: true, connection };
  }
}

// ============================================================================
// DOMAIN VERIFICATION SERVICE
// ============================================================================

export const DNS_RECORD_TYPES = {
  SPF: 'spf',
  DKIM: 'dkim',
  DMARC: 'dmarc',
  MX: 'mx',
  CNAME: 'cname',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
};

class DomainVerificationService {
  constructor() {
    this.domains = new Map();
  }

  /**
   * Add domain for verification
   */
  addDomain(domain) {
    const domainRecord = {
      id: `dom_${Date.now()}`,
      domain: domain.toLowerCase(),
      status: VERIFICATION_STATUS.PENDING,
      addedAt: new Date().toISOString(),
      verifiedAt: null,
      dnsRecords: this.generateDNSRecords(domain),
      health: {
        spf: false,
        dkim: false,
        dmarc: false,
        reputation: 100,
        lastChecked: null,
      },
    };

    this.domains.set(domainRecord.id, domainRecord);
    return domainRecord;
  }

  /**
   * Generate required DNS records for domain
   */
  generateDNSRecords(domain) {
    const selector = `bluestar${Date.now().toString(36)}`;
    
    return {
      spf: {
        type: 'TXT',
        host: '@',
        value: 'v=spf1 include:_spf.bluestarai.com ~all',
        status: VERIFICATION_STATUS.PENDING,
        required: true,
        description: 'Authorizes BluestarAI to send emails on behalf of your domain',
      },
      dkim: {
        type: 'CNAME',
        host: `${selector}._domainkey`,
        value: `${selector}._domainkey.bluestarai.com`,
        status: VERIFICATION_STATUS.PENDING,
        required: true,
        description: 'Cryptographic signature for email authentication',
      },
      dmarc: {
        type: 'TXT',
        host: '_dmarc',
        value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@bluestarai.com; pct=100',
        status: VERIFICATION_STATUS.PENDING,
        required: true,
        description: 'Policy for handling emails that fail authentication',
      },
      tracking: {
        type: 'CNAME',
        host: 'track',
        value: 'tracking.bluestarai.com',
        status: VERIFICATION_STATUS.PENDING,
        required: false,
        description: 'Custom tracking domain for better deliverability',
      },
    };
  }

  /**
   * Verify DNS records for domain
   */
  async verifyDomain(domainId) {
    const domain = this.domains.get(domainId);
    if (!domain) throw new Error('Domain not found');

    // In production, would make actual DNS queries
    // For demo, simulate verification with random success
    const results = {};
    let allVerified = true;

    for (const [key, record] of Object.entries(domain.dnsRecords)) {
      // Simulate 80% success rate for demo
      const verified = Math.random() > 0.2;
      results[key] = verified;
      domain.dnsRecords[key].status = verified 
        ? VERIFICATION_STATUS.VERIFIED 
        : VERIFICATION_STATUS.FAILED;
      
      if (record.required && !verified) {
        allVerified = false;
      }
    }

    domain.status = allVerified ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PENDING;
    if (allVerified) {
      domain.verifiedAt = new Date().toISOString();
    }

    domain.health.lastChecked = new Date().toISOString();
    domain.health.spf = results.spf;
    domain.health.dkim = results.dkim;
    domain.health.dmarc = results.dmarc;

    return domain;
  }

  /**
   * Check domain reputation/health
   */
  async checkDomainHealth(domainId) {
    const domain = this.domains.get(domainId);
    if (!domain) throw new Error('Domain not found');

    // Simulate reputation check
    const health = {
      spf: domain.dnsRecords.spf.status === VERIFICATION_STATUS.VERIFIED,
      dkim: domain.dnsRecords.dkim.status === VERIFICATION_STATUS.VERIFIED,
      dmarc: domain.dnsRecords.dmarc.status === VERIFICATION_STATUS.VERIFIED,
      reputation: Math.floor(Math.random() * 20) + 80, // 80-100
      blacklisted: false,
      blacklistChecks: [
        { name: 'Spamhaus', status: 'clean' },
        { name: 'Barracuda', status: 'clean' },
        { name: 'SORBS', status: 'clean' },
        { name: 'SpamCop', status: 'clean' },
      ],
      lastChecked: new Date().toISOString(),
    };

    domain.health = health;
    return health;
  }

  /**
   * Get all domains
   */
  listDomains() {
    return Array.from(this.domains.values());
  }

  /**
   * Get domain by ID
   */
  getDomain(id) {
    return this.domains.get(id);
  }

  /**
   * Remove domain
   */
  removeDomain(id) {
    return this.domains.delete(id);
  }
}

// ============================================================================
// EMAIL WARMUP SERVICE
// ============================================================================

export const WARMUP_SCHEDULES = {
  CONSERVATIVE: {
    id: 'conservative',
    name: 'Conservative',
    description: '4-6 weeks, lower risk',
    dailyIncrease: 2,
    startVolume: 5,
    maxVolume: 100,
    durationDays: 42,
  },
  MODERATE: {
    id: 'moderate', 
    name: 'Moderate',
    description: '2-3 weeks, balanced approach',
    dailyIncrease: 5,
    startVolume: 10,
    maxVolume: 150,
    durationDays: 21,
  },
  AGGRESSIVE: {
    id: 'aggressive',
    name: 'Aggressive',
    description: '1-2 weeks, higher risk',
    dailyIncrease: 10,
    startVolume: 20,
    maxVolume: 200,
    durationDays: 14,
  },
};

class EmailWarmupService {
  constructor() {
    this.warmups = new Map();
    this.warmupLogs = new Map();
  }

  /**
   * Start warmup for email account
   */
  startWarmup(connectionId, scheduleId = 'moderate') {
    const schedule = WARMUP_SCHEDULES[scheduleId.toUpperCase()] || WARMUP_SCHEDULES.MODERATE;
    
    const warmup = {
      id: `warmup_${Date.now()}`,
      connectionId,
      schedule: scheduleId,
      status: WARMUP_STATUS.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      currentDay: 1,
      currentVolume: schedule.startVolume,
      targetVolume: schedule.maxVolume,
      stats: {
        totalSent: 0,
        totalReceived: 0,
        bounces: 0,
        spamReports: 0,
        reputation: 50, // Starts at 50, grows to 100
      },
      dailyLogs: [],
    };

    this.warmups.set(warmup.id, warmup);
    return warmup;
  }

  /**
   * Execute daily warmup
   */
  async executeDailyWarmup(warmupId) {
    const warmup = this.warmups.get(warmupId);
    if (!warmup || warmup.status !== WARMUP_STATUS.IN_PROGRESS) {
      throw new Error('Warmup not active');
    }

    const schedule = WARMUP_SCHEDULES[warmup.schedule.toUpperCase()];
    
    // Simulate warmup emails
    const emailsToSend = warmup.currentVolume;
    const sentCount = emailsToSend;
    const receivedCount = Math.floor(emailsToSend * (0.7 + Math.random() * 0.3)); // 70-100% response rate
    const bounceCount = Math.floor(Math.random() * 2); // 0-1 bounces
    const spamCount = Math.random() > 0.95 ? 1 : 0; // 5% chance of spam report

    // Log daily activity
    const dailyLog = {
      day: warmup.currentDay,
      date: new Date().toISOString(),
      sent: sentCount,
      received: receivedCount,
      bounces: bounceCount,
      spamReports: spamCount,
      volume: warmup.currentVolume,
    };

    warmup.dailyLogs.push(dailyLog);
    warmup.stats.totalSent += sentCount;
    warmup.stats.totalReceived += receivedCount;
    warmup.stats.bounces += bounceCount;
    warmup.stats.spamReports += spamCount;

    // Update reputation
    const reputationGain = (receivedCount / sentCount) * 2 - (bounceCount * 5) - (spamCount * 20);
    warmup.stats.reputation = Math.min(100, Math.max(0, warmup.stats.reputation + reputationGain));

    // Increase volume for next day
    warmup.currentDay++;
    warmup.currentVolume = Math.min(
      warmup.targetVolume,
      warmup.currentVolume + schedule.dailyIncrease
    );

    // Check if warmup is complete
    if (warmup.currentDay > schedule.durationDays || warmup.currentVolume >= warmup.targetVolume) {
      warmup.status = WARMUP_STATUS.COMPLETED;
      warmup.completedAt = new Date().toISOString();
    }

    return warmup;
  }

  /**
   * Pause warmup
   */
  pauseWarmup(warmupId) {
    const warmup = this.warmups.get(warmupId);
    if (warmup) {
      warmup.status = WARMUP_STATUS.PAUSED;
      warmup.pausedAt = new Date().toISOString();
    }
    return warmup;
  }

  /**
   * Resume warmup
   */
  resumeWarmup(warmupId) {
    const warmup = this.warmups.get(warmupId);
    if (warmup && warmup.status === WARMUP_STATUS.PAUSED) {
      warmup.status = WARMUP_STATUS.IN_PROGRESS;
      warmup.resumedAt = new Date().toISOString();
    }
    return warmup;
  }

  /**
   * Get warmup status
   */
  getWarmup(id) {
    return this.warmups.get(id);
  }

  /**
   * Get warmup for connection
   */
  getWarmupByConnection(connectionId) {
    return Array.from(this.warmups.values())
      .find(w => w.connectionId === connectionId);
  }

  /**
   * List all warmups
   */
  listWarmups() {
    return Array.from(this.warmups.values());
  }
}

// ============================================================================
// DELIVERABILITY SERVICE
// ============================================================================

class DeliverabilityService {
  constructor() {
    this.spamChecks = new Map();
  }

  /**
   * Check email content for spam triggers
   */
  checkSpamScore(email) {
    const triggers = [];
    let score = 0;

    const content = `${email.subject || ''} ${email.body || ''}`.toLowerCase();

    // Spam trigger words
    const spamWords = [
      { word: 'free', weight: 1 },
      { word: 'guarantee', weight: 1 },
      { word: 'no obligation', weight: 2 },
      { word: 'act now', weight: 2 },
      { word: 'limited time', weight: 1 },
      { word: 'click here', weight: 2 },
      { word: 'buy now', weight: 2 },
      { word: 'order now', weight: 2 },
      { word: 'special promotion', weight: 2 },
      { word: 'winner', weight: 2 },
      { word: 'congratulations', weight: 1 },
      { word: '100%', weight: 1 },
      { word: 'urgent', weight: 1 },
      { word: 'exclusive deal', weight: 2 },
      { word: 'risk free', weight: 2 },
      { word: 'no cost', weight: 2 },
      { word: 'call now', weight: 1 },
      { word: 'apply now', weight: 1 },
      { word: 'as seen on', weight: 1 },
      { word: 'dear friend', weight: 2 },
    ];

    spamWords.forEach(({ word, weight }) => {
      if (content.includes(word)) {
        triggers.push({ type: 'word', value: word, weight });
        score += weight;
      }
    });

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      triggers.push({ type: 'caps', value: `${Math.round(capsRatio * 100)}% caps`, weight: 3 });
      score += 3;
    }

    // Check for excessive punctuation
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      triggers.push({ type: 'punctuation', value: `${exclamationCount} exclamation marks`, weight: 2 });
      score += 2;
    }

    // Check for no unsubscribe link
    if (!content.includes('unsubscribe')) {
      triggers.push({ type: 'compliance', value: 'Missing unsubscribe link', weight: 5 });
      score += 5;
    }

    // Check for missing physical address (CAN-SPAM requirement)
    const hasAddress = /\d+\s+[\w\s]+,\s+[\w\s]+,\s+[A-Z]{2}\s+\d{5}/.test(content);
    if (!hasAddress) {
      triggers.push({ type: 'compliance', value: 'Missing physical address', weight: 3 });
      score += 3;
    }

    // Calculate risk level
    let riskLevel = 'low';
    if (score >= 10) riskLevel = 'high';
    else if (score >= 5) riskLevel = 'medium';

    return {
      score,
      maxScore: 40,
      riskLevel,
      triggers,
      recommendations: this.getRecommendations(triggers),
      passesCheck: score < 10,
    };
  }

  /**
   * Get recommendations based on triggers
   */
  getRecommendations(triggers) {
    const recommendations = [];

    if (triggers.some(t => t.type === 'word')) {
      recommendations.push('Remove or rephrase spam trigger words');
    }
    if (triggers.some(t => t.type === 'caps')) {
      recommendations.push('Reduce use of capital letters');
    }
    if (triggers.some(t => t.type === 'punctuation')) {
      recommendations.push('Reduce excessive punctuation');
    }
    if (triggers.some(t => t.value === 'Missing unsubscribe link')) {
      recommendations.push('Add an unsubscribe link to comply with CAN-SPAM');
    }
    if (triggers.some(t => t.value === 'Missing physical address')) {
      recommendations.push('Include your physical business address');
    }

    if (recommendations.length === 0) {
      recommendations.push('Email content looks good!');
    }

    return recommendations;
  }

  /**
   * Check sender reputation
   */
  async checkSenderReputation(email) {
    // Would integrate with reputation services in production
    // For demo, return mock data
    return {
      email,
      reputation: Math.floor(Math.random() * 20) + 80,
      blacklisted: false,
      sendingHistory: {
        last24h: Math.floor(Math.random() * 50),
        last7d: Math.floor(Math.random() * 300),
        last30d: Math.floor(Math.random() * 1000),
      },
      bounceRate: (Math.random() * 2).toFixed(1),
      spamRate: (Math.random() * 0.5).toFixed(2),
    };
  }

  /**
   * Get deliverability best practices
   */
  getBestPractices() {
    return [
      {
        category: 'Authentication',
        practices: [
          'Set up SPF, DKIM, and DMARC records',
          'Use a dedicated sending domain',
          'Verify domain ownership',
        ],
      },
      {
        category: 'Content',
        practices: [
          'Avoid spam trigger words',
          'Keep text-to-image ratio balanced',
          'Include plain text version',
          'Personalize subject lines',
        ],
      },
      {
        category: 'List Hygiene',
        practices: [
          'Remove bounced emails immediately',
          'Honor unsubscribe requests within 10 days',
          'Regularly clean inactive subscribers',
          'Use double opt-in for new subscribers',
        ],
      },
      {
        category: 'Sending Practices',
        practices: [
          'Warm up new domains gradually',
          'Send emails consistently',
          'Maintain low bounce rates (<2%)',
          'Monitor spam complaint rates (<0.1%)',
        ],
      },
    ];
  }
}

// ============================================================================
// SMS SERVICE
// ============================================================================

export const SMS_PROVIDERS = {
  TWILIO: {
    id: 'twilio',
    name: 'Twilio',
    features: ['sms', 'mms', 'voice'],
    dailyLimit: 10000,
  },
  MESSAGEBIRD: {
    id: 'messagebird',
    name: 'MessageBird',
    features: ['sms', 'whatsapp', 'voice'],
    dailyLimit: 10000,
  },
};

class SMSService {
  constructor() {
    this.connections = new Map();
    this.messages = new Map();
  }

  /**
   * Connect SMS provider
   */
  connectProvider(providerId, credentials) {
    const provider = SMS_PROVIDERS[providerId.toUpperCase()];
    if (!provider) throw new Error('Invalid SMS provider');

    const connection = {
      id: `sms_conn_${Date.now()}`,
      providerId,
      status: CONNECTION_STATUS.CONNECTED,
      phoneNumbers: [],
      credentials: {
        accountSid: credentials.accountSid,
        authToken: '***hidden***',
      },
      connectedAt: new Date().toISOString(),
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  /**
   * Add phone number to connection
   */
  addPhoneNumber(connectionId, phoneNumber, capabilities = ['sms']) {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');

    connection.phoneNumbers.push({
      number: phoneNumber,
      capabilities,
      status: 'active',
      addedAt: new Date().toISOString(),
    });

    return connection;
  }

  /**
   * Send SMS
   */
  async sendSMS(connectionId, to, message, fromNumber = null) {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error('Connection not found');

    const from = fromNumber || connection.phoneNumbers[0]?.number;
    if (!from) throw new Error('No phone number configured');

    // In production, would use actual Twilio/provider API
    const result = {
      id: `sms_${Date.now()}`,
      connectionId,
      to,
      from,
      body: message,
      status: 'sent',
      sentAt: new Date().toISOString(),
      segments: Math.ceil(message.length / 160),
    };

    this.messages.set(result.id, result);
    return result;
  }

  /**
   * Get SMS history
   */
  getMessages(connectionId) {
    return Array.from(this.messages.values())
      .filter(m => m.connectionId === connectionId);
  }

  /**
   * Get connections
   */
  listConnections() {
    return Array.from(this.connections.values());
  }
}

// ============================================================================
// SERVICE INSTANCES
// ============================================================================

export const emailProviderService = new EmailProviderService();
export const domainVerificationService = new DomainVerificationService();
export const emailWarmupService = new EmailWarmupService();
export const deliverabilityService = new DeliverabilityService();
export const smsService = new SMSService();

// ============================================================================
// MOCK DATA INITIALIZATION
// ============================================================================

export function initializeMockEmailData() {
  // Add a mock Gmail connection
  const gmailConnection = {
    id: 'conn_gmail_demo',
    providerId: 'gmail',
    email: 'chris@azimontgroup.com',
    status: CONNECTION_STATUS.CONNECTED,
    connectedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    dailySent: 45,
    dailyLimit: 500,
  };
  emailProviderService.connections.set(gmailConnection.id, gmailConnection);

  // Add a mock domain
  const domain = domainVerificationService.addDomain('azimontgroup.com');
  domain.status = VERIFICATION_STATUS.VERIFIED;
  domain.verifiedAt = new Date(Date.now() - 5 * 86400000).toISOString();
  domain.dnsRecords.spf.status = VERIFICATION_STATUS.VERIFIED;
  domain.dnsRecords.dkim.status = VERIFICATION_STATUS.VERIFIED;
  domain.dnsRecords.dmarc.status = VERIFICATION_STATUS.VERIFIED;
  domain.health = {
    spf: true,
    dkim: true,
    dmarc: true,
    reputation: 92,
    lastChecked: new Date().toISOString(),
  };

  // Add a mock warmup
  const warmup = emailWarmupService.startWarmup('conn_gmail_demo', 'moderate');
  warmup.currentDay = 8;
  warmup.currentVolume = 50;
  warmup.stats.totalSent = 280;
  warmup.stats.totalReceived = 245;
  warmup.stats.reputation = 78;
  warmup.dailyLogs = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    date: new Date(Date.now() - (7 - i) * 86400000).toISOString(),
    sent: 10 + i * 5,
    received: 8 + i * 4,
    bounces: Math.floor(Math.random() * 2),
    spamReports: 0,
    volume: 10 + i * 5,
  }));

  return {
    gmailConnection,
    domain,
    warmup,
  };
}

// Initialize mock data
initializeMockEmailData();

export default {
  emailProviderService,
  domainVerificationService,
  emailWarmupService,
  deliverabilityService,
  smsService,
  EMAIL_PROVIDERS,
  SMS_PROVIDERS,
  WARMUP_SCHEDULES,
  CONNECTION_STATUS,
  VERIFICATION_STATUS,
  WARMUP_STATUS,
};
