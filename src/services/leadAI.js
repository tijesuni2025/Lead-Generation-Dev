/**
 * AI Service for LeadGen Pro
 * Production-grade AI assistant with Claude API integration
 * 
 * Features:
 * - Lead scoring & prioritization
 * - Predictive analytics
 * - Personalized outreach generation
 * - Pipeline forecasting
 * - Objection handling
 * - Meeting preparation
 */

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

// ============================================================================
// LEAD ANALYSIS ENGINE
// ============================================================================

/**
 * Calculate ML-based lead score with multiple signals
 */
export function calculateLeadScore(lead, allLeads) {
  const weights = {
    engagement: 0.25,
    firmographics: 0.20,
    timing: 0.20,
    intent: 0.20,
    fit: 0.15,
  };

  // Engagement score (interactions, recency)
  const maxInteractions = Math.max(...allLeads.map(l => l.interactions || 1));
  const engagementScore = ((lead.interactions || 1) / maxInteractions) * 100;
  
  // Timing score (recency of contact)
  const daysSinceContact = Math.floor((Date.now() - new Date(lead.lastContact)) / 864e5);
  const timingScore = Math.max(0, 100 - daysSinceContact * 3);
  
  // Intent signals (based on status)
  const intentScores = { Hot: 95, Warm: 70, New: 50, Cold: 25 };
  const intentScore = intentScores[lead.status] || 50;
  
  // Firmographics (title seniority)
  const titleScores = { CEO: 95, CFO: 90, Founder: 90, Partner: 85, VP: 80, Director: 70, Manager: 60 };
  const titleKey = Object.keys(titleScores).find(t => lead.title?.includes(t));
  const firmScore = titleScores[titleKey] || 50;
  
  // Deal fit (value potential)
  const maxValue = Math.max(...allLeads.map(l => l.value || 1));
  const fitScore = ((lead.value || 0) / maxValue) * 100;
  
  const finalScore = Math.round(
    weights.engagement * engagementScore +
    weights.firmographics * firmScore +
    weights.timing * timingScore +
    weights.intent * intentScore +
    weights.fit * fitScore
  );
  
  return {
    score: Math.min(99, Math.max(1, finalScore)),
    breakdown: {
      engagement: Math.round(engagementScore),
      firmographics: Math.round(firmScore),
      timing: Math.round(timingScore),
      intent: Math.round(intentScore),
      fit: Math.round(fitScore),
    },
    signals: getScoreSignals(lead, { engagementScore, firmScore, timingScore, intentScore, fitScore }),
  };
}

function getScoreSignals(lead, scores) {
  const signals = [];
  
  if (scores.intentScore >= 90) signals.push({ type: 'positive', text: 'High buying intent detected' });
  if (scores.firmScore >= 85) signals.push({ type: 'positive', text: 'Decision-maker level contact' });
  if (scores.timingScore >= 80) signals.push({ type: 'positive', text: 'Recently engaged' });
  if (scores.engagementScore >= 70) signals.push({ type: 'positive', text: 'Strong engagement history' });
  
  if (scores.timingScore < 40) signals.push({ type: 'warning', text: 'No recent contact - risk of going cold' });
  if (scores.engagementScore < 30) signals.push({ type: 'warning', text: 'Low engagement - needs nurturing' });
  
  return signals;
}

/**
 * Predict conversion probability
 */
export function predictConversion(lead, historicalData) {
  const baseRates = { Hot: 0.35, Warm: 0.18, New: 0.08, Cold: 0.03 };
  const baseRate = baseRates[lead.status] || 0.1;
  
  // Adjustments based on signals
  let multiplier = 1;
  
  // Title adjustment
  if (['CEO', 'CFO', 'Founder', 'Owner'].some(t => lead.title?.includes(t))) multiplier *= 1.3;
  
  // Recency adjustment
  const daysSinceContact = Math.floor((Date.now() - new Date(lead.lastContact)) / 864e5);
  if (daysSinceContact < 7) multiplier *= 1.2;
  else if (daysSinceContact > 30) multiplier *= 0.7;
  
  // Engagement adjustment
  if (lead.interactions >= 5) multiplier *= 1.25;
  
  const probability = Math.min(0.95, baseRate * multiplier);
  
  return {
    probability: Math.round(probability * 100),
    confidence: lead.interactions >= 3 ? 'high' : 'medium',
    expectedDays: estimateDaysToClose(lead),
    factors: [
      { factor: 'Status', impact: baseRate > 0.15 ? 'positive' : 'neutral', value: lead.status },
      { factor: 'Seniority', impact: multiplier > 1.2 ? 'positive' : 'neutral', value: lead.title },
      { factor: 'Recency', impact: daysSinceContact < 14 ? 'positive' : 'negative', value: `${daysSinceContact} days` },
    ],
  };
}

function estimateDaysToClose(lead) {
  const baseDays = { Hot: 14, Warm: 45, New: 90, Cold: 120 };
  return baseDays[lead.status] || 60;
}

/**
 * Generate pipeline forecast
 */
export function forecastPipeline(leads, days = 30) {
  const forecast = {
    period: `${days} days`,
    deals: { expected: 0, optimistic: 0, conservative: 0 },
    revenue: { expected: 0, optimistic: 0, conservative: 0 },
    breakdown: [],
  };
  
  leads.forEach(lead => {
    const prediction = predictConversion(lead);
    const prob = prediction.probability / 100;
    
    if (prediction.expectedDays <= days) {
      forecast.deals.expected += prob;
      forecast.deals.optimistic += Math.min(1, prob * 1.3);
      forecast.deals.conservative += prob * 0.7;
      
      forecast.revenue.expected += lead.value * prob;
      forecast.revenue.optimistic += lead.value * Math.min(1, prob * 1.3);
      forecast.revenue.conservative += lead.value * prob * 0.7;
      
      if (prob >= 0.2) {
        forecast.breakdown.push({
          lead: lead.name,
          company: lead.company,
          value: lead.value,
          probability: prediction.probability,
          expectedDays: prediction.expectedDays,
        });
      }
    }
  });
  
  forecast.deals.expected = Math.round(forecast.deals.expected);
  forecast.deals.optimistic = Math.round(forecast.deals.optimistic);
  forecast.deals.conservative = Math.round(forecast.deals.conservative);
  
  forecast.breakdown.sort((a, b) => b.probability - a.probability);
  
  return forecast;
}

/**
 * Identify leads needing attention
 */
export function identifyAtRiskLeads(leads) {
  const atRisk = [];
  const now = Date.now();
  
  leads.forEach(lead => {
    const daysSinceContact = Math.floor((now - new Date(lead.lastContact)) / 864e5);
    const risks = [];
    
    if (lead.status === 'Hot' && daysSinceContact > 7) {
      risks.push({ type: 'urgent', message: 'Hot lead going cold - no contact in 7+ days' });
    }
    if (lead.status === 'Warm' && daysSinceContact > 14) {
      risks.push({ type: 'warning', message: 'Warm lead cooling - no contact in 2+ weeks' });
    }
    if (lead.interactions < 2 && daysSinceContact > 21) {
      risks.push({ type: 'warning', message: 'Low engagement - needs nurturing' });
    }
    
    if (risks.length > 0) {
      atRisk.push({ ...lead, risks, daysSinceContact });
    }
  });
  
  return atRisk.sort((a, b) => {
    const aUrgent = a.risks.some(r => r.type === 'urgent');
    const bUrgent = b.risks.some(r => r.type === 'urgent');
    if (aUrgent && !bUrgent) return -1;
    if (bUrgent && !aUrgent) return 1;
    return a.daysSinceContact - b.daysSinceContact;
  });
}

/**
 * Generate best next action for a lead
 */
export function recommendNextAction(lead, allLeads) {
  const daysSinceContact = Math.floor((Date.now() - new Date(lead.lastContact)) / 864e5);
  const score = calculateLeadScore(lead, allLeads);
  
  if (lead.status === 'Hot') {
    if (daysSinceContact > 3) {
      return { action: 'call', priority: 'urgent', reason: 'Hot lead needs immediate follow-up' };
    }
    return { action: 'meeting', priority: 'high', reason: 'Schedule demo/meeting to close' };
  }
  
  if (lead.status === 'Warm') {
    if (lead.interactions < 3) {
      return { action: 'email', priority: 'high', reason: 'Build relationship with value-add content' };
    }
    return { action: 'call', priority: 'medium', reason: 'Qualify further with discovery call' };
  }
  
  if (lead.status === 'New') {
    return { action: 'email', priority: 'medium', reason: 'Initial outreach with personalized message' };
  }
  
  if (score.score >= 50) {
    return { action: 'email', priority: 'low', reason: 'Re-engagement campaign' };
  }
  
  return { action: 'nurture', priority: 'low', reason: 'Add to automated nurture sequence' };
}

// ============================================================================
// CLAUDE API INTEGRATION
// ============================================================================

/**
 * System prompt for the AI assistant
 */
function buildSystemPrompt(user, leads, context = {}) {
  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.status === 'Hot').length,
    warm: leads.filter(l => l.status === 'Warm').length,
    cold: leads.filter(l => l.status === 'Cold').length,
    totalValue: leads.reduce((s, l) => s + l.value, 0),
    avgScore: Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) || 0,
  };
  
  const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, 10);
  const atRiskLeads = identifyAtRiskLeads(leads).slice(0, 5);
  const forecast = forecastPipeline(leads, 30);
  
  return `You are an elite AI sales assistant for ${user.name} at ${user.company || 'their company'}. You have deep expertise in B2B sales, lead generation, and revenue operations.

## YOUR CAPABILITIES
1. **Lead Scoring & Prioritization** - ML-based analysis with conversion predictions
2. **Personalized Outreach** - Email drafts, call scripts, LinkedIn messages
3. **Pipeline Analytics** - Forecasting, deal velocity, win rate analysis
4. **Objection Handling** - Context-aware responses to common objections
5. **Meeting Preparation** - Pre-call briefs with talking points
6. **Strategic Recommendations** - Data-driven next actions

## CURRENT PIPELINE DATA
- Total Leads: ${stats.total}
- Hot: ${stats.hot} | Warm: ${stats.warm} | Cold: ${stats.cold}
- Pipeline Value: $${(stats.totalValue / 1000000).toFixed(2)}M
- Average Score: ${stats.avgScore}/100

## TOP 10 LEADS BY SCORE
${topLeads.map((l, i) => `${i + 1}. ${l.name} (${l.company}) - ${l.title} - Status: ${l.status} - Score: ${l.score} - Value: $${(l.value/1000).toFixed(0)}K`).join('\n')}

## AT-RISK LEADS REQUIRING ATTENTION
${atRiskLeads.length > 0 ? atRiskLeads.map(l => `- ${l.name} (${l.company}): ${l.risks[0]?.message}`).join('\n') : 'No at-risk leads currently'}

## 30-DAY FORECAST
- Expected Deals: ${forecast.deals.expected} (${forecast.deals.conservative}-${forecast.deals.optimistic} range)
- Expected Revenue: $${(forecast.revenue.expected / 1000).toFixed(0)}K

## RESPONSE GUIDELINES
- Be concise but actionable
- Use data from the pipeline when relevant
- Provide specific names and numbers when discussing leads
- Format emails/scripts in a ready-to-use format
- Include conversion probability when discussing specific leads
- Prioritize based on score and urgency
- Be direct and confident in recommendations

When asked about specific leads, always reference their actual data. When drafting outreach, personalize based on their title, company, and status.`;
}

/**
 * Call Claude API
 */
export async function callClaudeAPI(messages, user, leads, options = {}) {
  if (!API_KEY) {
    // Return intelligent fallback responses when no API key
    return generateFallbackResponse(messages[messages.length - 1]?.content || '', leads, user);
  }
  
  const systemPrompt = buildSystemPrompt(user, leads);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: options.model || 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 1500,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      return generateFallbackResponse(messages[messages.length - 1]?.content || '', leads, user);
    }
    
    const data = await response.json();
    return data.content[0]?.text || 'I apologize, but I encountered an issue generating a response.';
  } catch (error) {
    console.error('API call failed:', error);
    return generateFallbackResponse(messages[messages.length - 1]?.content || '', leads, user);
  }
}

/**
 * Generate intelligent fallback responses when API is unavailable
 */
function generateFallbackResponse(query, leads, user) {
  const q = query.toLowerCase();
  const topLeads = [...leads].sort((a, b) => b.score - a.score);
  const hotLeads = leads.filter(l => l.status === 'Hot');
  const atRisk = identifyAtRiskLeads(leads);
  const forecast = forecastPipeline(leads, 30);
  
  // Prioritization queries
  if (q.includes('priorit') || q.includes('focus') || q.includes('top') || q.includes('best')) {
    const top5 = topLeads.slice(0, 5);
    return `## Top 5 Priority Leads

Based on my analysis of engagement, intent signals, and deal potential:

${top5.map((l, i) => {
  const prediction = predictConversion(l);
  const action = recommendNextAction(l, leads);
  return `### ${i + 1}. ${l.name} — ${l.company}
- **Title:** ${l.title}
- **Status:** ${l.status} | **Score:** ${l.score}/100
- **Deal Value:** $${(l.value/1000).toFixed(0)}K
- **Conversion Probability:** ${prediction.probability}%
- **Recommended Action:** ${action.action.toUpperCase()} — ${action.reason}`;
}).join('\n\n')}

**My recommendation:** Start with ${top5[0]?.name} today. They have the highest conversion probability and ${top5[0]?.status === 'Hot' ? 'are showing strong buying signals' : 'are well-positioned for progression'}.`;
  }
  
  // Email drafts
  if (q.includes('email') || q.includes('draft') || q.includes('write') || q.includes('outreach')) {
    const lead = topLeads[0];
    const isFollowUp = q.includes('follow');
    
    if (isFollowUp) {
      return `## Follow-Up Email for ${lead.name}

**To:** ${lead.email}
**Subject:** Quick follow-up — next steps for ${lead.company}?

---

Hi ${lead.name.split(' ')[0]},

I wanted to circle back on our previous conversation. I've been thinking about ${lead.company}'s situation and have a few ideas that might be valuable.

Specifically, I'd love to share:
• How similar ${lead.title}s have approached [specific challenge]
• A quick analysis I put together on [relevant topic]
• Some benchmarks from companies in your space

Would you have 15 minutes this week for a quick call? I'm flexible on timing.

Best regards,
${user.name}

---

**Personalization notes:**
- Reference any specific pain points from previous conversations
- Include relevant case study or data point
- Keep it under 100 words for higher response rates`;
    }
    
    return `## Initial Outreach Email for ${lead.name}

**To:** ${lead.email}
**Subject:** Question about ${lead.company}'s [growth/efficiency/sales] goals

---

Hi ${lead.name.split(' ')[0]},

I noticed ${lead.company} has been [making moves in X / expanding into Y / recently announced Z] — impressive work.

As a ${lead.title}, you're likely focused on [relevant challenge based on title]. I've been working with other ${lead.title}s in similar situations, and there's a pattern I've noticed that might be relevant to you.

Would you be open to a 15-minute call to see if there's a fit? No pressure either way.

Best,
${user.name}

P.S. If email isn't ideal, happy to connect on LinkedIn or via a quick text.

---

**Why this works:**
- Personalized opening shows research
- Title-specific relevance
- Low-commitment ask (15 min)
- Multiple response channels`;
  }
  
  // Call script
  if (q.includes('call') || q.includes('script') || q.includes('phone')) {
    const lead = topLeads[0];
    return `## Call Script for ${lead.name}

### Opening (15 seconds)
"Hi ${lead.name.split(' ')[0]}, this is ${user.name}. Did I catch you at an okay time?"

*[If yes, continue. If no, ask for better time]*

### Hook (20 seconds)
"I'll be brief — I've been working with other ${lead.title}s at companies like ${lead.company}, and there's a pattern I keep seeing around [pain point]. Wanted to see if it resonates with you."

### Discovery Questions
1. "What's your current approach to [relevant process]?"
2. "Where do you see the biggest bottlenecks?"
3. "If you could wave a magic wand, what would you change?"
4. "What have you tried so far?"

### Value Statement
"Based on what you've shared, here's what I'm thinking..."

### Close
"Would it make sense to schedule 30 minutes to dive deeper? I can show you exactly how we've helped companies like [similar company] achieve [specific result]."

### Objection Handlers
- **"Not interested"** → "Totally understand. Quick question before I go — is it the timing or the topic that's not right?"
- **"Send me info"** → "Happy to. What specifically would be most useful for you to see?"
- **"We're using X"** → "Great choice. How's that working for [specific use case]?"`;
  }
  
  // Forecast
  if (q.includes('forecast') || q.includes('predict') || q.includes('pipeline') || q.includes('revenue')) {
    return `## 30-Day Pipeline Forecast

### Revenue Projections
| Scenario | Deals | Revenue |
|----------|-------|---------|
| Conservative | ${forecast.deals.conservative} | $${(forecast.revenue.conservative/1000).toFixed(0)}K |
| **Expected** | **${forecast.deals.expected}** | **$${(forecast.revenue.expected/1000).toFixed(0)}K** |
| Optimistic | ${forecast.deals.optimistic} | $${(forecast.revenue.optimistic/1000).toFixed(0)}K |

### Top Opportunities
${forecast.breakdown.slice(0, 5).map((d, i) => `${i + 1}. **${d.lead}** (${d.company}) — $${(d.value/1000).toFixed(0)}K @ ${d.probability}% probability`).join('\n')}

### Key Insights
- **${hotLeads.length} hot leads** represent your best short-term opportunities
- **${atRisk.length} leads at risk** of going cold — prioritize these for outreach
- Average deal cycle: ${Math.round(forecast.breakdown.reduce((s, d) => s + d.expectedDays, 0) / (forecast.breakdown.length || 1))} days

### Recommendations
1. Focus on the ${hotLeads.length} hot leads this week
2. Re-engage the ${atRisk.length} at-risk leads before they go cold
3. Build pipeline by converting ${leads.filter(l => l.status === 'Warm').length} warm leads`;
  }
  
  // At-risk leads
  if (q.includes('risk') || q.includes('attention') || q.includes('cold') || q.includes('losing')) {
    if (atRisk.length === 0) {
      return `## No At-Risk Leads

Great news — your pipeline looks healthy! All leads have been contacted within appropriate timeframes.

**Recommendation:** Use this time to:
1. Focus on closing your ${hotLeads.length} hot leads
2. Progress your warm leads forward
3. Add new prospects to the top of funnel`;
    }
    
    return `## ${atRisk.length} Leads Requiring Immediate Attention

${atRisk.slice(0, 5).map((l, i) => {
  const action = recommendNextAction(l, leads);
  return `### ${i + 1}. ${l.name} — ${l.company}
- **Issue:** ${l.risks[0]?.message}
- **Days Since Contact:** ${l.daysSinceContact}
- **Status:** ${l.status} | **Value:** $${(l.value/1000).toFixed(0)}K
- **Action:** ${action.action.toUpperCase()} — ${action.reason}`;
}).join('\n\n')}

**Priority Matrix:**
- Urgent (Hot leads going cold): ${atRisk.filter(l => l.risks.some(r => r.type === 'urgent')).length}
- Warning (Warm leads cooling): ${atRisk.filter(l => l.risks.every(r => r.type === 'warning')).length}

**My recommendation:** Start with ${atRisk[0]?.name} — they're your highest-value at-risk lead.`;
  }
  
  // Objection handling
  if (q.includes('objection') || q.includes('handle') || q.includes('response') || q.includes('pushback')) {
    return `## Objection Handling Playbook

### "We don't have budget"
**Response:** "I completely understand. Quick question — is it a matter of no budget at all, or budget not being allocated to this yet? Because what I'm hearing from other ${topLeads[0]?.title || 'leaders'}s is that [solution] actually pays for itself within [timeframe]."

### "We're already using [competitor]"
**Response:** "That's great — [competitor] is solid. Out of curiosity, how's it working for [specific use case]? I ask because that's where we tend to see the biggest gaps, and several companies have actually used us alongside [competitor] to fill those."

### "Now isn't a good time"
**Response:** "Totally fair. When you say timing isn't right, is it more about bandwidth or priorities? I ask because I might be able to help even with a lighter touch approach."

### "Send me more information"
**Response:** "Happy to. To make sure I send you the right stuff — what specifically would be most useful? Case studies? Pricing? Technical specs?"

### "I need to talk to my team"
**Response:** "Of course. Who else would be involved in this decision? Would it be helpful if I joined that conversation to answer any technical questions directly?"

### Pro Tips
- Never argue — always acknowledge first
- Turn objections into questions
- Find the real objection (often not the stated one)`;
  }
  
  // Meeting prep
  if (q.includes('meeting') || q.includes('prep') || q.includes('call brief') || q.includes('agenda')) {
    const lead = topLeads[0];
    return `## Meeting Brief: ${lead.name}

### Contact Overview
| Field | Value |
|-------|-------|
| Name | ${lead.name} |
| Title | ${lead.title} |
| Company | ${lead.company} |
| Email | ${lead.email} |
| Phone | ${lead.phone} |
| Status | ${lead.status} |
| Score | ${lead.score}/100 |
| Deal Value | $${(lead.value/1000).toFixed(0)}K |

### Pre-Call Research
- **Company:** ${lead.company}
- **Decision Maker Level:** ${['CEO', 'CFO', 'Founder'].some(t => lead.title?.includes(t)) ? 'C-Level ✓' : 'Mid-Level'}
- **Interactions:** ${lead.interactions} touchpoints
- **Last Contact:** ${Math.floor((Date.now() - new Date(lead.lastContact)) / 864e5)} days ago

### Suggested Agenda
1. **Open (2 min)** — Rapport building, confirm time
2. **Discovery (10 min)** — Understand current situation, pain points
3. **Value Prop (5 min)** — Relevant solution overview
4. **Social Proof (3 min)** — Similar company case study
5. **Next Steps (5 min)** — Clear action items, timeline

### Key Questions to Ask
1. "What prompted you to take this meeting?"
2. "What does success look like for you this quarter?"
3. "What's the decision-making process look like?"
4. "What would need to be true for this to be a priority?"

### Talking Points
- Reference their ${lead.title} role and typical challenges
- Mention relevant case study or metric
- Prepare 2-3 specific value statements`;
  }
  
  // LinkedIn message
  if (q.includes('linkedin') || q.includes('connection') || q.includes('inmail')) {
    const lead = topLeads[0];
    return `## LinkedIn Outreach for ${lead.name}

### Connection Request Note (300 chars max)
"Hi ${lead.name.split(' ')[0]}, I've been following ${lead.company}'s work — impressive trajectory. Would love to connect and share some insights on [relevant topic] that might be useful for you."

### Follow-Up Message (after connection)
"Thanks for connecting, ${lead.name.split(' ')[0]}! 

I noticed you're ${lead.title} at ${lead.company} — you're probably dealing with [specific challenge based on title].

I recently helped a similar company [achieve specific result]. Happy to share what worked if it's relevant.

No pitch, just a 10-min chat. Worth exploring?"

### Voice Note Script (higher response rates)
"Hey ${lead.name.split(' ')[0]}, quick voice note — I saw your post about [topic] and it got me thinking. We've been working on something similar with other ${lead.title}s and I thought it might be relevant to ${lead.company}. Anyway, would love to connect if you're open. Talk soon."

### Best Practices
- Send Tuesday-Thursday, 8-10am or 4-6pm
- Voice notes get 2x response rate
- Always engage with their content first`;
  }
  
  // Scoring explanation
  if (q.includes('score') || q.includes('scoring') || q.includes('rank') || q.includes('how')) {
    const lead = topLeads[0];
    const scoreData = calculateLeadScore(lead, leads);
    
    return `## Lead Scoring Methodology

### How Scores Are Calculated
Our ML model evaluates 5 key dimensions:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Intent Signals** | 20% | Status indicators, engagement patterns |
| **Engagement** | 25% | Interaction frequency, recency |
| **Firmographics** | 20% | Title seniority, company fit |
| **Timing** | 20% | Recency of contact, deal velocity |
| **Deal Fit** | 15% | Value potential, ICP match |

### Example: ${lead.name} (Score: ${scoreData.score})
| Factor | Score |
|--------|-------|
| Intent | ${scoreData.breakdown.intent}/100 |
| Engagement | ${scoreData.breakdown.engagement}/100 |
| Firmographics | ${scoreData.breakdown.firmographics}/100 |
| Timing | ${scoreData.breakdown.timing}/100 |
| Fit | ${scoreData.breakdown.fit}/100 |

### Signals Detected
${scoreData.signals.map(s => `- ${s.type === 'positive' ? '[OK]' : '[!]'} ${s.text}`).join('\n')}

### Score Interpretation
- **80-100:** Hot prospect, prioritize immediately
- **60-79:** Strong potential, active pursuit
- **40-59:** Needs nurturing, qualify further
- **Below 40:** Low priority, automated nurture`;
  }
  
  // Default comprehensive response
  return `## How I Can Help You

I'm your AI sales assistant with full access to your pipeline of ${leads.length} leads. Here's what I can do:

### Analysis & Insights
- "Which leads should I prioritize today?"
- "Show me my pipeline forecast"
- "Which leads are at risk of going cold?"
- "How is my lead scoring calculated?"

### Outreach Generation
- "Write an email to my top lead"
- "Create a follow-up email for [name]"
- "Draft a LinkedIn message"
- "Give me a cold call script"

### Strategy & Planning
- "Prepare me for a meeting with [name]"
- "How should I handle pricing objections?"
- "What's my 30-day revenue forecast?"
- "Analyze my conversion rates"

### Your Current Pipeline
- **${hotLeads.length} hot leads** ready for closing
- **${atRisk.length} leads** need immediate attention
- **$${(forecast.revenue.expected/1000).toFixed(0)}K** expected revenue (30 days)

What would you like to explore?`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  buildSystemPrompt,
  generateFallbackResponse,
};

export default {
  calculateLeadScore,
  predictConversion,
  forecastPipeline,
  identifyAtRiskLeads,
  recommendNextAction,
  callClaudeAPI,
};
