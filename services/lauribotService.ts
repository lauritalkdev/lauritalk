import { supabase } from '../supabase';

export type ChatMode = 'customer_care' | 'ask_me_anything';

// ==================== REMOVED OPENAI API KEY ====================
// OpenAI API key is now stored securely in Supabase Edge Function
// ==================== END CONFIGURATION ====================

/**
 * Get a response from Lauribot using the Supabase Edge Function
 * @param message - The user's message
 * @param mode - Either 'customer_care' or 'ask_me_anything'
 * @returns Promise<string> - The bot's response
 */
export const getLauribotResponse = async (message: string, mode: ChatMode): Promise<string> => {
  try {
    console.log('🔄 Sending to Lauribot Edge Function... Mode:', mode);
    console.log('📝 Message:', message);

    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔑 Session exists:', !!session);

    // Call the Supabase Edge Function with proper auth
    const response = await supabase.functions.invoke('lauribot', {
      body: {
        message,
        mode
      },
      headers: session ? {
        Authorization: `Bearer ${session.access_token}`
      } : {}
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response data:', response.data);
    console.log('📡 Response error:', response.error);

    // Handle Edge Function errors
    if (response.error) {
      console.error('❌ Edge Function error details:', response.error);
      throw new Error(`Edge Function error: ${response.error.message || 'Unknown error'}`);
    }

    // Check if we have valid response data
    if (!response.data) {
      console.error('❌ No data in response');
      throw new Error('No response data received from Lauribot');
    }

    // Check if the response contains an error field (from the Edge Function)
    if (response.data.error) {
      console.error('❌ Error from Edge Function:', response.data.error);
      throw new Error(`Lauribot error: ${response.data.error}`);
    }

    // Check if we have the actual bot response
    if (!response.data.response) {
      console.error('❌ No response field in data');
      throw new Error('No response text received from Lauribot');
    }

    console.log('✅ Lauribot Edge Function response successful');
    console.log('🤖 Bot response:', response.data.response);

    return response.data.response;

  } catch (error: any) {
    console.error('❌ FULL LAURIBOT ERROR:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Provide user-friendly error messages based on the error type
    if (error.message.includes('Edge Function error')) {
      return "I'm having trouble connecting to the AI service. Please check your connection and try again.";
    } else if (error.message.includes('Lauribot error')) {
      return "I'm experiencing technical difficulties processing your request. Please try again.";
    } else if (error.message.includes('Network') || error.message.includes('network')) {
      return "Network connection failed. Please check your internet connection and try again.";
    } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return "The request took too long. Please try again with a shorter message.";
    } else if (error.message.includes('No response')) {
      return "I didn't receive a response from the server. Please try again.";
    } else {
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }
};