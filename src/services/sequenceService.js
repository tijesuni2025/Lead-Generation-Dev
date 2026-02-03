/**
 * Sequence Automation Service
 * Multi-channel outreach sequences (Email, LinkedIn, SMS, Call)
 * 
 * Features:
 * - Sequence builder with steps
 * - Delay scheduling
 * - Reply detection & auto-pause
 * - A/B testing support
 * - Performance analytics
 */

export const CHANNEL_TYPES = {
  EMAIL: 'email',
  LINKEDIN: 'linkedin',
  SMS: 'sms',
  CALL: 'call',
  TASK: 'task',
};

export const STEP_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  OPENED: 'opened',
  CLICKED: 'clicked',
  REPLIED: 'replied',
  BOUNCED: 'bounced',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

export const SEQUENCE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

// Pre-built sequence templates
export const SEQUENCE_TEMPLATES = [
  {
    id: 'initial-outreach',
    name: 'Initial Outreach',
    description: 'Standard 5-touch sequence for new leads',
    steps: [
      { day: 0, channel: 'email', subject: 'Quick question about {company}', template: 'initial_intro' },
      { day: 2, channel: 'linkedin', action: 'connect', template: 'linkedin_connect' },
      { day: 4, channel: 'email', subject: 'Following up', template: 'followup_1' },
      { day: 7, channel: 'call', template: 'call_script_1' },
      { day: 10, channel: 'email', subject: 'Last attempt', template: 'breakup_email' },
    ],
  },
  {
    id: 'warm-nurture',
    name: 'Warm Lead Nurture',
    description: 'Longer sequence for engaged but not ready leads',
    steps: [
      { day: 0, channel: 'email', subject: 'Resource you might find useful', template: 'value_add' },
      { day: 5, channel: 'linkedin', action: 'engage', template: 'linkedin_comment' },
      { day: 10, channel: 'email', subject: 'Case study: {industry}', template: 'case_study' },
      { day: 17, channel: 'email', subject: 'Quick thought', template: 'insight_share' },
      { day: 25, channel: 'call', template: 'check_in_call' },
      { day: 30, channel: 'email', subject: 'Checking in', template: 'soft_followup' },
    ],
  },
  {
    id: 'hot-lead-close',
    name: 'Hot Lead Closing',
    description: 'Aggressive sequence for high-intent leads',
    steps: [
      { day: 0, channel: 'email', subject: 'Next steps for {company}', template: 'closing_intro' },
      { day: 1, channel: 'call', template: 'closing_call' },
      { day: 2, channel: 'sms', template: 'quick_sms' },
      { day: 3, channel: 'email', subject: 'Proposal attached', template: 'proposal_email' },
      { day: 5, channel: 'call', template: 'followup_call' },
    ],
  },
  {
    id: 'reengagement',
    name: 'Database Re-engagement',
    description: 'Revive cold or dormant leads',
    steps: [
      { day: 0, channel: 'email', subject: 'It\'s been a while', template: 'reengagement_1' },
      { day: 7, channel: 'email', subject: 'New developments at {our_company}', template: 'whats_new' },
      { day: 14, channel: 'linkedin', action: 'message', template: 'linkedin_reengagement' },
      { day: 21, channel: 'email', subject: 'Should I close your file?', template: 'breakup_final' },
    ],
  },
];

// Email templates
export const EMAIL_TEMPLATES = {
  initial_intro: {
    subject: 'Quick question about {company}',
    body: `Hi {first_name},

I noticed {company} has been {personalization_hook}. As a {title}, you're likely focused on {pain_point}.

I've been working with other {title}s in {industry} on similar challenges, and there's a pattern I've noticed that might be relevant.

Would you be open to a 15-minute call to see if there's a fit?

Best,
{sender_name}`,
  },
  followup_1: {
    subject: 'Following up',
    body: `Hi {first_name},

I wanted to follow up on my previous email. I know things get busy.

Quick question: Is {pain_point} still a priority for {company} this quarter?

If so, I'd love to share how we've helped similar companies achieve {result}.

Best,
{sender_name}`,
  },
  breakup_email: {
    subject: 'Should I close your file?',
    body: `Hi {first_name},

I've reached out a few times and haven't heard back, so I'll assume the timing isn't right.

I'll close your file for now, but feel free to reach out if things change.

Best of luck with everything at {company}.

{sender_name}`,
  },
  value_add: {
    subject: 'Resource you might find useful',
    body: `Hi {first_name},

I came across this {resource_type} and thought of {company}:

{resource_link}

It covers {topic} which seemed relevant to what you're working on.

No agenda here - just thought it might be useful.

Best,
{sender_name}`,
  },
};

class SequenceEngine {
  constructor() {
    this.sequences = new Map();
    this.enrollments = new Map();
    this.stepExecutions = new Map();
  }

  // Create a new sequence
  createSequence(data) {
    const sequence = {
      id: `seq-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      steps: data.steps || [],
      status: SEQUENCE_STATUS.DRAFT,
      settings: {
        sendWindow: data.sendWindow || { start: 9, end: 17 }, // 9am-5pm
        timezone: data.timezone || 'America/New_York',
        skipWeekends: data.skipWeekends !== false,
        stopOnReply: data.stopOnReply !== false,
        stopOnMeeting: data.stopOnMeeting !== false,
        dailyLimit: data.dailyLimit || 50,
      },
      stats: {
        enrolled: 0,
        active: 0,
        completed: 0,
        replied: 0,
        meetings: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sequences.set(sequence.id, sequence);
    return sequence;
  }

  // Add step to sequence
  addStep(sequenceId, step) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    const newStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: sequence.steps.length,
      channel: step.channel,
      delayDays: step.delayDays || 0,
      delayHours: step.delayHours || 0,
      subject: step.subject || '',
      body: step.body || '',
      template: step.template || null,
      abTest: step.abTest || null, // { variants: [{ subject, body, weight }] }
    };

    sequence.steps.push(newStep);
    sequence.updatedAt = new Date().toISOString();
    return newStep;
  }

  // Enroll lead in sequence
  enrollLead(sequenceId, lead, options = {}) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) throw new Error('Sequence not found');
    if (sequence.status !== SEQUENCE_STATUS.ACTIVE) {
      throw new Error('Sequence is not active');
    }

    const enrollmentId = `enr-${Date.now()}-${lead.id}`;
    const enrollment = {
      id: enrollmentId,
      sequenceId,
      leadId: lead.id,
      lead: { ...lead },
      status: 'active',
      currentStep: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      pausedAt: null,
      pauseReason: null,
      variables: {
        first_name: lead.name.split(' ')[0],
        last_name: lead.name.split(' ').slice(1).join(' '),
        company: lead.company,
        title: lead.title,
        email: lead.email,
        ...options.variables,
      },
      stepResults: [],
    };

    this.enrollments.set(enrollmentId, enrollment);
    sequence.stats.enrolled++;
    sequence.stats.active++;

    // Schedule first step
    this.scheduleNextStep(enrollmentId);

    return enrollment;
  }

  // Schedule next step execution
  scheduleNextStep(enrollmentId) {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment || enrollment.status !== 'active') return null;

    const sequence = this.sequences.get(enrollment.sequenceId);
    if (!sequence) return null;

    const step = sequence.steps[enrollment.currentStep];
    if (!step) {
      // Sequence completed
      enrollment.status = 'completed';
      enrollment.completedAt = new Date().toISOString();
      sequence.stats.active--;
      sequence.stats.completed++;
      return null;
    }

    const scheduledTime = this.calculateScheduledTime(
      step.delayDays,
      step.delayHours,
      sequence.settings
    );

    const execution = {
      id: `exec-${Date.now()}`,
      enrollmentId,
      sequenceId: sequence.id,
      stepId: step.id,
      stepIndex: enrollment.currentStep,
      channel: step.channel,
      scheduledAt: scheduledTime,
      status: STEP_STATUS.SCHEDULED,
      content: this.renderContent(step, enrollment.variables),
    };

    this.stepExecutions.set(execution.id, execution);
    return execution;
  }

  // Calculate when to send based on settings
  calculateScheduledTime(delayDays, delayHours, settings) {
    const now = new Date();
    let scheduled = new Date(now.getTime() + delayDays * 86400000 + delayHours * 3600000);

    // Adjust for send window
    const hours = scheduled.getHours();
    if (hours < settings.sendWindow.start) {
      scheduled.setHours(settings.sendWindow.start, 0, 0, 0);
    } else if (hours >= settings.sendWindow.end) {
      scheduled.setDate(scheduled.getDate() + 1);
      scheduled.setHours(settings.sendWindow.start, 0, 0, 0);
    }

    // Skip weekends if enabled
    if (settings.skipWeekends) {
      const day = scheduled.getDay();
      if (day === 0) scheduled.setDate(scheduled.getDate() + 1); // Sunday -> Monday
      if (day === 6) scheduled.setDate(scheduled.getDate() + 2); // Saturday -> Monday
    }

    return scheduled.toISOString();
  }

  // Render content with variable substitution
  renderContent(step, variables) {
    let content = { ...step };
    
    const substitute = (text) => {
      if (!text) return text;
      return text.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
    };

    content.subject = substitute(content.subject);
    content.body = substitute(content.body);

    return content;
  }

  // Handle reply detection
  handleReply(enrollmentId, replyData) {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return;

    const sequence = this.sequences.get(enrollment.sequenceId);
    
    enrollment.stepResults.push({
      stepIndex: enrollment.currentStep,
      result: 'replied',
      replyAt: new Date().toISOString(),
      replySnippet: replyData.snippet,
    });

    if (sequence.settings.stopOnReply) {
      enrollment.status = 'paused';
      enrollment.pausedAt = new Date().toISOString();
      enrollment.pauseReason = 'reply_received';
      sequence.stats.active--;
      sequence.stats.replied++;
    }

    return enrollment;
  }

  // Get sequence analytics
  getSequenceAnalytics(sequenceId) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return null;

    const enrollments = Array.from(this.enrollments.values())
      .filter(e => e.sequenceId === sequenceId);

    const executions = Array.from(this.stepExecutions.values())
      .filter(e => e.sequenceId === sequenceId);

    const stepStats = sequence.steps.map((step, index) => {
      const stepExecs = executions.filter(e => e.stepIndex === index);
      return {
        step: index + 1,
        channel: step.channel,
        sent: stepExecs.filter(e => e.status === STEP_STATUS.SENT).length,
        opened: stepExecs.filter(e => e.status === STEP_STATUS.OPENED).length,
        clicked: stepExecs.filter(e => e.status === STEP_STATUS.CLICKED).length,
        replied: stepExecs.filter(e => e.status === STEP_STATUS.REPLIED).length,
        bounced: stepExecs.filter(e => e.status === STEP_STATUS.BOUNCED).length,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
      };
    });

    // Calculate rates
    stepStats.forEach(stat => {
      if (stat.sent > 0) {
        stat.openRate = Math.round((stat.opened / stat.sent) * 100);
        stat.clickRate = Math.round((stat.clicked / stat.sent) * 100);
        stat.replyRate = Math.round((stat.replied / stat.sent) * 100);
      }
    });

    return {
      sequence: {
        id: sequence.id,
        name: sequence.name,
        status: sequence.status,
      },
      totals: {
        enrolled: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        paused: enrollments.filter(e => e.status === 'paused').length,
      },
      stepStats,
      conversionRate: enrollments.length > 0 
        ? Math.round((sequence.stats.replied / enrollments.length) * 100)
        : 0,
    };
  }

  // List all sequences
  listSequences() {
    return Array.from(this.sequences.values());
  }

  // Get sequence by ID
  getSequence(id) {
    return this.sequences.get(id);
  }

  // Update sequence status
  updateSequenceStatus(id, status) {
    const sequence = this.sequences.get(id);
    if (!sequence) throw new Error('Sequence not found');
    sequence.status = status;
    sequence.updatedAt = new Date().toISOString();
    return sequence;
  }
}

export function generateMockSequenceData() {
  const engine = new SequenceEngine();
  
  // Create sequences from templates
  SEQUENCE_TEMPLATES.forEach(template => {
    const seq = engine.createSequence({
      name: template.name,
      description: template.description,
    });
    
    template.steps.forEach(step => {
      engine.addStep(seq.id, {
        channel: step.channel,
        delayDays: step.day,
        subject: step.subject,
        template: step.template,
      });
    });
    
    // Activate some sequences
    if (template.id !== 'reengagement') {
      engine.updateSequenceStatus(seq.id, SEQUENCE_STATUS.ACTIVE);
    }
  });

  // Add mock stats
  const sequences = engine.listSequences();
  sequences.forEach(seq => {
    seq.stats = {
      enrolled: Math.floor(Math.random() * 200) + 50,
      active: Math.floor(Math.random() * 50) + 10,
      completed: Math.floor(Math.random() * 100) + 20,
      replied: Math.floor(Math.random() * 30) + 5,
      meetings: Math.floor(Math.random() * 15) + 2,
    };
  });

  return engine;
}

// Singleton instance
export const sequenceEngine = generateMockSequenceData();

export default SequenceEngine;
