import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/scoring/evaluate - Evaluate call performance
router.post('/evaluate', async (req, res) => {
  try {
    const { transcript, scenario, difficulty, persona } = req.body;

    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Valid transcript array is required' });
    }

    // Build conversation text for analysis
    const conversationText = transcript
      .map(entry => `${entry.speaker === 'user' ? 'Agent' : 'Prospect'}: ${entry.message}`)
      .join('\n');

    // Create evaluation prompt
    const evaluationPrompt = `You are an expert sales trainer evaluating a real estate cold call role-play session.

**Call Context:**
- Scenario: ${scenario || 'Cold call'}
- Difficulty Level: ${difficulty || 'Medium'}
- Prospect Persona: ${persona || 'Unknown'}

**Conversation Transcript:**
${conversationText}

**Evaluation Criteria:**
Please evaluate this call on a scale of 0-100, where:
- 50 = Average performance (basic conversation, some mistakes)
- 70 = Good performance (solid technique, good rapport)
- 90 = Great performance (excellent technique, strong rapport, effective)
- 95 = Excellent performance (masterful, natural flow, achieved objectives)
- 100 = Perfect performance (flawless execution, exceptional rapport, ideal outcome)

Evaluate based on:
1. **Opening & Rapport Building** (0-20 points) - Did they establish trust and connection?
2. **Value Proposition** (0-20 points) - Did they clearly communicate their value?
3. **Handling Objections** (0-20 points) - How well did they respond to concerns?
4. **Question Quality** (0-20 points) - Did they ask effective, open-ended questions?
5. **Closing & Next Steps** (0-20 points) - Did they secure a clear next action?

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "grade": "<letter grade A+ to F>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "breakdown": {
    "opening": <0-20>,
    "value": <0-20>,
    "objections": <0-20>,
    "questions": <0-20>,
    "closing": <0-20>
  },
  "summary": "<2-3 sentence overall assessment>"
}`;

    console.log('🎯 Evaluating call performance...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate sales trainer. Provide honest, constructive feedback to help agents improve. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: evaluationPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0].message.content;
    const evaluation = JSON.parse(result);

    console.log('✅ Call evaluated:', evaluation.score, 'points');

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error('❌ Error evaluating call:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate call',
      details: error.message 
    });
  }
});

export default router;

