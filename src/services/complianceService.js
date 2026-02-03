/**
 * Compliance Service
 * Regulatory compliance for lead generation
 * 
 * Features:
 * - DNC (Do Not Call) list management
 * - TCPA compliance tracking
 * - Consent management
 * - Audit trail
 * - Data retention policies
 * - Disclosure templates
 */

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export const CONSENT_TYPES = {
  EXPRESS_WRITTEN: 'express_written',
  EXPRESS_ORAL: 'express_oral',
  IMPLIED: 'implied',
  OPTED_OUT: 'opted_out',
  NONE: 'none',
};

export const CONTACT_METHODS = {
  EMAIL: 'email',
  PHONE_CALL: 'phone_call',
  SMS: 'sms',
  FAX: 'fax',
  MAIL: 'mail',
};

export const REGULATION_TYPES = {
  TCPA: 'tcpa',           // Telephone Consumer Protection Act
  CAN_SPAM: 'can_spam',   // CAN-SPAM Act
  GDPR: 'gdpr',           // General Data Protection Regulation
  CCPA: 'ccpa',           // California Consumer Privacy Act
  DNC: 'dnc',             // Do Not Call Registry
};

export const COMPLIANCE_STATUS = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non_compliant',
  PENDING_REVIEW: 'pending_review',
  EXEMPTED: 'exempted',
};

// ============================================================================
// COMPLIANCE SERVICE
// ============================================================================

class ComplianceService {
  constructor() {
    this.dncList = new Map();           // Do Not Call registry
    this.consentRecords = new Map();    // Consent tracking
    this.auditLog = [];                 // Audit trail
    this.disclosureTemplates = new Map();
    this.retentionPolicies = new Map();
    this.suppressionList = new Map();   // Global suppression
    
    this.initializeDefaults();
  }

  initializeDefaults() {
    // Initialize disclosure templates
    this.addDisclosureTemplate('tcpa_sms', {
      name: 'TCPA SMS Disclosure',
      type: 'sms',
      regulation: REGULATION_TYPES.TCPA,
      text: 'Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.',
      required: true,
    });

    this.addDisclosureTemplate('tcpa_call_intro', {
      name: 'TCPA Call Introduction',
      type: 'phone_call',
      regulation: REGULATION_TYPES.TCPA,
      text: 'This call may be recorded for quality assurance purposes. Do I have your permission to continue?',
      required: true,
    });

    this.addDisclosureTemplate('email_unsubscribe', {
      name: 'CAN-SPAM Unsubscribe',
      type: 'email',
      regulation: REGULATION_TYPES.CAN_SPAM,
      text: 'If you no longer wish to receive these emails, click here to unsubscribe.',
      required: true,
    });

    this.addDisclosureTemplate('company_address', {
      name: 'Physical Address',
      type: 'email',
      regulation: REGULATION_TYPES.CAN_SPAM,
      text: '{company_name}\n{street_address}\n{city}, {state} {zip}',
      required: true,
    });

    // Initialize retention policies
    this.setRetentionPolicy('lead_data', {
      name: 'Lead Data Retention',
      retentionDays: 1095, // 3 years
      deleteAfterRetention: false,
      archiveAfterRetention: true,
    });

    this.setRetentionPolicy('consent_records', {
      name: 'Consent Record Retention',
      retentionDays: 2555, // 7 years
      deleteAfterRetention: false,
      archiveAfterRetention: true,
    });

    this.setRetentionPolicy('communication_logs', {
      name: 'Communication Log Retention',
      retentionDays: 730, // 2 years
      deleteAfterRetention: true,
      archiveAfterRetention: false,
    });
  }

  // ===== DO NOT CALL LIST MANAGEMENT =====

  addToDNC(phoneNumber, options = {}) {
    const normalized = this.normalizePhone(phoneNumber);
    
    const entry = {
      phoneNumber: normalized,
      addedAt: new Date().toISOString(),
      source: options.source || 'manual',
      reason: options.reason || 'opt_out',
      expiresAt: options.expiresAt || null,
      metadata: options.metadata || {},
    };

    this.dncList.set(normalized, entry);
    
    this.audit('dnc_add', {
      phoneNumber: this.maskPhone(normalized),
      source: entry.source,
      reason: entry.reason,
    });

    return entry;
  }

  removeFromDNC(phoneNumber, reason) {
    const normalized = this.normalizePhone(phoneNumber);
    const existed = this.dncList.has(normalized);
    
    this.dncList.delete(normalized);
    
    if (existed) {
      this.audit('dnc_remove', {
        phoneNumber: this.maskPhone(normalized),
        reason,
      });
    }

    return existed;
  }

  checkDNC(phoneNumber) {
    const normalized = this.normalizePhone(phoneNumber);
    const entry = this.dncList.get(normalized);
    
    if (!entry) {
      return { isOnDNC: false };
    }

    // Check expiration
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.dncList.delete(normalized);
      return { isOnDNC: false, wasExpired: true };
    }

    return {
      isOnDNC: true,
      addedAt: entry.addedAt,
      source: entry.source,
      reason: entry.reason,
    };
  }

  checkDNCBulk(phoneNumbers) {
    return phoneNumbers.map(phone => ({
      phoneNumber: phone,
      ...this.checkDNC(phone),
    }));
  }

  getDNCList(options = {}) {
    const entries = Array.from(this.dncList.values());
    
    let filtered = entries;
    
    if (options.source) {
      filtered = filtered.filter(e => e.source === options.source);
    }
    
    if (options.addedAfter) {
      filtered = filtered.filter(e => new Date(e.addedAt) >= new Date(options.addedAfter));
    }

    return filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }

  // ===== CONSENT MANAGEMENT =====

  recordConsent(leadId, consent) {
    const record = {
      id: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      leadId,
      type: consent.type || CONSENT_TYPES.NONE,
      method: consent.method,
      obtainedAt: consent.obtainedAt || new Date().toISOString(),
      expiresAt: consent.expiresAt || null,
      source: consent.source || 'form_submission',
      proof: {
        ipAddress: consent.ipAddress || null,
        userAgent: consent.userAgent || null,
        formId: consent.formId || null,
        recordingUrl: consent.recordingUrl || null,
        signatureUrl: consent.signatureUrl || null,
      },
      scope: consent.scope || ['all'],
      notes: consent.notes || '',
      createdAt: new Date().toISOString(),
    };

    // Get existing consents for this lead
    const existing = this.consentRecords.get(leadId) || [];
    existing.push(record);
    this.consentRecords.set(leadId, existing);

    this.audit('consent_recorded', {
      leadId,
      consentId: record.id,
      type: record.type,
      method: record.method,
    });

    return record;
  }

  revokeConsent(leadId, method, reason) {
    const existing = this.consentRecords.get(leadId) || [];
    
    const updated = existing.map(consent => {
      if (consent.method === method && !consent.revokedAt) {
        return {
          ...consent,
          revokedAt: new Date().toISOString(),
          revokeReason: reason,
        };
      }
      return consent;
    });

    this.consentRecords.set(leadId, updated);

    this.audit('consent_revoked', {
      leadId,
      method,
      reason,
    });

    return updated;
  }

  getConsent(leadId, method = null) {
    const records = this.consentRecords.get(leadId) || [];
    
    if (method) {
      return records.filter(r => r.method === method && !r.revokedAt);
    }
    
    return records.filter(r => !r.revokedAt);
  }

  hasValidConsent(leadId, method) {
    const consents = this.getConsent(leadId, method);
    
    if (consents.length === 0) {
      return { hasConsent: false, reason: 'no_consent_record' };
    }

    const validConsent = consents.find(c => {
      // Check if not revoked
      if (c.revokedAt) return false;
      
      // Check if not expired
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
      
      // Check consent type
      if (c.type === CONSENT_TYPES.OPTED_OUT) return false;
      if (c.type === CONSENT_TYPES.NONE) return false;
      
      return true;
    });

    if (!validConsent) {
      return { hasConsent: false, reason: 'consent_expired_or_revoked' };
    }

    return {
      hasConsent: true,
      consentType: validConsent.type,
      obtainedAt: validConsent.obtainedAt,
      consentId: validConsent.id,
    };
  }

  // ===== COMPLIANCE CHECK =====

  checkCompliance(lead, contactMethod) {
    const result = {
      leadId: lead.id,
      contactMethod,
      isCompliant: true,
      checks: [],
      blockers: [],
      warnings: [],
      requiredDisclosures: [],
      checkedAt: new Date().toISOString(),
    };

    // Check DNC for phone-based methods
    if ([CONTACT_METHODS.PHONE_CALL, CONTACT_METHODS.SMS].includes(contactMethod)) {
      const dncCheck = this.checkDNC(lead.phone);
      result.checks.push({
        name: 'DNC Registry',
        passed: !dncCheck.isOnDNC,
        details: dncCheck.isOnDNC ? 'Number is on DNC list' : 'Not on DNC list',
      });

      if (dncCheck.isOnDNC) {
        result.isCompliant = false;
        result.blockers.push({
          type: 'dnc',
          message: `Number is on DNC list since ${dncCheck.addedAt}`,
        });
      }
    }

    // Check consent
    const consentCheck = this.hasValidConsent(lead.id, contactMethod);
    result.checks.push({
      name: 'Consent Verification',
      passed: consentCheck.hasConsent,
      details: consentCheck.hasConsent 
        ? `Valid ${consentCheck.consentType} consent obtained ${consentCheck.obtainedAt}`
        : `No valid consent: ${consentCheck.reason}`,
    });

    // TCPA requirements for calls/SMS
    if (contactMethod === CONTACT_METHODS.PHONE_CALL) {
      if (!consentCheck.hasConsent || consentCheck.consentType !== CONSENT_TYPES.EXPRESS_WRITTEN) {
        result.warnings.push({
          type: 'tcpa',
          message: 'TCPA requires express written consent for autodialed calls',
        });
      }
      result.requiredDisclosures.push(
        this.getDisclosureTemplate('tcpa_call_intro')
      );
    }

    if (contactMethod === CONTACT_METHODS.SMS) {
      if (!consentCheck.hasConsent || consentCheck.consentType !== CONSENT_TYPES.EXPRESS_WRITTEN) {
        result.isCompliant = false;
        result.blockers.push({
          type: 'tcpa',
          message: 'TCPA requires express written consent for SMS messages',
        });
      }
      result.requiredDisclosures.push(
        this.getDisclosureTemplate('tcpa_sms')
      );
    }

    // CAN-SPAM for email
    if (contactMethod === CONTACT_METHODS.EMAIL) {
      result.requiredDisclosures.push(
        this.getDisclosureTemplate('email_unsubscribe'),
        this.getDisclosureTemplate('company_address')
      );

      // Check suppression list
      if (lead.email && this.suppressionList.has(lead.email.toLowerCase())) {
        result.isCompliant = false;
        result.blockers.push({
          type: 'suppression',
          message: 'Email is on suppression list',
        });
      }
    }

    return result;
  }

  checkComplianceBulk(leads, contactMethod) {
    return leads.map(lead => this.checkCompliance(lead, contactMethod));
  }

  // ===== SUPPRESSION LIST =====

  addToSuppression(email, reason) {
    const normalized = email.toLowerCase();
    
    this.suppressionList.set(normalized, {
      email: normalized,
      addedAt: new Date().toISOString(),
      reason,
    });

    this.audit('suppression_add', {
      email: this.maskEmail(normalized),
      reason,
    });
  }

  removeFromSuppression(email) {
    const normalized = email.toLowerCase();
    return this.suppressionList.delete(normalized);
  }

  isOnSuppression(email) {
    return this.suppressionList.has(email.toLowerCase());
  }

  // ===== DISCLOSURE TEMPLATES =====

  addDisclosureTemplate(id, template) {
    this.disclosureTemplates.set(id, {
      id,
      ...template,
      createdAt: new Date().toISOString(),
    });
  }

  getDisclosureTemplate(id) {
    return this.disclosureTemplates.get(id);
  }

  listDisclosureTemplates(type = null) {
    const templates = Array.from(this.disclosureTemplates.values());
    
    if (type) {
      return templates.filter(t => t.type === type);
    }
    
    return templates;
  }

  // ===== RETENTION POLICIES =====

  setRetentionPolicy(id, policy) {
    this.retentionPolicies.set(id, {
      id,
      ...policy,
      createdAt: new Date().toISOString(),
    });
  }

  getRetentionPolicy(id) {
    return this.retentionPolicies.get(id);
  }

  listRetentionPolicies() {
    return Array.from(this.retentionPolicies.values());
  }

  // ===== AUDIT TRAIL =====

  audit(action, details) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      // In production, would include user info
      userId: 'system',
    };

    this.auditLog.unshift(entry);

    // Keep last 10,000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(0, 10000);
    }

    return entry;
  }

  getAuditLog(options = {}) {
    let logs = this.auditLog;

    if (options.action) {
      logs = logs.filter(l => l.action === options.action);
    }

    if (options.fromDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(options.fromDate));
    }

    if (options.toDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(options.toDate));
    }

    return logs.slice(0, options.limit || 100);
  }

  exportAuditLog(options = {}) {
    const logs = this.getAuditLog(options);
    
    return {
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      dateRange: {
        from: options.fromDate || 'all',
        to: options.toDate || 'all',
      },
      records: logs,
    };
  }

  // ===== UTILITY METHODS =====

  normalizePhone(phone) {
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  }

  maskPhone(phone) {
    if (phone.length < 4) return '***';
    return '***-***-' + phone.slice(-4);
  }

  maskEmail(email) {
    const [local, domain] = email.split('@');
    return local.charAt(0) + '***@' + domain;
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      dncCount: this.dncList.size,
      suppressionCount: this.suppressionList.size,
      consentRecords: Array.from(this.consentRecords.values()).flat().length,
      auditEntries: this.auditLog.length,
      disclosureTemplates: this.disclosureTemplates.size,
      retentionPolicies: this.retentionPolicies.size,
    };
  }
}

// Singleton instance
export const complianceService = new ComplianceService();

export default ComplianceService;
