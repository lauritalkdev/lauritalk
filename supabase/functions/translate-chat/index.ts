import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
}

interface BatchTranslationRequest {
  texts: string[]
  sourceLanguage: string
  targetLanguage: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { action, ...payload } = await req.json()

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    // Route to appropriate function
    if (action === 'translate') {
      return await translateSingle(payload as TranslationRequest)
    } else if (action === 'translateBatch') {
      return await translateBatch(payload as BatchTranslationRequest)
    } else {
      throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Translation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})

async function translateSingle(payload: TranslationRequest) {
  const { text, sourceLanguage, targetLanguage } = payload

  const sourceLangName = getLanguageName(sourceLanguage)
  const targetLangName = getLanguageName(targetLanguage)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
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
            content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Only return the translated text, no explanations, no additional text. If the text contains emojis or special characters, preserve them.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
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
      const translatedText = data.choices[0].message.content.trim()
      
      return new Response(
        JSON.stringify({ translatedText }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } else {
      throw new Error('No translation received from OpenAI')
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Translation timeout - request took too long')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function translateBatch(payload: BatchTranslationRequest) {
  const { texts, sourceLanguage, targetLanguage } = payload

  // For single text, use regular translation
  if (texts.length === 1) {
    const result = await translateSingle({
      text: texts[0],
      sourceLanguage,
      targetLanguage
    })
    const data = await result.json()
    return new Response(
      JSON.stringify({ translations: [data.translatedText] }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }

  const sourceLangName = getLanguageName(sourceLanguage)
  const targetLangName = getLanguageName(targetLanguage)

  // Combine texts with separators
  const combinedTexts = texts.map((text, index) => `[${index + 1}] ${text}`).join('\n\n')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
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
            content: `You are a professional translator. Translate the following messages from ${sourceLangName} to ${targetLangName}. 
            Each message is numbered like [1], [2], etc. 
            Return ONLY the translations in the same order and format: [1] translation1\n\n[2] translation2\n\n[3] translation3
            Do not add any explanations or additional text. Preserve emojis and special characters.`
          },
          {
            role: 'user',
            content: combinedTexts
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI batch API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedText = data.choices[0].message.content.trim()
      
      // Parse the response to extract individual translations
      const translations: string[] = []
      const lines = translatedText.split('\n\n')
      
      for (let i = 0; i < texts.length; i++) {
        const expectedPrefix = `[${i + 1}] `
        let foundTranslation = texts[i] // Default to original text
        
        for (const line of lines) {
          if (line.startsWith(expectedPrefix)) {
            foundTranslation = line.substring(expectedPrefix.length).trim()
            break
          }
        }
        
        translations.push(foundTranslation)
      }
      
      return new Response(
        JSON.stringify({ translations }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } else {
      throw new Error('No batch translation received from OpenAI')
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Batch translation timeout')
    }
    
    // Fallback to individual translations
    console.log('Batch failed, falling back to individual translations')
    const translations: string[] = []
    
    for (const text of texts) {
      try {
        const result = await translateSingle({ text, sourceLanguage, targetLanguage })
        const data = await result.json()
        translations.push(data.translatedText)
      } catch (error) {
        console.error('Individual translation failed:', error)
        translations.push(text) // Keep original on error
      }
    }
    
    return new Response(
      JSON.stringify({ translations }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

function getLanguageName(languageCode: string): string {
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh-Hans': 'Chinese (Simplified)',
    'zh-Hant': 'Chinese (Traditional)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'el': 'Greek',
    'he': 'Hebrew',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
    'ms': 'Malay',
    'fil': 'Filipino',
    'sw': 'Swahili',
    'af': 'Afrikaans',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'yo': 'Yoruba',
    'ig': 'Igbo',
    'ha': 'Hausa',
    'bga': 'Bangwa',
    'bkw': 'Bakweri',
    'bak': 'Bakossi',
    'byi': 'Bayangi',
    'kom': 'Kom',
    'nge': 'Ngemba',
    'mgk': 'Mungaka',
    'bam': 'Bamileke',
    'dua': 'Duala',
    'baf': 'Bafut',
    'oro': 'Oroko',
  }
  
  return languageMap[languageCode] || languageCode.toUpperCase()
}