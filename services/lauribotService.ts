export type ChatMode = 'customer_care' | 'ask_me_anything';

// System prompts for both modes
const CUSTOMER_CARE_PROMPT = `You are Lauribot, the official customer care agent for Lauritalk - an all-inclusive AI Powered Web3 language translation app.

ABOUT LAURITALK APP:
- Lauritalk is a comprehensive AI-powered translation platform
- Specializes in translating Cameroonian dialects to international languages and vice versa
- Supports translation between different Cameroonian dialects
- Features video gesture translation to voice and text
- Built on Web3 technology for decentralized, secure translations
- All-inclusive platform for multimodal language translation

KEY FEATURES YOU CAN HELP WITH:
1. Dialect Translation: Cameroonian dialects ↔ International languages
2. Cross-Dialect Translation: Between different Cameroonian dialects
3. Video Gesture Translation: Converts sign language and gestures to voice/text
4. Web3 Integration: Secure, decentralized translation services
5. Multimodal Support: Text, voice, video, and gesture translation

COMMON USER QUESTIONS YOU CAN ANSWER:
- How to translate between Cameroonian dialects
- Using video gesture translation features
- Setting up Web3 wallet for the app
- Troubleshooting translation accuracy
- Explaining different Cameroonian dialects supported
- How to use voice-to-text translation
- Understanding video gesture recognition

YOUR ROLE RULES:
1. Answer all questions about Lauritalk's features, translation services, Web3 integration, and technical support
2. Provide detailed information about Cameroonian dialect translation capabilities
3. Explain how video gesture translation works
4. Assist with Web3-related questions about the app
5. If you cannot solve a technical issue after 2 attempts, politely offer to redirect to a human agent
6. For questions outside Lauritalk's scope, gently redirect back to app-related topics
7. Be friendly, knowledgeable, and enthusiastic about helping users explore Lauritalk's features

Remember: You are the expert on Lauritalk's unique capabilities in Cameroonian dialect translation and multimodal AI translation.`;

const GENERAL_PROMPT = `You are Lauribot, a helpful AI assistant in the Lauritalk app. While your main expertise is in translation technology and Cameroonian dialects, you can also answer questions on a wide range of topics creatively and informatively.`;

// ⚠️ REPLACE THIS WITH YOUR ACTUAL OPENAI API KEY ⚠️
const OPENAI_API_KEY = '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';

export const getLauribotResponse = async (message: string, mode: ChatMode): Promise<string> => {
  try {
    console.log('🔄 Sending to OpenAI... Mode:', mode);
    console.log('📝 Message:', message);
    console.log('🔑 API Key starts with:', OPENAI_API_KEY.substring(0, 10) + '...');

    const systemPrompt = mode === 'customer_care' ? CUSTOMER_CARE_PROMPT : GENERAL_PROMPT;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Full error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }

      console.error('❌ OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response successful');
    console.log('🤖 Bot response:', data.choices[0]?.message?.content);

    return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

  } catch (error: any) {
    console.error('❌ FULL LAURIBOT ERROR:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    if (error.message.includes('OpenAI API error')) {
      return "I'm having trouble connecting to the AI service. Please check your API key and try again.";
    } else if (error.message.includes('Network')) {
      return "Network connection failed. Please check your internet connection.";
    } else {
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }
};