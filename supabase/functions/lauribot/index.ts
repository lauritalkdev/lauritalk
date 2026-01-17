// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface LauribotRequest {
  message: string
  mode: 'customer_care' | 'ask_me_anything'
}

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, mode } = await req.json() as LauribotRequest

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    if (!message || !mode) {
      throw new Error('Message and mode are required')
    }

    const response = await getLauribotResponse(message, mode)

    return new Response(
      JSON.stringify({ response }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Lauribot error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getLauribotResponse(
  message: string, 
  mode: 'customer_care' | 'ask_me_anything'
): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    let systemPrompt = ''

    if (mode === 'customer_care') {
      systemPrompt = `You are Lauribot, a helpful and friendly customer support assistant for Lauritalk - a translation app.

Lauritalk Features:
- Text translation for 150+ languages
- Real-time chat translation (Premium feature)
- Voice-to-voice translation
- Voice-to-text translation
- Cameroonian dialect support (Bangwa, Bakweri, Bakossi, Bayangi, Kom, Ngemba, Mungaka, Bamileke, Duala, Bafut, Oroko)
- Connector referral program (10% direct commission + 2.5% volume sales bonus)

Pricing:
- Free tier: Limited translations
- Premium: $9.99/month, $49.99/6 months, $89.99/year

Registration & Account:
- Users can register via the mobile app or website (www.lauritalk.com)
- Chat translation feature requires visiting www.lauritalk.com/login to enable

Your role:
- Answer questions about Lauritalk features, pricing, and usage
- Help users troubleshoot issues
- Guide users through the app
- Be friendly, concise, and helpful
- If you cannot help with a technical issue, suggest contacting live support

Keep responses concise (2-3 sentences max unless more detail is needed).`
    } else {
      systemPrompt = `You are Lauribot, a knowledgeable and friendly AI assistant.

Your role:
- Answer questions on any topic
- Provide helpful information and explanations
- Be conversational and engaging
- Keep responses concise (2-4 sentences) unless more detail is requested
- Use simple language that's easy to understand

You can discuss any topic, but stay helpful and informative.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim()
    } else {
      throw new Error('No response received from OpenAI')
    }

  } catch (error: unknown) {
    const isAbortError = error instanceof Error && error.name === 'AbortError'
    if (isAbortError) {
      throw new Error('Request timeout - please try again')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}