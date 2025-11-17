// utils/saveTranslation.ts
import { supabase } from '../supabase';

export interface TranslationData {
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  translation_type: 'text' | 'voice' | 'video';
}

export const saveTranslation = async (translationData: TranslationData): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not logged in, skipping translation save');
      return false;
    }

    const { error } = await supabase
      .from('user_translations')
      .insert([
        {
          user_id: user.id,
          ...translationData
        }
      ]);

    if (error) {
      console.error('Error saving translation to database:', error);
      return false;
    }

    console.log('Translation saved successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error saving translation:', error);
    return false;
  }
};