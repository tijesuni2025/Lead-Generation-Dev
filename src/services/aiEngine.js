/**
 * AI Lead Analysis Engine
 * Handles intent classification, lead data analysis, and intelligent response generation
 * 
 * @module services/aiEngine
 */

import { anthropicAPI, AI_MODELS, estimateTokens, APIError } from './api';

// =============================================================================
// CONFIGURATION
// =============================================================================

export const AI_CONFIG = {
  model: AI_MODELS.SONNET,
  maxTokens: 1500,
  maxRetries: 3,
  maxConversationHistory: 10,
  promptVersion: '2.1.0',
  contextTokenBudget: 4000, // Reserve tokens for context
};

// =============================================================================
// INTENT CLASSIFICATION SYSTEM
// =============================================================================

/**
 * Intent definitions with keywords and weights
 */
export const INTENTS = {
  LEAD_ANALYSIS: {
    id: 'LEAD_ANALYSIS',
    keywords: ['lead', 'leads', 'priorit', 'rank', 'best', 'top', 'which', 'who', 'analyze', 'analysis', 'hot'],
    weight: 1.0,
    description: 'Analyze and prioritize leads',
  },
  EMAIL_DRAFT: {
    id: 'EMAIL_DRAFT',
    keywords: ['email', 'draft', 'write', 'compose', 'outreach', 'message', 'template', 'cold', 'subject'],
    weight: 1.2,
    description: 'Draft email communications',
  },
  CALL_SCRIPT: {
    id: 'CALL_SCRIPT',
    keywords: ['call', 'script', 'phone', 'talk', 'say', 'pitch', 'conversation', 'speak', 'dial'],
    weight: 1.1,
    description: 'Create call scripts',
  },
  PIPELINE_FORECAST: {
    id: 'PIPELINE_FORECAST',
    keywords: ['forecast', 'predict', 'pipeline', 'revenue', 'projection', 'expect', 'quarter', 'month', 'close'],
    weight: 1.0,
    description: 'Forecast pipeline and revenue',
  },
  FOLLOW_UP: {
    id: 'FOLLOW_UP',
    keywords: ['follow', 'followup', 'stale', 'neglect', 'touch', 'contact', 'reach', 'reconnect', 'reminder'],
    weight: 1.1,
    description: 'Plan follow-up activities',
  },
  SCORING: {
    id: 'SCORING',
    keywords: ['score', 'scoring', 'quality', 'rating', 'evaluate', 'assess', 'qualification', 'qualify'],
    weight: 1.0,
    description: 'Explain lead scoring',
  },
  OBJECTION: {
    id: 'OBJECTION',
    keywords: ['objection', 'handle', 'overcome', 'reject', 'concern', 'hesitat', 'pushback', 'no', 'expensive'],
    weight: 1.1,
    description: 'Handle sales objections',
  },
  STRATEGY: {
    id: 'STRATEGY',
    keywords: ['strategy', 'approach', 'plan', 'tactic', 'improve', 'optimize', 'increase', 'grow', 'win'],
    weight: 0.9,
    description: 'Sales strategy advice',
  },
  SUMMARY: {
    id: 'SUMMARY',
    keywords: ['summary', 'overview', 'status', 'report', 'dashboard', 'snapshot', 'brief', 'today'],
    weight: 0.8,
    description: 'Pipeline summary',
  },
};

/**
 * Classify user intent from input text
 * @param {string} input - User's message
 * @returns {Object} Classified intent with confidence score
 */
export const classifyIntent = (input) => {
  const lowerInput = input.toLowerCase();
  const scores = {};
  
  // Calculate score for each intent
  Object.entries(INTENTS).forEach(([intentId, config]) => {
    const matchedKeywords = config.keywords.filter(kw => lowerInput.includes(kw));
    scores[intentId] = {
      score: matchedKeywords.length * config.weight,
      matchedKeywords,
      totalKeywords: config.keywords.length,
    };
  });
  
  // Sort by score and get best match
  const sortedIntents = Object.entries(scores)
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => b[1].score - a[1].score);
  
  if (sortedIntents.length === 0) {
    return {
      intent: INTENTS.SUMMARY,
      confidence: 0.3,
      alternates: [],
    };
  }
  
  const [topIntent, topData] = sortedIntents[0];
  const maxPossibleScore = INTENTS[topIntent].keywords.length * INTENTS[topIntent].weight;
  const confidence = Math.min(topData.score / maxPossibleScore, 1.0);
  
  return {
    intent: INTENTS[topIntent],
    confidence,
    matchedKeywords: topData.matchedKeywords,
    alternates: sortedIntents.slice(1, 3).map(([id, data]) => ({
      intent: INTENTS[id],
      score: data.score,
    })),
  };
};

// =============================================================================
// LEAD DATA ANALYZER
// =============================================================================

/**
 * Analyze lead data and compute insights
 * @param {Array} leads - Array of lead objects
 * @returns {Object} Computed analytics and segments
 */
export const analyzeLeadData = (leads) => {
  if (!leads || leads.length === 0) {
    return {
      counts: { total: 0, hot: 0, warm: 0, cold: 0, new: 0 },
      metrics: { avgScore: 0, totalValue: 0, avgValue: 0, conversionRate: 0 },
      segments: { highScore: [], highValue: [], lowEngagement: [], stale: [], recent: [] },
      sources: { stats: {}, best: null },
      predictions: { expectedRevenue: 0 },
      sorted: { byScore: [], byValue: [], byRecency: [] },
    };
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Status segmentation
  const hotLeads = leads.filter(l => l.status === 'Hot');
  const warmLeads = leads.filter(l => l.status === 'Warm');
  const coldLeads = leads.filter(l => l.status === 'Cold');
  const newLeads = leads.filter(l => l.status === 'New');
  
  // Metrics calculation
  const avgScore = Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) || 0;
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const avgValue = Math.round(totalValue / leads.length) || 0;
  
  // Advanced segmentation
  const highScoreLeads = leads.filter(l => l.score >= 80);
  const highValueLeads = leads.filter(l => l.value >= 100000);
  const lowEngagementHot = leads.filter(l => l.status === 'Hot' && l.interactions < 3);
  const staleLeads = leads.filter(l => (now - new Date(l.lastContact).getTime()) > 14 * dayMs);
  const recentLeads = leads.filter(l => (now - new Date(l.createdAt).getTime()) < 7 * dayMs);
  
  // Source analysis
  const sourceStats = leads.reduce((acc, l) => {
    if (!acc[l.source]) {
      acc[l.source] = { count: 0, totalValue: 0, totalScore: 0, leads: [] };
    }
    acc[l.source].count++;
    acc[l.source].totalValue += l.value;
    acc[l.source].totalScore += l.score;
    acc[l.source].leads.push(l);
    return acc;
  }, {});
  
  const sourceRankings = Object.entries(sourceStats)
    .map(([source, stats]) => ({
      source,
      ...stats,
      avgScore: Math.round(stats.totalScore / stats.count),
      avgValue: Math.round(stats.totalValue / stats.count),
    }))
    .sort((a, b) => b.count - a.count);
  
  const bestSource = sourceRankings[0] || null;
  
  // Conversion prediction (simplified model)
  const hotConversionRate = 0.30;
  const warmConversionRate = 0.15;
  const coldConversionRate = 0.05;
  
  const predictedRevenue = 
    hotLeads.reduce((sum, l) => sum + l.value, 0) * hotConversionRate +
    warmLeads.reduce((sum, l) => sum + l.value, 0) * warmConversionRate +
    coldLeads.reduce((sum, l) => sum + l.value, 0) * coldConversionRate;
  
  // Sorted views
  const byScore = [...leads].sort((a, b) => b.score - a.score);
  const byValue = [...leads].sort((a, b) => b.value - a.value);
  const byRecency = [...leads].sort((a, b) => new Date(b.lastContact) - new Date(a.lastContact));
  
  return {
    counts: {
      total: leads.length,
      hot: hotLeads.length,
      warm: warmLeads.length,
      cold: coldLeads.length,
      new: newLeads.length,
    },
    metrics: {
      avgScore,
      totalValue,
      avgValue,
      conversionRate: Math.round((hotLeads.length / leads.length) * 100),
    },
    segments: {
      highScore: highScoreLeads,
      highValue: highValueLeads,
      lowEngagement: lowEngagementHot,
      stale: staleLeads,
      recent: recentLeads,
    },
    sources: {
      stats: sourceStats,
      rankings: sourceRankings,
      best: bestSource,
    },
    predictions: {
      expectedRevenue: Math.round(predictedRevenue),
      hotRevenue: Math.round(hotLeads.reduce((s, l) => s + l.value, 0) * hotConversionRate),
      warmRevenue: Math.round(warmLeads.reduce((s, l) => s + l.value, 0) * warmConversionRate),
    },
    sorted: {
      byScore,
      byValue,
      byRecency,
    },
  };
};

// =============================================================================
// CONTEXT BUILDER
// =============================================================================

/**
 * Build optimized context string for AI
 * @param {Object} analysis - Lead analysis data
 * @param {Object} user - Current user
 * @param {number} tokenBudget - Maximum tokens for context
 * @returns {string} Formatted context string
 */
export const buildContext = (analysis, user, tokenBudget = AI_CONFIG.contextTokenBudget) => {
  const { counts, metrics, segments, sources, predictions, sorted } = analysis;
  
  // Core stats (always include)
  let context = `USER: ${user.name} at ${user.company}

PIPELINE SNAPSHOT:
• Total: ${counts.total} leads | Hot: ${counts.hot} | Warm: ${counts.warm} | Cold: ${counts.cold}
• Pipeline Value: $${(metrics.totalValue / 1000000).toFixed(2)}M
• Avg Score: ${metrics.avgScore}/100
• Predicted Revenue (30d): $${(predictions.expectedRevenue / 1000).toFixed(0)}K

`;

  // Add top leads (prioritized by score)
  const topLeads = sorted.byScore.slice(0, 8);
  context += `TOP LEADS BY SCORE:\n`;
  topLeads.forEach((l, i) => {
    context += `${i + 1}. ${l.name} | ${l.title} @ ${l.company} | Score: ${l.score} | $${l.value.toLocaleString()} | ${l.status}\n`;
  });

  // Add urgent items if within budget
  if (estimateTokens(context) < tokenBudget * 0.7) {
    const urgent = segments.lowEngagement.slice(0, 3);
    const stale = segments.stale.slice(0, 3);
    
    if (urgent.length > 0) {
      context += `\nURGENT (Hot, Low Engagement):\n`;
      urgent.forEach(l => {
        context += `• ${l.name} - Only ${l.interactions} touchpoints\n`;
      });
    }
    
    if (stale.length > 0) {
      context += `\nSTALE (14+ days no contact):\n`;
      stale.forEach(l => {
        const daysSince = Math.round((Date.now() - new Date(l.lastContact)) / (24 * 60 * 60 * 1000));
        context += `• ${l.name} - ${daysSince} days since contact\n`;
      });
    }
  }

  // Add source insights if within budget
  if (estimateTokens(context) < tokenBudget * 0.85 && sources.best) {
    context += `\nBEST SOURCE: ${sources.best.source} (${sources.best.count} leads, ${sources.best.avgScore} avg score)\n`;
  }

  return context;
};

// =============================================================================
// SYSTEM PROMPT BUILDER
// =============================================================================

/**
 * Build system prompt for AI
 * @param {string} context - Lead data context
 * @returns {string} System prompt
 */
export const buildSystemPrompt = (context) => {
  return `You are an elite AI Lead Analyst for Bluestarai LeadGen Pro. You help sales teams close more deals through data-driven insights.

CAPABILITIES:
• Lead analysis and prioritization
• Email and communication drafting
• Call scripts and talking points
• Pipeline forecasting
• Objection handling strategies
• Sales optimization tactics

${context}

RESPONSE GUIDELINES:
1. Be specific - reference actual lead names and data
2. Be actionable - provide concrete next steps
3. Be concise - respect the user's time
4. Use markdown for formatting (bold, bullets, headers)
5. When drafting communications, make them ready to use
6. Always tie insights back to revenue impact
7. If asked about a specific lead not in your data, acknowledge the limitation`;
};

// =============================================================================
// LOCAL RESPONSE TEMPLATES
// =============================================================================

/**
 * Generate local response for an intent
 * @param {string} intentId - Intent identifier
 * @param {Object} analysis - Lead analysis
 * @param {Object} user - Current user
 * @param {string} query - Original user query
 * @returns {string} Generated response
 */
export const generateLocalResponse = (intentId, analysis, user, query) => {
  const { counts, metrics, segments, sources, predictions, sorted } = analysis;
  const topLeads = sorted.byScore.slice(0, 5);
  const topByValue = sorted.byValue.slice(0, 3);
  
  const templates = {
    LEAD_ANALYSIS: () => {
      const urgent = segments.lowEngagement.slice(0, 3);
      return `## 🎯 Lead Analysis for ${user.company}

**Pipeline Overview:**
• Total Leads: ${counts.total} | Hot: ${counts.hot} | Warm: ${counts.warm}
• Average Score: ${metrics.avgScore}/100
• Pipeline Value: $${(metrics.totalValue / 1000000).toFixed(2)}M

**Top Priority Leads:**
${topLeads.map((l, i) => `${i + 1}. **${l.name}** - ${l.title} at ${l.company}
   Score: ${l.score}/100 | Value: $${l.value.toLocaleString()} | Status: ${l.status}`).join('\n')}

${urgent.length > 0 ? `**⚠️ Needs Immediate Attention:**
${urgent.map(l => `• ${l.name} - Only ${l.interactions} touchpoints (Hot lead)`).join('\n')}` : ''}

**Recommendation:** Start with ${topLeads[0]?.name || 'your top lead'} - highest conversion probability.`;
    },

    EMAIL_DRAFT: () => {
      const lead = topLeads[0] || { name: 'Contact', company: 'Company', title: 'Leader' };
      const firstName = lead.name?.split(' ')[0] || 'there';
      return `## ✉️ Email Draft for ${lead.name}

**Lead Profile:** ${lead.title} at ${lead.company} | Score: ${lead.score}/100

---

**Subject Options:**
1. Quick question about ${lead.company}'s growth
2. ${firstName}, idea for ${lead.company}
3. 15 min for a potential ${lead.value ? '$' + (lead.value/1000).toFixed(0) + 'K' : 'opportunity'}?

**Body:**

Hi ${firstName},

I've been following ${lead.company}'s work in [their industry/recent news], and I'm impressed by [specific observation].

Many ${lead.title}s I work with face [common challenge]. We've helped similar companies achieve [specific result].

Would you have 15 minutes this week to explore if there's a fit? I promise to keep it brief and valuable.

Best regards,
${user.name}
${user.company}

---

**Tips:** Send Tu-Th 9-11 AM • Follow up in 3 days • Personalize the [brackets]`;
    },

    CALL_SCRIPT: () => {
      const lead = topLeads[0] || { name: 'Contact', company: 'Company', title: 'Decision Maker' };
      return `## 📞 Call Script: ${lead.name}

**Pre-Call Intel:**
• ${lead.title} at ${lead.company}
• Score: ${lead.score}/100 | Value: $${lead.value?.toLocaleString() || 'TBD'}
• Previous interactions: ${lead.interactions || 0}

---

**Opening (10 sec):**
"Hi ${lead.name?.split(' ')[0]}, this is ${user.name} from ${user.company}. Did I catch you at an okay time?"

**Hook (20 sec):**
"I'm reaching out because we've helped companies like ${lead.company} with [relevant challenge], and I thought there might be value in connecting."

**Discovery Questions:**
1. "What's your current approach to [challenge area]?"
2. "Where do you see the biggest gaps?"
3. "What would success look like this quarter?"

**Value Statement:**
"Based on what you've shared, here's specifically how we help..."

**Close:**
"Would it make sense to schedule 30 minutes to dive deeper?"

---

**Objection Quick Hits:**
• "Not interested" → "What's your current solution?"
• "No budget" → "When does planning restart?"
• "Send info" → "What would be most valuable to see?"`;
    },

    PIPELINE_FORECAST: () => {
      const hotValue = sorted.byScore.filter(l => l.status === 'Hot').reduce((s, l) => s + l.value, 0);
      const warmValue = sorted.byScore.filter(l => l.status === 'Warm').reduce((s, l) => s + l.value, 0);
      return `## 📊 30-Day Pipeline Forecast

**Current Pipeline:**
| Stage | Leads | Value | Est. Close Rate |
|-------|-------|-------|-----------------|
| Hot | ${counts.hot} | $${(hotValue / 1000).toFixed(0)}K | 25-35% |
| Warm | ${counts.warm} | $${(warmValue / 1000).toFixed(0)}K | 10-20% |
| Cold | ${counts.cold} | - | 2-5% |

**Revenue Projections:**
• Conservative: $${(predictions.expectedRevenue * 0.7 / 1000).toFixed(0)}K
• Expected: **$${(predictions.expectedRevenue / 1000).toFixed(0)}K**
• Optimistic: $${(predictions.expectedRevenue * 1.4 / 1000).toFixed(0)}K

**Key Risks:**
${segments.stale.length > 0 ? `• ${segments.stale.length} stale leads may exit pipeline` : '• Pipeline health looks strong'}
${segments.lowEngagement.length > 0 ? `• ${segments.lowEngagement.length} hot leads need more engagement` : ''}

**Actions to Hit Target:**
1. Daily touchpoints on ${counts.hot} hot leads
2. Move ${Math.min(3, counts.warm)} warm leads to hot
3. Re-engage ${segments.stale.length} stale leads`;
    },

    FOLLOW_UP: () => {
      const stale = segments.stale.slice(0, 5);
      const lowEng = segments.lowEngagement.slice(0, 5);
      return `## 🔄 Follow-Up Strategy

**Stale Leads (14+ days):**
${stale.length > 0 ? stale.map(l => {
  const days = Math.round((Date.now() - new Date(l.lastContact)) / (24*60*60*1000));
  return `• **${l.name}** (${l.company}) - ${days} days ago
  → Action: "Checking in" email with fresh angle`;
}).join('\n') : '✅ No stale leads!'}

**Hot Leads Needing Attention:**
${lowEng.length > 0 ? lowEng.map(l => `• **${l.name}** - Score: ${l.score}, Only ${l.interactions} touchpoints
  → Action: Schedule call within 24h`).join('\n') : '✅ All hot leads engaged'}

**Re-engagement Template:**

Subject: ${stale[0]?.name?.split(' ')[0] || 'Quick'} - fresh thought for ${stale[0]?.company || 'you'}

Hi ${stale[0]?.name?.split(' ')[0] || 'there'},

Wanted to circle back - I have a new insight about [specific to them].

Worth a 10-minute call?

[Your signature]`;
    },

    SCORING: () => {
      return `## 📈 Lead Scoring Analysis

**Score Distribution:**
• Excellent (80-100): ${segments.highScore.length} leads (${Math.round(segments.highScore.length / counts.total * 100)}%)
• Good (60-79): ${sorted.byScore.filter(l => l.score >= 60 && l.score < 80).length} leads
• Fair (40-59): ${sorted.byScore.filter(l => l.score >= 40 && l.score < 60).length} leads
• Needs Work (<40): ${sorted.byScore.filter(l => l.score < 40).length} leads

**Top Scorers:**
${sorted.byScore.slice(0, 5).map((l, i) => `${i + 1}. **${l.name}** (${l.company}) - **${l.score}/100**
   ${l.status} | $${l.value.toLocaleString()} | ${l.source}`).join('\n')}

**Scoring Factors:**
Our AI considers engagement level, company fit, title seniority, source quality, and pipeline progression.

**Time Allocation:**
• 70% on scores 80+
• 25% on scores 60-79
• 5% on qualification of <60`;
    },

    OBJECTION: () => {
      return `## 🛡️ Objection Handling Playbook

**1. "It's too expensive"**
→ "I understand budget matters. What would the cost of *not* solving [pain] be over a year? Our clients typically see [X ROI]..."

**2. "We use [competitor]"**
→ "Great that you have a solution. Many clients came from [competitor]. What made you choose them? [Listen for gaps]"

**3. "Not a priority now"**
→ "I appreciate the honesty. Is it timing or fit? I want to respect your priorities."

**4. "Need to talk to my team"**
→ "Absolutely. Who else is involved? I'd join a call to answer questions directly."

**5. "Send me info"**
→ "Happy to. What specifically would be most valuable? [Then schedule follow-up]"

**6. "Tried something similar"**
→ "What happened? [Listen] Here's how we're different..."

**Pro Tip:** Every objection is asking "Why should I trust you?" Build rapport first.`;
    },

    STRATEGY: () => {
      return `## 🚀 30-Day Pipeline Strategy

**Week 1: Hot Lead Blitz**
• Goal: Convert ${Math.ceil(counts.hot * 0.3)} hot leads
• Action: Daily calls + personalized demos
• Focus: ${topLeads.slice(0, 3).map(l => l.name).join(', ')}

**Week 2: Warm Lead Acceleration**
• Goal: Move ${Math.ceil(counts.warm * 0.25)} warm → hot
• Action: Case studies + urgency messaging
• Focus: Leads scoring 70-79

**Week 3: Pipeline Building**
• Goal: Add ${Math.ceil(counts.total * 0.15)} new qualified leads
• Action: Referral asks + cold re-engagement

**Week 4: Optimization**
• Review wins/losses
• A/B test messaging
• Update scoring model

**Key Metrics:**
• Lead velocity (new/week)
• Stage conversion rates
• Average deal cycle

**Best Source:** ${sources.best?.source || 'N/A'} - consider doubling down`;
    },

    SUMMARY: () => {
      return `## 📋 Pipeline Summary

**Quick Stats:**
• 📊 Total: ${counts.total} leads
• 🔥 Hot: ${counts.hot} | ☀️ Warm: ${counts.warm} | ❄️ Cold: ${counts.cold}
• 💰 Value: $${(metrics.totalValue / 1000000).toFixed(2)}M
• 📈 Avg Score: ${metrics.avgScore}/100

**Today's Priorities:**
1. ${segments.lowEngagement[0] ? `Call ${segments.lowEngagement[0].name} (hot, needs engagement)` : `Follow up with ${topLeads[0]?.name}`}
2. ${segments.stale[0] ? `Re-engage ${segments.stale[0].name} (stale)` : 'All leads recently contacted ✓'}
3. Review ${topByValue[0]?.name}'s account ($${topByValue[0]?.value?.toLocaleString()} potential)

**Top Lead:** ${topLeads[0]?.name}
• ${topLeads[0]?.title} at ${topLeads[0]?.company}
• Score: ${topLeads[0]?.score}/100 | $${topLeads[0]?.value?.toLocaleString()}

**What can I help with?**
• "Draft an email for [lead]"
• "How do I handle price objections?"
• "Show me my pipeline forecast"`;
    },
  };

  const generator = templates[intentId] || templates.SUMMARY;
  return generator();
};

// =============================================================================
// AI SERVICE
// =============================================================================

/**
 * AI Service for chat completions
 */
export const aiService = {
  /**
   * Send a message and get AI response
   * @param {Object} params - Request parameters
   * @param {Array} params.messages - Conversation history
   * @param {Object} params.analysis - Lead analysis data
   * @param {Object} params.user - Current user
   * @returns {Promise<Object>} Response with content and metadata
   */
  chat: async ({ messages, analysis, user }) => {
    const context = buildContext(analysis, user);
    const systemPrompt = buildSystemPrompt(context);
    
    // Limit conversation history for token efficiency
    const recentMessages = messages.slice(-AI_CONFIG.maxConversationHistory);
    
    try {
      const response = await anthropicAPI.createMessage({
        model: AI_CONFIG.model,
        system: systemPrompt,
        messages: recentMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        maxTokens: AI_CONFIG.maxTokens,
      });

      return {
        content: response.content?.[0]?.text || null,
        usage: response.usage,
        model: response.model,
        mode: 'cloud',
      };
    } catch (error) {
      // Log error but don't throw - will fall back to local
      console.error('AI API Error:', error);
      
      return {
        content: null,
        error: error.message,
        mode: 'error',
      };
    }
  },

  /**
   * Get response with automatic fallback
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} Response with content and metadata
   */
  getResponse: async ({ messages, analysis, user, query }) => {
    // Try cloud API first
    const cloudResponse = await aiService.chat({ messages, analysis, user });
    
    if (cloudResponse.content) {
      return cloudResponse;
    }

    // Fallback to local engine
    const { intent, confidence } = classifyIntent(query);
    const localContent = generateLocalResponse(intent.id, analysis, user, query);
    
    return {
      content: localContent,
      mode: 'local',
      intent: intent.id,
      confidence,
    };
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default aiService;
