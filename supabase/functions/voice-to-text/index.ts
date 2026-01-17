// supabase/functions/voice-to-text/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface TranscriptionRequest {
  audioBase64: string
  language: string
}

interface TranslationRequest {
  text: string
  fromLanguage: string
  toLanguage: string
}

interface TTSRequest {
  text: string
  language: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const { action, ...payload } = await req.json()
    
    if (action === 'transcribe') {
      return await transcribeAudio(payload as TranscriptionRequest)
    } else if (action === 'translate') {
      return await translateText(payload as TranslationRequest)
    } else if (action === 'tts') {
      return await textToSpeech(payload as TTSRequest)
    } else {
      throw new Error('Invalid action')
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Voice-to-text error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function transcribeAudio(payload: TranscriptionRequest): Promise<Response> {
  try {
    const { audioBase64, language } = payload
    
    if (!audioBase64) {
      throw new Error('No audio data provided')
    }

    console.log(`Transcribing audio in ${language}, base64 length: ${audioBase64.length}`)

    // Decode base64 to binary
    const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    const audioBlob = new Blob([audioData], { type: 'audio/m4a' })

    // Create FormData for OpenAI
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.m4a')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'json')
    formData.append('language', language)

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Whisper API error:', errorText)
      throw new Error(`Whisper API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.text) {
      console.log('Transcription successful')
      return new Response(
        JSON.stringify({ text: data.text }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      throw new Error('No transcription received from Whisper')
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Transcription error:', errorMessage)
    throw new Error(`Transcription failed: ${errorMessage}`)
  }
}

async function translateText(payload: TranslationRequest): Promise<Response> {
  const { text, fromLanguage, toLanguage } = payload

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

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
            content: `You are a professional translator. Translate the following text from ${getLanguageName(fromLanguage)} to ${getLanguageName(toLanguage)}. Only return the translated text, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Translation API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return new Response(
        JSON.stringify({ translatedText: data.choices[0].message.content.trim() }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      throw new Error('No translation received from OpenAI')
    }

  } catch (error: unknown) {
    const isAbortError = error instanceof Error && error.name === 'AbortError'
    if (isAbortError) {
      throw new Error('Translation timeout')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function textToSpeech(payload: TTSRequest): Promise<Response> {
  try {
    const { text, language } = payload
    
    if (!text) {
      throw new Error('No text provided for TTS')
    }

    console.log(`Converting text to speech in ${language}`)

    // Map language codes to OpenAI TTS voices
    const voiceMap: { [key: string]: string } = {
      'en': 'alloy',
      'es': 'nova',
      'fr': 'shimmer',
      'de': 'echo',
      'it': 'fable',
      'pt': 'onyx',
      'zh-Hans': 'alloy',
      'zh-Hant': 'alloy',
      'ja': 'alloy',
      'ko': 'alloy',
    }

    const voice = voiceMap[language] || 'alloy'

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TTS API error:', errorText)
      throw new Error(`TTS API error: ${response.status}`)
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer()
    
    // Convert to base64
    const audioBase64 = btoa(
      new Uint8Array(audioBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    )

    console.log('TTS conversion successful')
    
    return new Response(
      JSON.stringify({ audioBase64: audioBase64 }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('TTS error:', errorMessage)
    throw new Error(`TTS failed: ${errorMessage}`)
  }
}

function getLanguageName(code: string): string {
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
  }
  
  return languageMap[code] || code.toUpperCase()
}