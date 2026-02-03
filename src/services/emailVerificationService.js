/**
 * Email Verification Service
 * Email validation, verification, and bounce prediction
 * 
 * Features:
 * - Syntax validation
 * - MX record checking
 * - Mailbox verification
 * - Bounce prediction
 * - Bulk verification
 * - Disposable email detection
 */

// ============================================================================
// VERIFICATION STATUS
// ============================================================================

export const VERIFICATION_STATUS = {
  VALID: 'valid',
  INVALID: 'invalid',
  RISKY: 'risky',
  UNKNOWN: 'unknown',
  PENDING: 'pending',
};

export const VERIFICATION_REASONS = {
  VALID_MAILBOX: 'valid_mailbox',
  INVALID_SYNTAX: 'invalid_syntax',
  INVALID_DOMAIN: 'invalid_domain',
  NO_MX_RECORD: 'no_mx_record',
  MAILBOX_NOT_FOUND: 'mailbox_not_found',
  CATCH_ALL: 'catch_all_domain',
  DISPOSABLE: 'disposable_email',
  ROLE_BASED: 'role_based',
  TIMEOUT: 'verification_timeout',
};

// ============================================================================
// KNOWN PATTERNS
// ============================================================================

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getairmail.com', 'fakeinbox.com', 'tempinbox.com', 'emailondeck.com',
];

const ROLE_BASED_PREFIXES = [
  'info', 'sales', 'support', 'help', 'admin', 'contact', 'team',
  'hello', 'office', 'noreply', 'no-reply', 'postmaster', 'webmaster',
  'marketing', 'press', 'media', 'hr', 'jobs', 'careers', 'billing',
];

const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
];

// ============================================================================
// EMAIL VERIFICATION SERVICE
// ============================================================================

class EmailVerificationService {
  constructor() {
    this.verificationCache = new Map();
    this.verificationLogs = [];
    this.stats = {
      totalVerified: 0,
      valid: 0,
      invalid: 0,
      risky: 0,
    };
  }

  // ===== SINGLE VERIFICATION =====

  async verifyEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check cache first
    if (this.verificationCache.has(normalizedEmail)) {
      const cached = this.verificationCache.get(normalizedEmail);
      if (Date.now() - cached.timestamp < 86400000 * 7) { // 7 day cache
        return cached.result;
      }
    }

    const result = await this.performVerification(normalizedEmail);
    
    // Cache result
    this.verificationCache.set(normalizedEmail, {
      result,
      timestamp: Date.now(),
    });

    // Update stats
    this.stats.totalVerified++;
    if (result.status === VERIFICATION_STATUS.VALID) this.stats.valid++;
    else if (result.status === VERIFICATION_STATUS.INVALID) this.stats.invalid++;
    else if (result.status === VERIFICATION_STATUS.RISKY) this.stats.risky++;

    this.log(normalizedEmail, result.status, result.reason);

    return result;
  }

  async performVerification(email) {
    const result = {
      email,
      status: VERIFICATION_STATUS.UNKNOWN,
      reason: null,
      score: 0,
      checks: {},
      metadata: {},
      verifiedAt: new Date().toISOString(),
    };

    // Step 1: Syntax validation
    const syntaxCheck = this.validateSyntax(email);
    result.checks.syntax = syntaxCheck;
    if (!syntaxCheck.valid) {
      result.status = VERIFICATION_STATUS.INVALID;
      result.reason = VERIFICATION_REASONS.INVALID_SYNTAX;
      result.score = 0;
      return result;
    }
    result.score += 20;

    const [localPart, domain] = email.split('@');

    // Step 2: Domain validation
    const domainCheck = await this.validateDomain(domain);
    result.checks.domain = domainCheck;
    if (!domainCheck.valid) {
      result.status = VERIFICATION_STATUS.INVALID;
      result.reason = VERIFICATION_REASONS.INVALID_DOMAIN;
      result.score = 10;
      return result;
    }
    result.score += 20;
    result.metadata.domain = domainCheck.info;

    // Step 3: MX record check
    const mxCheck = await this.checkMXRecords(domain);
    result.checks.mx = mxCheck;
    if (!mxCheck.hasMX) {
      result.status = VERIFICATION_STATUS.INVALID;
      result.reason = VERIFICATION_REASONS.NO_MX_RECORD;
      result.score = 20;
      return result;
    }
    result.score += 20;

    // Step 4: Disposable email check
    const disposableCheck = this.checkDisposable(domain);
    result.checks.disposable = disposableCheck;
    if (disposableCheck.isDisposable) {
      result.status = VERIFICATION_STATUS.INVALID;
      result.reason = VERIFICATION_REASONS.DISPOSABLE;
      result.score = 15;
      return result;
    }
    result.score += 10;

    // Step 5: Role-based check
    const roleCheck = this.checkRoleBased(localPart);
    result.checks.roleBased = roleCheck;
    if (roleCheck.isRoleBased) {
      result.metadata.isRoleBased = true;
      // Role-based emails are risky but not invalid
      result.score -= 10;
    } else {
      result.score += 10;
    }

    // Step 6: Free email provider check
    const freeCheck = this.checkFreeProvider(domain);
    result.checks.freeProvider = freeCheck;
    result.metadata.isFreeProvider = freeCheck.isFree;

    // Step 7: Mailbox verification (simulated)
    const mailboxCheck = await this.verifyMailbox(email, domain);
    result.checks.mailbox = mailboxCheck;
    
    if (mailboxCheck.exists === false) {
      result.status = VERIFICATION_STATUS.INVALID;
      result.reason = VERIFICATION_REASONS.MAILBOX_NOT_FOUND;
      result.score = 25;
      return result;
    }
    
    if (mailboxCheck.catchAll) {
      result.metadata.isCatchAll = true;
      result.score += 10; // Can't fully verify catch-all
    } else {
      result.score += 20;
    }

    // Calculate final status
    if (result.score >= 80) {
      result.status = VERIFICATION_STATUS.VALID;
      result.reason = VERIFICATION_REASONS.VALID_MAILBOX;
    } else if (result.score >= 50) {
      result.status = VERIFICATION_STATUS.RISKY;
      result.reason = roleCheck.isRoleBased 
        ? VERIFICATION_REASONS.ROLE_BASED 
        : VERIFICATION_REASONS.CATCH_ALL;
    } else {
      result.status = VERIFICATION_STATUS.UNKNOWN;
    }

    return result;
  }

  // ===== VALIDATION CHECKS =====

  validateSyntax(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const valid = emailRegex.test(email);
    
    return {
      valid,
      details: valid ? 'Email syntax is valid' : 'Email syntax is invalid',
    };
  }

  async validateDomain(domain) {
    // In production, this would do actual DNS lookup
    const valid = domain.includes('.') && domain.length > 3;
    const tld = domain.split('.').pop();
    const validTlds = ['com', 'org', 'net', 'io', 'co', 'ai', 'dev', 'app', 'world', 'biz', 'info'];
    
    return {
      valid: valid && validTlds.includes(tld),
      info: {
        domain,
        tld,
        registrar: 'Unknown',
        createdAt: null,
      },
    };
  }

  async checkMXRecords(domain) {
    // In production, this would do actual MX lookup
    // Simulate based on known patterns
    const hasMX = !domain.includes('invalid') && !domain.includes('fake');
    
    return {
      hasMX,
      records: hasMX ? [
        { priority: 10, exchange: `mx1.${domain}` },
        { priority: 20, exchange: `mx2.${domain}` },
      ] : [],
    };
  }

  checkDisposable(domain) {
    const isDisposable = DISPOSABLE_DOMAINS.some(d => 
      domain === d || domain.endsWith(`.${d}`)
    );
    
    return {
      isDisposable,
      details: isDisposable ? 'Disposable email domain detected' : 'Not a disposable domain',
    };
  }

  checkRoleBased(localPart) {
    const isRoleBased = ROLE_BASED_PREFIXES.some(prefix => 
      localPart === prefix || localPart.startsWith(`${prefix}.`) || localPart.startsWith(`${prefix}_`)
    );
    
    return {
      isRoleBased,
      details: isRoleBased ? 'Role-based email address' : 'Personal email address',
    };
  }

  checkFreeProvider(domain) {
    const isFree = FREE_EMAIL_PROVIDERS.includes(domain);
    
    return {
      isFree,
      provider: isFree ? domain : null,
      details: isFree ? 'Free email provider' : 'Business email domain',
    };
  }

  async verifyMailbox(email, domain) {
    // In production, this would do SMTP verification
    // Simulating based on patterns
    
    // Simulate catch-all detection
    const catchAll = Math.random() > 0.7;
    
    // Simulate mailbox existence (most valid-looking emails exist)
    const exists = Math.random() > 0.1;
    
    return {
      exists,
      catchAll,
      acceptsAll: catchAll,
      details: exists 
        ? (catchAll ? 'Domain accepts all emails' : 'Mailbox verified') 
        : 'Mailbox does not exist',
    };
  }

  // ===== BULK VERIFICATION =====

  async verifyBulk(emails, options = {}) {
    const { concurrency = 5, rateLimit = 100 } = options;
    
    const results = {
      total: emails.length,
      verified: 0,
      valid: [],
      invalid: [],
      risky: [],
      unknown: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    // Process in batches
    const batches = [];
    for (let i = 0; i < emails.length; i += concurrency) {
      batches.push(emails.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(email => this.verifyEmail(email))
      );

      for (const result of batchResults) {
        results.verified++;
        
        switch (result.status) {
          case VERIFICATION_STATUS.VALID:
            results.valid.push(result);
            break;
          case VERIFICATION_STATUS.INVALID:
            results.invalid.push(result);
            break;
          case VERIFICATION_STATUS.RISKY:
            results.risky.push(result);
            break;
          default:
            results.unknown.push(result);
        }
      }

      // Rate limiting
      if (rateLimit > 0) {
        await new Promise(r => setTimeout(r, rateLimit));
      }
    }

    results.completedAt = new Date().toISOString();
    
    return results;
  }

  // ===== BOUNCE PREDICTION =====

  predictBounce(verificationResult) {
    let bounceRisk = 'low';
    let bounceProbability = 5;

    if (verificationResult.status === VERIFICATION_STATUS.INVALID) {
      bounceRisk = 'high';
      bounceProbability = 95;
    } else if (verificationResult.status === VERIFICATION_STATUS.RISKY) {
      bounceRisk = 'medium';
      bounceProbability = 35;
    } else if (verificationResult.status === VERIFICATION_STATUS.UNKNOWN) {
      bounceRisk = 'medium';
      bounceProbability = 25;
    } else {
      // Valid email
      if (verificationResult.metadata?.isCatchAll) {
        bounceProbability = 15;
      } else if (verificationResult.metadata?.isRoleBased) {
        bounceProbability = 10;
      }
    }

    return {
      risk: bounceRisk,
      probability: bounceProbability,
      recommendation: this.getBounceRecommendation(bounceRisk),
    };
  }

  getBounceRecommendation(risk) {
    switch (risk) {
      case 'high':
        return 'Do not send - high bounce probability will damage sender reputation';
      case 'medium':
        return 'Send with caution - consider removing from automated sequences';
      case 'low':
        return 'Safe to send - low bounce risk';
      default:
        return 'Verify before sending';
    }
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      ...this.stats,
      validRate: this.stats.totalVerified > 0 
        ? Math.round((this.stats.valid / this.stats.totalVerified) * 100) 
        : 0,
      invalidRate: this.stats.totalVerified > 0 
        ? Math.round((this.stats.invalid / this.stats.totalVerified) * 100) 
        : 0,
      riskyRate: this.stats.totalVerified > 0 
        ? Math.round((this.stats.risky / this.stats.totalVerified) * 100) 
        : 0,
    };
  }

  // ===== LOGGING =====

  log(email, status, reason) {
    this.verificationLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: this.maskEmail(email),
      status,
      reason,
    });

    if (this.verificationLogs.length > 500) {
      this.verificationLogs = this.verificationLogs.slice(0, 500);
    }
  }

  maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  getLogs(limit = 50) {
    return this.verificationLogs.slice(0, limit);
  }
}

// Singleton instance
export const emailVerificationService = new EmailVerificationService();

export default EmailVerificationService;
