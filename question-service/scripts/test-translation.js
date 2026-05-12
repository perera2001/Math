require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function test() {
  console.log('\n=== ENVIRONMENT CHECK ===');
  console.log('🔑 API Key loaded:', process.env.ANTHROPIC_API_KEY ? `✅ YES (${process.env.ANTHROPIC_API_KEY.substring(0,20)}...)` : '❌ NO');
  console.log('🤖 Model:', process.env.ANTHROPIC_MODEL || '❌ NOT SET');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ API key not loaded! Check .env file.');
    return;
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    console.log('\n=== CALLING ANTHROPIC API ===');
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: 'Translate "What is 2 + 2?" to Sinhala. Return ONLY the Sinhala translation, no other text.'
      }]
    });

    console.log('\n✅ SUCCESS!');
    console.log('Response:', response.content[0].text);
    console.log('Usage:', JSON.stringify(response.usage, null, 2));
  } catch (err) {
    console.error('\n❌ ERROR DETAILS:');
    console.error('Status:', err.status);
    console.error('Type:', err.error?.type || err.type);
    console.error('Message:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2).substring(0, 1000));
  }
}

test();