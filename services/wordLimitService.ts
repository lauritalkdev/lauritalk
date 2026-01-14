// services/wordLimitService.ts - UPDATED VERSION
import { Alert } from 'react-native'; // Added import
import { supabase } from '../supabase';

export interface LimitStatus {
  is_premium: boolean;
  account_tier: string;
  current_daily_words: number;
  current_monthly_words: number;
  daily_word_limit: number;
  monthly_word_limit: number;
  remaining_daily_words: number;
  remaining_monthly_words: number;
}

export interface UpdateWordCountResult {
  success: boolean;
  daily_limit_exceeded?: boolean;
  monthly_limit_exceeded?: boolean;
  current_daily_words: number;
  current_monthly_words: number;
  remaining_daily_words: number;
  remaining_monthly_words: number;
  message?: string;
}

export interface WordCountInfo {
  count: number;
  textPreview: string;
}

class WordLimitService {
  private static instance: WordLimitService;

  public static getInstance(): WordLimitService {
    if (!WordLimitService.instance) {
      WordLimitService.instance = new WordLimitService();
    }
    return WordLimitService.instance;
  }

  /**
   * Calculate word count from text
   */
  calculateWordCount(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Simple word count - split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    console.log(`📊 Word count calculation: "${text.substring(0, 30)}..." -> ${words.length} words`);
    return words.length;
  }

  /**
   * Get word count info with preview
   */
  getWordCountInfo(text: string): WordCountInfo {
    const count = this.calculateWordCount(text);
    const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    return { count, textPreview: preview };
  }

  /**
   * Handle premium upgrade (placeholder for payment integration)
   */
  async upgradeToPremium(plan: 'monthly' | '6months' | 'yearly'): Promise<boolean> {
    console.log(`🔔 Premium upgrade requested: ${plan}`);
    
    // TODO: Implement actual premium upgrade logic
    // For now, we'll just show an alert
    console.log('✅ Premium upgrade logic would be implemented here');
    
    // Show an alert (this will work in both React Native and web)
    Alert.alert(
      'Upgrade to Premium',
      `You've selected the ${plan} plan. Payment integration would be implemented here.`,
      [{ text: 'OK' }]
    );
    
    return false; // Return false since we're not actually implementing payment yet
  }

  /**
   * Get current user's limit status
   */
  async getLimitStatus(): Promise<LimitStatus | null> {
    try {
      console.log('🔄 Getting limit status...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No user found');
        return null;
      }

      console.log(`👤 User ID: ${user.id}`);
      console.log(`📧 User email: ${user.email}`);

      // Call the PostgreSQL function
      const { data, error } = await supabase.rpc('get_user_limit_status', {
        p_user_id: user.id
      });

      if (error) {
        console.error('❌ Error getting limit status:', error);
        // Return default values on error
        return {
          is_premium: false,
          account_tier: 'freemium',
          current_daily_words: 0,
          current_monthly_words: 0,
          daily_word_limit: 200,
          monthly_word_limit: 1200,
          remaining_daily_words: 200,
          remaining_monthly_words: 1200
        };
      }

      console.log('✅ Limit status retrieved:', data);
      return data as LimitStatus;
    } catch (error) {
      console.error('❌ Error in getLimitStatus:', error);
      return null;
    }
  }

  /**
   * Update word count for current user
   */
  async updateWordCount(wordCount: number): Promise<UpdateWordCountResult> {
    try {
      console.log(`🔄 Updating word count: ${wordCount} words`);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No user found for word count update');
        return {
          success: false,
          current_daily_words: 0,
          current_monthly_words: 0,
          remaining_daily_words: 0,
          remaining_monthly_words: 0,
          message: 'No user found'
        };
      }

      console.log(`👤 User ID for update: ${user.id}`);

      // Call the PostgreSQL function
      const { data, error } = await supabase.rpc('update_word_count', {
        p_user_id: user.id,
        p_word_count: wordCount
      });

      if (error) {
        console.error('❌ Error updating word count:', error);
        return {
          success: false,
          current_daily_words: 0,
          current_monthly_words: 0,
          remaining_daily_words: 0,
          remaining_monthly_words: 0,
          message: error.message
        };
      }

      console.log('✅ Word count update result:', data);
      
      if (!data.success) {
        console.log(`🚫 Limit exceeded: ${data.message}`);
      }
      
      return data as UpdateWordCountResult;
    } catch (error) {
      console.error('❌ Error in updateWordCount:', error);
      return {
        success: false,
        current_daily_words: 0,
        current_monthly_words: 0,
        remaining_daily_words: 0,
        remaining_monthly_words: 0,
        message: 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if user can translate based on word count
   */
  async canTranslate(wordCount: number): Promise<{
    allowed: boolean;
    limitType?: 'daily' | 'monthly';
    result?: UpdateWordCountResult;
  }> {
    try {
      console.log(`🔍 Checking if user can translate ${wordCount} words...`);
      
      // First get current status
      const status = await this.getLimitStatus();
      
      if (!status) {
        console.log('⚠️ No status retrieved, allowing translation');
        return { allowed: true };
      }

      console.log(`📊 Current stats: Daily ${status.current_daily_words}/${status.daily_word_limit}, Monthly ${status.current_monthly_words}/${status.monthly_word_limit}`);

      // Check daily limit
      if (status.current_daily_words + wordCount > status.daily_word_limit) {
        console.log(`🚫 Daily limit would be exceeded: ${status.current_daily_words + wordCount} > ${status.daily_word_limit}`);
        return { 
          allowed: false, 
          limitType: 'daily',
          result: {
            success: false,
            daily_limit_exceeded: true,
            current_daily_words: status.current_daily_words,
            current_monthly_words: status.current_monthly_words,
            remaining_daily_words: status.remaining_daily_words,
            remaining_monthly_words: status.remaining_monthly_words,
            message: 'Daily limit exceeded'
          }
        };
      }

      // Check monthly limit
      if (status.current_monthly_words + wordCount > status.monthly_word_limit) {
        console.log(`🚫 Monthly limit would be exceeded: ${status.current_monthly_words + wordCount} > ${status.monthly_word_limit}`);
        return { 
          allowed: false, 
          limitType: 'monthly',
          result: {
            success: false,
            monthly_limit_exceeded: true,
            current_daily_words: status.current_daily_words,
            current_monthly_words: status.current_monthly_words,
            remaining_daily_words: status.remaining_daily_words,
            remaining_monthly_words: status.remaining_monthly_words,
            message: 'Monthly limit exceeded'
          }
        };
      }

      console.log('✅ Translation allowed, updating word count...');
      
      // If allowed, update the word count
      const updateResult = await this.updateWordCount(wordCount);
      
      if (!updateResult.success) {
        console.log('❌ Failed to update word count');
      }
      
      return { 
        allowed: updateResult.success, 
        result: updateResult 
      };
    } catch (error) {
      console.error('❌ Error in canTranslate:', error);
      return { allowed: true }; // Allow on error to not block users
    }
  }

  /**
   * Get current word count for debugging
   */
  async debugWordCounts() {
    const status = await this.getLimitStatus();
    if (status) {
      console.log('🔍 DEBUG Word Counts:');
      console.log(`   Daily: ${status.current_daily_words}/${status.daily_word_limit} (${status.remaining_daily_words} remaining)`);
      console.log(`   Monthly: ${status.current_monthly_words}/${status.monthly_word_limit} (${status.remaining_monthly_words} remaining)`);
      console.log(`   Premium: ${status.is_premium}`);
    } else {
      console.log('🔍 DEBUG: No word count status available');
    }
  }

  /**
   * Reset word counts for testing (use carefully!)
   */
  async resetWordCountsForTesting() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('word_limits')
        .update({
          current_daily_words: 0,
          current_monthly_words: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting word counts:', error);
        return false;
      }

      console.log('✅ Word counts reset for testing');
      return true;
    } catch (error) {
      console.error('Error in resetWordCountsForTesting:', error);
      return false;
    }
  }
}

export default WordLimitService.getInstance();