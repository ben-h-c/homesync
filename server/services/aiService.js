let anthropic = null;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    const Anthropic = require('@anthropic-ai/sdk');
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
} catch {}

const MODEL = 'claude-haiku-4-5-20251001';

function isAvailable() {
  return !!anthropic;
}

/**
 * Generate marketing email copy from subdivision context.
 */
async function generateEmailCopy({ subdivisionName, homeCount, yearBuilt, serviceType, urgencyScore, tone, contractorName, companyName }) {
  if (!anthropic) return fallbackEmailCopy({ subdivisionName, serviceType, contractorName, companyName });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a marketing copywriter for home service contractors. Write professional, friendly outreach emails that contractors send to homeowners in specific neighborhoods. Keep emails concise (150-200 words). Use data to make the pitch specific and compelling. Output JSON with "subject" and "body_html" fields. The body_html should use simple HTML tags (p, strong, ul, li) but no inline styles.`,
    messages: [{
      role: 'user',
      content: `Write a ${tone || 'professional'} marketing email for a ${serviceType} contractor.

Context:
- Contractor: ${contractorName} at ${companyName}
- Target neighborhood: ${subdivisionName}
- Homes in area: ${homeCount || 'many'}
- Homes built around: ${yearBuilt || 'unknown'}
- Maintenance urgency score: ${urgencyScore || 'moderate'}/100

The email should highlight why homes of this age may need ${serviceType} service and offer a free inspection or competitive quote.`,
    }],
  });

  try {
    const text = response.content[0].text;
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { subject: `${serviceType} services for ${subdivisionName}`, body_html: `<p>${text}</p>` };
  } catch {
    return { subject: `${serviceType} services for ${subdivisionName}`, body_html: `<p>${response.content[0].text}</p>` };
  }
}

/**
 * Generate a quarterly marketing plan from business context.
 */
async function generateMarketingPlan({ services, areas, budget, goals, hotSubdivisions }) {
  if (!anthropic) return null; // caller should fall back to hardcoded plan

  const subContext = (hotSubdivisions || []).slice(0, 8).map(s =>
    `${s.name} (${s.total_homes} homes, urgency ${s.maintenance_urgency_score}/100, ZIP ${s.zip})`
  ).join('\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are a marketing strategist for home service contractors. Create actionable quarterly marketing plans. Output valid JSON with this structure:
{
  "summary": "one paragraph overview",
  "email_frequency": "recommendation",
  "best_send_times": "recommendation",
  "quarters": [
    {
      "quarter": "Q1 (Jan-Mar)",
      "focus": "short description",
      "actions": [
        { "type": "campaign|outreach|content|referral", "description": "specific action", "priority": "high|medium|low" }
      ],
      "target_subdivisions": ["name1", "name2"]
    }
  ]
}`,
    messages: [{
      role: 'user',
      content: `Create a quarterly marketing plan for a contractor.

Services offered: ${(services || []).join(', ') || 'general contracting'}
Target areas: ${(areas || []).join(', ') || 'local metro'}
Quarterly budget: ${budget || 'flexible'}
Business goal: ${goals || 'grow customer base'}

High-opportunity neighborhoods:
${subContext || 'No specific subdivision data available'}

Make each quarter's plan actionable with 3-4 specific steps.`,
    }],
  });

  try {
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch {
    return null;
  }
}

// ── Fallbacks when API is not configured ──

function fallbackEmailCopy({ subdivisionName, serviceType, contractorName, companyName }) {
  return {
    subject: `${subdivisionName} homes may need ${serviceType} service`,
    body_html: `<p>Hi there,</p>
<p>I'm ${contractorName || 'your local contractor'} with <strong>${companyName || 'our company'}</strong>, and I specialize in ${serviceType || 'home maintenance'} in your area.</p>
<p>Many homes in <strong>${subdivisionName || 'your neighborhood'}</strong> are reaching the age where ${serviceType || 'maintenance'} service becomes a smart investment.</p>
<p>I'd love to offer you a free inspection and competitive quote. Reply to this email or give me a call to get started.</p>
<p>Best regards,<br/>${contractorName || 'Your Contractor'}<br/>${companyName || ''}</p>`,
  };
}

module.exports = { isAvailable, generateEmailCopy, generateMarketingPlan };
