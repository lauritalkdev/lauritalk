import { supabase } from '../supabase';

export const checkWordLimit = async (userId: string, wordsToAdd: number) => {
  try {
    // This will call our database function
    const { data, error } = await supabase
      .rpc('check_word_limit', {
        user_uuid: userId,
        words_to_add: wordsToAdd
      });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Word limit check error:', error);
    return { can_proceed: false, reason: 'Error checking limit' };
  }
};

export const getDailyUsage = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('daily_word_count, account_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get usage error:', error);
    return null;
  }
};