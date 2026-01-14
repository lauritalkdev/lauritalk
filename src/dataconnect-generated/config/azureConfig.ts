
// Your Azure Configuration
export const AZURE_CONFIG = {
  // Speech Service Configuration
  speech: {
    key: '1iJVny6UNXHhvqIaDHAy5HMaVJbXBHoRyT1V8rzjqCYSUh7VEzgeJQQJ99BJACYeBjFXJ3w3AAAYACOGU6cT',
    region: 'eastus',
    endpoint: 'https://eastus.api.cognitive.microsoft.com/',
    speechRecognitionEndpoint: 'https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1'
  },
  
  // Translator Service Configuration
  translator: {
    key: '1iJVny6UNXHhvqIaDHAy5HMaVJbXBHoRyT1V8rzjqCYSUh7VEzgeJQQJ99BJACYeBjFXJ3w3AAAYACOGU6cT',
    region: 'eastus',
    endpoint: 'https://api.cognitive.microsofttranslator.com/'
  }
};

// Language configuration
export const LANGUAGES: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'nl': 'Dutch',
  'pl': 'Polish',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'sw': 'Swahili'
};

// Check if Azure services are properly configured
export const isAzureConfigured = (): boolean => {
  return !!(AZURE_CONFIG.speech.key && 
           AZURE_CONFIG.speech.key.length > 10 &&
           AZURE_CONFIG.translator.key && 
           AZURE_CONFIG.translator.key.length > 10);
};