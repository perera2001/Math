const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are a professional translator specializing in Sri Lankan Grade 9 mathematics textbook content.
Translate the given math question and answers from English to both Sinhala (si) and Tamil (ta).

Rules:
- Use Sri Lankan Grade 9 math textbook terminology for Sinhala
- Preserve all math symbols exactly (π, °, cm², ², ³, ÷, ×, √, ∠, %, =, <, >, ≤, ≥, etc.)
- Keep ALL numbers as Arabic numerals (0-9) — do NOT use native Sinhala or Tamil numerals
- Return ONLY valid JSON — no markdown fences, no code blocks, no commentary, nothing else

Output format (strict JSON, no wrapping):
{
  "si": {
    "questionText": "...",
    "answers": ["...", "...", ...]
  },
  "ta": {
    "questionText": "...",
    "answers": ["...", "...", ...]
  }
}`;

const translateQuestion = async ({ questionText, answers }) => {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 30000,
  });

  const modelId = process.env.ANTHROPIC_MODEL
    ? `${process.env.ANTHROPIC_MODEL}-20251001`
    : 'claude-haiku-4-5-20251001';

  let raw;
  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ questionText, answers }),
        },
      ],
    });
    raw = response.content[0].text;
  } catch (apiErr) {
    const err = new Error('Translation failed');
    err.statusCode = 502;
    throw err;
  }

  // Strip markdown fences defensively
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error('Translation failed');
    err.statusCode = 502;
    throw err;
  }

  if (
    !parsed.si?.questionText ||
    !parsed.ta?.questionText ||
    !Array.isArray(parsed.si.answers) ||
    !Array.isArray(parsed.ta.answers) ||
    parsed.si.answers.length !== answers.length ||
    parsed.ta.answers.length !== answers.length
  ) {
    const err = new Error('Translation failed');
    err.statusCode = 502;
    throw err;
  }

  return {
    si: {
      questionText: parsed.si.questionText,
      answers: parsed.si.answers,
    },
    ta: {
      questionText: parsed.ta.questionText,
      answers: parsed.ta.answers,
    },
  };
};

module.exports = { translateQuestion };
