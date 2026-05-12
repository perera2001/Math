const Anthropic = require('@anthropic-ai/sdk');

const SUPPORTED_LANGUAGES = ['en', 'si', 'ta'];

const SYSTEM_PROMPT = `You are a Sri Lankan Grade 9 mathematics tutor.
Given a multiple-choice math question, the student's chosen answer (or skipped), and the correct answer,
produce a short, clear explanation.

Rules:
- Keep the explanation concise (80-140 words)
- Use step-by-step reasoning where useful
- Be encouraging, never insulting
- Focus on why the correct answer is correct and why the student's answer is incorrect (if applicable)
- If the student skipped, explain the correct method clearly
- Preserve math symbols exactly (pi, degrees, inequality signs, roots)
- Respond only in the requested language code: en, si, or ta
- Return plain text only`;

const pickModelId = () => {
  const configured = process.env.ANTHROPIC_MODEL;
  return configured ? `${configured}-20251001` : 'claude-haiku-4-5-20251001';
};

const explainAnswer = async ({
  language = 'en',
  questionText,
  options,
  userAnswerIndex,
  correctAnswerIndex,
}) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not configured for quiz-service');
    err.statusCode = 500;
    throw err;
  }

  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 30000,
  });

  const userAnswer =
    userAnswerIndex === null || userAnswerIndex === undefined
      ? 'Skipped'
      : options[userAnswerIndex] || 'Unknown';
  const correctAnswer = options[correctAnswerIndex] || 'Unknown';

  const promptPayload = {
    language: lang,
    questionText,
    options,
    userAnswerIndex,
    userAnswer,
    correctAnswerIndex,
    correctAnswer,
  };

  try {
    const response = await client.messages.create({
      model: pickModelId(),
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(promptPayload),
        },
      ],
    });

    const text = response?.content?.[0]?.text?.trim();
    if (!text) {
      const err = new Error('AI explanation failed');
      err.statusCode = 502;
      throw err;
    }

    return text;
  } catch (apiErr) {
    const err = new Error('AI explanation failed');
    err.statusCode = apiErr.statusCode || 502;
    throw err;
  }
};

module.exports = { explainAnswer };
