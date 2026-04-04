import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { activity, duration, weight, age, gender, height } = req.body;

  if (!activity || !duration) {
    return res.status(400).json({ error: 'activity and duration are required' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `You are a precise sports science calculator. Calculate calories burned for:
Activity: ${activity}
Duration: ${duration} minutes
User: ${weight ? weight + 'kg' : 'unknown weight'}, ${age ? age + ' years old' : 'unknown age'}, ${gender || 'unknown gender'}, ${height ? height + 'cm tall' : 'unknown height'}

Respond with ONLY valid JSON, no markdown:
{"calories": <integer>, "met": <float with 1 decimal>, "note": "<one concise sentence>"}`
        }
      ]
    });

    const text = message.content[0].text.trim();
    const parsed = JSON.parse(text);

    if (typeof parsed.calories !== 'number') throw new Error('Invalid response shape');

    return res.status(200).json({
      calories: Math.round(parsed.calories),
      met: parsed.met,
      note: parsed.note || null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Calculation failed', details: err.message });
  }
}
