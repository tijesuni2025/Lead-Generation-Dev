/**
 * Calendar Integration Service
 * Google Calendar & Outlook integration
 * 
 * Features:
 * - Calendar sync
 * - Meeting scheduler (booking links)
 * - Availability detection
 * - Pre-meeting briefs
 * - Post-meeting follow-up
 */

// ============================================================================
// CALENDAR PROVIDERS
// ============================================================================

export const CALENDAR_PROVIDERS = {
  GOOGLE: 'google',
  OUTLOOK: 'outlook',
  APPLE: 'apple',
};

export const MEETING_TYPES = {
  DISCOVERY: 'discovery',
  DEMO: 'demo',
  FOLLOWUP: 'followup',
  CLOSING: 'closing',
  CHECK_IN: 'check_in',
};

export const MEETING_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
};

// ============================================================================
// MEETING TYPES CONFIGURATION
// ============================================================================

export const MEETING_TYPE_CONFIGS = {
  discovery: {
    name: 'Discovery Call',
    duration: 30,
    description: 'Initial conversation to understand your needs',
    color: '#3b82f6',
    questions: [
      'What prompted you to take this meeting?',
      'What does success look like for you this quarter?',
      'Who else is involved in decisions like this?',
      'What have you tried so far?',
    ],
  },
  demo: {
    name: 'Product Demo',
    duration: 45,
    description: 'See how our solution works for your use case',
    color: '#8b5cf6',
    questions: [
      'What specific workflows would you like to see?',
      'Who from your team should join?',
      'What would make this demo valuable for you?',
    ],
  },
  followup: {
    name: 'Follow-up Call',
    duration: 20,
    description: 'Continue our conversation',
    color: '#10b981',
    questions: [
      'What questions came up since our last call?',
      'Have you had a chance to discuss internally?',
    ],
  },
  closing: {
    name: 'Closing Call',
    duration: 30,
    description: 'Finalize the details',
    color: '#f59e0b',
    questions: [
      'What do you need to move forward?',
      'Are there any remaining concerns?',
      'What timeline works for implementation?',
    ],
  },
  check_in: {
    name: 'Check-in',
    duration: 15,
    description: 'Quick sync',
    color: '#6b7280',
    questions: [],
  },
};

// ============================================================================
// CALENDAR SERVICE
// ============================================================================

class CalendarService {
  constructor() {
    this.connections = new Map();
    this.meetings = new Map();
    this.bookingLinks = new Map();
    this.availability = new Map();
  }

  // ===== CONNECTION MANAGEMENT =====

  async connect(provider, credentials) {
    const connection = {
      id: `cal-${Date.now()}`,
      provider,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      email: credentials.email || 'user@example.com',
      calendars: [],
      settings: {
        defaultCalendar: null,
        syncEnabled: true,
        showBusyAs: 'busy',
        defaultReminder: 15, // minutes
      },
      credentials: {
        accessToken: credentials.accessToken || 'mock-token',
        refreshToken: credentials.refreshToken || 'mock-refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    };

    // Mock calendars
    connection.calendars = [
      { id: 'primary', name: 'Primary Calendar', primary: true },
      { id: 'work', name: 'Work Calendar', primary: false },
    ];
    connection.settings.defaultCalendar = 'primary';

    this.connections.set(provider, connection);
    return connection;
  }

  disconnect(provider) {
    this.connections.delete(provider);
    return true;
  }

  getConnection(provider) {
    return this.connections.get(provider);
  }

  listConnections() {
    return Array.from(this.connections.values());
  }

  // ===== AVAILABILITY =====

  // Get user availability for a date range
  async getAvailability(startDate, endDate, options = {}) {
    const {
      duration = 30,
      workingHours = { start: 9, end: 17 },
      bufferMinutes = 15,
      timezone = 'America/New_York',
    } = options;

    const slots = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const daySlots = this.generateDaySlots(current, {
          duration,
          workingHours,
          bufferMinutes,
        });
        
        // Filter out busy times (mock)
        const availableSlots = daySlots.filter(() => Math.random() > 0.3);
        slots.push(...availableSlots);
      }
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  generateDaySlots(date, options) {
    const slots = [];
    const { duration, workingHours, bufferMinutes } = options;
    
    let currentTime = new Date(date);
    currentTime.setHours(workingHours.start, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(workingHours.end, 0, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      if (slotEnd <= endTime) {
        slots.push({
          start: new Date(currentTime).toISOString(),
          end: slotEnd.toISOString(),
          duration,
        });
      }
      
      currentTime = new Date(currentTime.getTime() + (duration + bufferMinutes) * 60000);
    }

    return slots;
  }

  // ===== BOOKING LINKS =====

  createBookingLink(options) {
    const link = {
      id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slug: options.slug || `meeting-${Date.now()}`,
      name: options.name || 'Meeting',
      type: options.type || MEETING_TYPES.DISCOVERY,
      duration: options.duration || MEETING_TYPE_CONFIGS[options.type]?.duration || 30,
      description: options.description || '',
      settings: {
        workingHours: options.workingHours || { start: 9, end: 17 },
        bufferBefore: options.bufferBefore || 15,
        bufferAfter: options.bufferAfter || 15,
        minNotice: options.minNotice || 24, // hours
        maxAdvance: options.maxAdvance || 30, // days
        timezone: options.timezone || 'America/New_York',
      },
      questions: options.questions || [],
      confirmationMessage: options.confirmationMessage || 'Your meeting has been scheduled!',
      isActive: true,
      createdAt: new Date().toISOString(),
      stats: {
        views: 0,
        bookings: 0,
        cancellations: 0,
      },
    };

    this.bookingLinks.set(link.id, link);
    return link;
  }

  getBookingLink(id) {
    return this.bookingLinks.get(id);
  }

  listBookingLinks() {
    return Array.from(this.bookingLinks.values());
  }

  // ===== MEETINGS =====

  async scheduleMeeting(bookingLinkId, slot, attendee, answers = {}) {
    const bookingLink = this.bookingLinks.get(bookingLinkId);
    if (!bookingLink) throw new Error('Booking link not found');

    const meeting = {
      id: `mtg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bookingLinkId,
      type: bookingLink.type,
      title: `${bookingLink.name} with ${attendee.name}`,
      startTime: slot.start,
      endTime: slot.end,
      duration: bookingLink.duration,
      status: MEETING_STATUS.SCHEDULED,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        company: attendee.company || '',
        phone: attendee.phone || '',
      },
      answers,
      location: {
        type: 'video',
        url: `https://meet.example.com/${meeting?.id || Date.now()}`,
      },
      reminders: [
        { type: 'email', minutes: 1440 }, // 24 hours
        { type: 'email', minutes: 60 },   // 1 hour
      ],
      notes: '',
      outcome: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.meetings.set(meeting.id, meeting);
    bookingLink.stats.bookings++;

    return meeting;
  }

  getMeeting(id) {
    return this.meetings.get(id);
  }

  listMeetings(options = {}) {
    let meetings = Array.from(this.meetings.values());

    if (options.status) {
      meetings = meetings.filter(m => m.status === options.status);
    }

    if (options.fromDate) {
      meetings = meetings.filter(m => new Date(m.startTime) >= new Date(options.fromDate));
    }

    if (options.toDate) {
      meetings = meetings.filter(m => new Date(m.startTime) <= new Date(options.toDate));
    }

    // Sort by start time
    meetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return meetings;
  }

  updateMeetingStatus(id, status, notes = '') {
    const meeting = this.meetings.get(id);
    if (!meeting) throw new Error('Meeting not found');

    meeting.status = status;
    meeting.notes = notes || meeting.notes;
    meeting.updatedAt = new Date().toISOString();

    if (status === MEETING_STATUS.CANCELLED) {
      const bookingLink = this.bookingLinks.get(meeting.bookingLinkId);
      if (bookingLink) bookingLink.stats.cancellations++;
    }

    return meeting;
  }

  // ===== PRE-MEETING BRIEFS =====

  generateMeetingBrief(meetingId, lead) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const config = MEETING_TYPE_CONFIGS[meeting.type] || MEETING_TYPE_CONFIGS.discovery;

    const brief = {
      meetingId,
      generatedAt: new Date().toISOString(),
      meeting: {
        title: meeting.title,
        time: meeting.startTime,
        duration: meeting.duration,
        type: config.name,
        location: meeting.location,
      },
      attendee: meeting.attendee,
      lead: lead ? {
        name: lead.name,
        company: lead.company,
        title: lead.title,
        status: lead.status,
        score: lead.score,
        value: lead.value,
        interactions: lead.interactions,
        lastContact: lead.lastContact,
      } : null,
      preparation: {
        questions: config.questions,
        suggestedAgenda: this.generateAgenda(meeting.type, meeting.duration),
        talkingPoints: this.generateTalkingPoints(meeting.type, lead),
      },
      preCallChecklist: [
        'Review attendee\'s LinkedIn profile',
        'Check for recent company news',
        'Prepare relevant case studies',
        'Test video/audio connection',
        'Have demo environment ready',
      ],
    };

    return brief;
  }

  generateAgenda(type, duration) {
    const agendas = {
      discovery: [
        { minutes: 2, item: 'Introductions and rapport building' },
        { minutes: 5, item: 'Understand current situation' },
        { minutes: 10, item: 'Explore pain points and challenges' },
        { minutes: 8, item: 'Discuss goals and success metrics' },
        { minutes: 3, item: 'Brief overview of how we can help' },
        { minutes: 2, item: 'Next steps and scheduling' },
      ],
      demo: [
        { minutes: 3, item: 'Recap previous conversation' },
        { minutes: 5, item: 'Confirm key workflows to cover' },
        { minutes: 25, item: 'Live product demonstration' },
        { minutes: 7, item: 'Q&A and discussion' },
        { minutes: 5, item: 'Pricing overview and next steps' },
      ],
      followup: [
        { minutes: 2, item: 'Check-in since last conversation' },
        { minutes: 10, item: 'Address questions and concerns' },
        { minutes: 5, item: 'Discuss timeline and decision process' },
        { minutes: 3, item: 'Clarify next steps' },
      ],
      closing: [
        { minutes: 3, item: 'Confirm understanding of needs' },
        { minutes: 10, item: 'Review proposal and terms' },
        { minutes: 10, item: 'Address final concerns' },
        { minutes: 5, item: 'Discuss implementation timeline' },
        { minutes: 2, item: 'Confirm commitment and next steps' },
      ],
    };

    return agendas[type] || agendas.discovery;
  }

  generateTalkingPoints(type, lead) {
    const points = [
      `Reference their role as ${lead?.title || 'decision maker'} at ${lead?.company || 'their company'}`,
      'Ask about their current process and pain points',
      'Share relevant success story from similar company',
      'Discuss potential ROI and timeline',
    ];

    if (lead?.status === 'Hot') {
      points.push('They are showing high buying signals - focus on closing');
    }

    if (lead?.score >= 80) {
      points.push('High-scoring lead - emphasize urgency and value');
    }

    return points;
  }
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockCalendarData() {
  const service = new CalendarService();

  // Create booking links
  Object.keys(MEETING_TYPES).forEach(type => {
    const config = MEETING_TYPE_CONFIGS[type.toLowerCase()];
    if (config) {
      service.createBookingLink({
        name: config.name,
        type: type.toLowerCase(),
        duration: config.duration,
        description: config.description,
        slug: type.toLowerCase().replace('_', '-'),
      });
    }
  });

  // Add mock stats to booking links
  service.listBookingLinks().forEach(link => {
    link.stats = {
      views: Math.floor(Math.random() * 200) + 50,
      bookings: Math.floor(Math.random() * 30) + 5,
      cancellations: Math.floor(Math.random() * 5),
    };
  });

  // Create mock meetings
  const attendees = [
    { name: 'James Wilson', email: 'james@quantumlabs.com', company: 'Quantum Labs' },
    { name: 'Emma Thompson', email: 'emma@atlasventures.com', company: 'Atlas Ventures' },
    { name: 'Michael Brown', email: 'michael@meridian.com', company: 'Meridian Capital' },
  ];

  const bookingLinks = service.listBookingLinks();
  
  attendees.forEach((attendee, i) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i + 1);
    futureDate.setHours(10 + i, 0, 0, 0);

    const slot = {
      start: futureDate.toISOString(),
      end: new Date(futureDate.getTime() + 30 * 60000).toISOString(),
    };

    service.scheduleMeeting(
      bookingLinks[i % bookingLinks.length].id,
      slot,
      attendee
    );
  });

  return service;
}

// Singleton instance
export const calendarService = generateMockCalendarData();

export default CalendarService;
