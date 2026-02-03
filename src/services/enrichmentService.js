/**
 * Lead Enrichment Service
 * Data enrichment from multiple providers
 * 
 * Features:
 * - Company data enrichment (firmographics)
 * - Contact data enrichment
 * - News & trigger alerts
 * - Tech stack detection
 * - Social profile matching
 */

// ============================================================================
// ENRICHMENT PROVIDERS
// ============================================================================

export const ENRICHMENT_PROVIDERS = {
  CLEARBIT: 'clearbit',
  APOLLO: 'apollo',
  ZOOMINFO: 'zoominfo',
  LINKEDIN: 'linkedin',
  CRUNCHBASE: 'crunchbase',
};

export const ENRICHMENT_TYPES = {
  COMPANY: 'company',
  CONTACT: 'contact',
  NEWS: 'news',
  TECH_STACK: 'tech_stack',
  SOCIAL: 'social',
};

// ============================================================================
// ENRICHMENT SERVICE
// ============================================================================

class EnrichmentService {
  constructor() {
    this.providers = new Map();
    this.enrichmentCache = new Map();
    this.enrichmentLogs = [];
  }

  // ===== PROVIDER MANAGEMENT =====

  configureProvider(provider, config) {
    this.providers.set(provider, {
      name: provider,
      apiKey: config.apiKey,
      enabled: config.enabled !== false,
      rateLimit: config.rateLimit || 100,
      priority: config.priority || 1,
    });
  }

  getEnabledProviders() {
    return Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  // ===== COMPANY ENRICHMENT =====

  async enrichCompany(domain) {
    const cacheKey = `company:${domain}`;
    
    // Check cache
    if (this.enrichmentCache.has(cacheKey)) {
      const cached = this.enrichmentCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 86400000) { // 24 hour cache
        return cached.data;
      }
    }

    // In production, this would call actual APIs
    const enrichedData = this.generateMockCompanyData(domain);
    
    // Cache result
    this.enrichmentCache.set(cacheKey, {
      data: enrichedData,
      timestamp: Date.now(),
    });

    this.log('company', domain, 'success', `Enriched company data for ${domain}`);
    
    return enrichedData;
  }

  generateMockCompanyData(domain) {
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    const industries = ['Technology', 'Financial Services', 'Healthcare', 'Manufacturing', 'Retail', 'Professional Services'];
    const techStacks = ['AWS', 'Google Cloud', 'Salesforce', 'HubSpot', 'Slack', 'Microsoft 365', 'Zoom', 'Stripe'];
    
    return {
      domain,
      name: companyName,
      legalName: `${companyName} Inc.`,
      description: `${companyName} is a leading provider of innovative solutions.`,
      foundedYear: 2010 + Math.floor(Math.random() * 12),
      industry: industries[Math.floor(Math.random() * industries.length)],
      subIndustry: 'Software & Services',
      employees: {
        range: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000'][Math.floor(Math.random() * 6)],
        estimated: Math.floor(Math.random() * 500) + 50,
      },
      revenue: {
        range: ['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M'][Math.floor(Math.random() * 4)],
        estimated: (Math.floor(Math.random() * 100) + 10) * 1000000,
      },
      funding: {
        totalRaised: Math.floor(Math.random() * 50) * 1000000,
        lastRound: {
          type: ['Seed', 'Series A', 'Series B', 'Series C'][Math.floor(Math.random() * 4)],
          amount: Math.floor(Math.random() * 20) * 1000000,
          date: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
        },
        investors: ['Sequoia Capital', 'Andreessen Horowitz', 'Accel', 'Benchmark'].slice(0, Math.floor(Math.random() * 3) + 1),
      },
      location: {
        city: ['San Francisco', 'New York', 'Austin', 'Boston', 'Seattle'][Math.floor(Math.random() * 5)],
        state: 'CA',
        country: 'United States',
        address: '123 Business Ave',
      },
      social: {
        linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`,
        twitter: `https://twitter.com/${domain.split('.')[0]}`,
        facebook: `https://facebook.com/${domain.split('.')[0]}`,
      },
      techStack: techStacks.filter(() => Math.random() > 0.6),
      tags: ['B2B', 'SaaS', 'Enterprise'].filter(() => Math.random() > 0.5),
      enrichedAt: new Date().toISOString(),
      confidence: Math.floor(Math.random() * 20) + 80,
    };
  }

  // ===== CONTACT ENRICHMENT =====

  async enrichContact(email) {
    const cacheKey = `contact:${email}`;
    
    if (this.enrichmentCache.has(cacheKey)) {
      const cached = this.enrichmentCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 86400000) {
        return cached.data;
      }
    }

    const enrichedData = this.generateMockContactData(email);
    
    this.enrichmentCache.set(cacheKey, {
      data: enrichedData,
      timestamp: Date.now(),
    });

    this.log('contact', email, 'success', `Enriched contact data for ${email}`);
    
    return enrichedData;
  }

  generateMockContactData(email) {
    const namePart = email.split('@')[0];
    const domain = email.split('@')[1];
    const firstName = namePart.split('.')[0]?.charAt(0).toUpperCase() + namePart.split('.')[0]?.slice(1) || 'John';
    const lastName = namePart.split('.')[1]?.charAt(0).toUpperCase() + namePart.split('.')[1]?.slice(1) || 'Doe';
    
    const titles = ['CEO', 'CTO', 'CFO', 'VP of Sales', 'VP of Marketing', 'Director of Operations', 'Head of Product', 'Senior Manager'];
    const departments = ['Executive', 'Sales', 'Marketing', 'Engineering', 'Operations', 'Finance'];
    
    return {
      email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      seniority: ['C-Level', 'VP', 'Director', 'Manager'][Math.floor(Math.random() * 4)],
      phone: {
        direct: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        mobile: null,
      },
      location: {
        city: ['San Francisco', 'New York', 'Austin', 'Boston'][Math.floor(Math.random() * 4)],
        state: 'CA',
        country: 'United States',
      },
      social: {
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        twitter: Math.random() > 0.5 ? `https://twitter.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
      },
      company: {
        domain,
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      },
      bio: `${firstName} is a seasoned professional with expertise in business development and strategy.`,
      employment: {
        current: {
          company: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          title: titles[Math.floor(Math.random() * titles.length)],
          startDate: new Date(Date.now() - Math.random() * 3 * 365 * 86400000).toISOString(),
        },
        history: [],
      },
      enrichedAt: new Date().toISOString(),
      confidence: Math.floor(Math.random() * 15) + 85,
    };
  }

  // ===== NEWS & TRIGGERS =====

  async getCompanyNews(domain, options = {}) {
    const { limit = 5, daysBack = 30 } = options;
    
    // In production, this would call news APIs
    const news = this.generateMockNews(domain, limit);
    
    return news;
  }

  generateMockNews(domain, limit) {
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    
    const newsTemplates = [
      { type: 'funding', title: `${companyName} Raises $X Million in Series Y Round`, signal: 'positive' },
      { type: 'expansion', title: `${companyName} Expands Operations to New Markets`, signal: 'positive' },
      { type: 'hiring', title: `${companyName} Announces Major Hiring Initiative`, signal: 'positive' },
      { type: 'product', title: `${companyName} Launches New Product Line`, signal: 'positive' },
      { type: 'partnership', title: `${companyName} Partners with Industry Leader`, signal: 'positive' },
      { type: 'award', title: `${companyName} Named Top Workplace`, signal: 'positive' },
      { type: 'leadership', title: `${companyName} Appoints New Executive`, signal: 'neutral' },
    ];

    return Array.from({ length: limit }, (_, i) => {
      const template = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      
      return {
        id: `news-${Date.now()}-${i}`,
        title: template.title.replace('$X', String(Math.floor(Math.random() * 50) + 10)).replace('Y', ['A', 'B', 'C'][Math.floor(Math.random() * 3)]),
        type: template.type,
        signal: template.signal,
        source: ['TechCrunch', 'Forbes', 'Business Wire', 'PR Newswire'][Math.floor(Math.random() * 4)],
        url: `https://example.com/news/${i}`,
        publishedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        summary: `This is a summary of the news article about ${companyName}.`,
      };
    }).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  // ===== TRIGGER ALERTS =====

  async detectTriggers(lead) {
    const triggers = [];
    const domain = lead.email?.split('@')[1];
    
    if (!domain) return triggers;

    // Check for various triggers
    const news = await this.getCompanyNews(domain, { limit: 3 });
    
    // Funding trigger
    const fundingNews = news.find(n => n.type === 'funding');
    if (fundingNews) {
      triggers.push({
        type: 'funding',
        priority: 'high',
        title: 'Recent Funding Round',
        description: fundingNews.title,
        detectedAt: new Date().toISOString(),
        actionable: true,
        suggestedAction: 'Reach out - companies often invest in new solutions after funding',
      });
    }

    // Hiring trigger
    const hiringNews = news.find(n => n.type === 'hiring');
    if (hiringNews) {
      triggers.push({
        type: 'hiring',
        priority: 'medium',
        title: 'Expansion Signal',
        description: hiringNews.title,
        detectedAt: new Date().toISOString(),
        actionable: true,
        suggestedAction: 'Growing companies need scalable solutions',
      });
    }

    // Leadership change trigger
    const leadershipNews = news.find(n => n.type === 'leadership');
    if (leadershipNews) {
      triggers.push({
        type: 'leadership_change',
        priority: 'medium',
        title: 'Leadership Change',
        description: leadershipNews.title,
        detectedAt: new Date().toISOString(),
        actionable: true,
        suggestedAction: 'New leaders often review vendor relationships',
      });
    }

    return triggers;
  }

  // ===== BULK ENRICHMENT =====

  async enrichLeads(leads, options = {}) {
    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const lead of leads) {
      try {
        if (!lead.email) {
          results.skipped.push({ lead, reason: 'No email address' });
          continue;
        }

        const contactData = await this.enrichContact(lead.email);
        const domain = lead.email.split('@')[1];
        const companyData = domain ? await this.enrichCompany(domain) : null;
        const triggers = await this.detectTriggers(lead);

        results.success.push({
          leadId: lead.id,
          contact: contactData,
          company: companyData,
          triggers,
        });

        // Rate limiting
        if (options.rateLimit) {
          await new Promise(r => setTimeout(r, options.rateLimit));
        }
      } catch (error) {
        results.failed.push({ lead, error: error.message });
      }
    }

    return results;
  }

  // ===== LOGGING =====

  log(type, target, status, message) {
    this.enrichmentLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      target,
      status,
      message,
    });

    if (this.enrichmentLogs.length > 200) {
      this.enrichmentLogs = this.enrichmentLogs.slice(0, 200);
    }
  }

  getLogs(limit = 50) {
    return this.enrichmentLogs.slice(0, limit);
  }
}

// Singleton instance
export const enrichmentService = new EnrichmentService();

export default EnrichmentService;
