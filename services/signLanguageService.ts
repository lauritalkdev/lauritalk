// services/signLanguageService.ts

export interface MediaPipeResponse {
  text: string;
  confidence: number;
  landmarks: Array<{x: number, y: number, z: number}>;
  processingTime: number;
  gestures: string[];
  sessionId: string;
  language: 'ASL' | 'BSL' | 'ISL'; // Add this missing property
}

export interface VideoAnalysisRequest {
  videoUri: string;
  language: 'ASL' | 'BSL' | 'ISL';
  userId?: string;
}

export interface AnalysisHistory {
  id: string;
  created_at: string;
  user_id: string;
  video_url: string;
  sign_language_type: string;
  detected_text: string;
  confidence_score: number;
  detected_gestures: string[];
  processing_time: number;
}

class SignLanguageService {
  // Remove the constructor and direct Supabase initialization
  // We'll pass supabase as a parameter or use a different approach

  async analyzeSignLanguageVideo(
    request: VideoAnalysisRequest, 
    supabase?: any // Make Supabase optional for now
  ): Promise<MediaPipeResponse> {
    try {
      // For now, use simulation. We'll add real Supabase integration later
      return await this.simulateMediaPipeAnalysis(request);
      
      // Uncomment this when you're ready to integrate with real Supabase
      // if (supabase && !__DEV__) {
      //   return await this.realSupabaseAnalysis(request, supabase);
      // } else {
      //   return await this.simulateMediaPipeAnalysis(request);
      // }
    } catch (error) {
      console.error('Sign language analysis error:', error);
      throw new Error('Failed to analyze sign language video');
    }
  }

  private async realSupabaseAnalysis(
    request: VideoAnalysisRequest, 
    supabase: any
  ): Promise<MediaPipeResponse> {
    try {
      // 1. Upload video to Supabase Storage
      const videoUrl = await this.uploadVideoToSupabase(request.videoUri, supabase);
      
      // 2. Call your Supabase Edge Function for MediaPipe processing
      const { data, error } = await supabase.functions.invoke('analyze-sign-language', {
        body: {
          videoUrl,
          language: request.language,
          userId: request.userId
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // 3. Save analysis to history table
      if (request.userId) {
        await this.saveAnalysisToHistory(data, request.userId, supabase);
      }

      return data;
    } catch (error) {
      console.error('Supabase analysis error:', error);
      throw error;
    }
  }

  private async uploadVideoToSupabase(videoUri: string, supabase: any): Promise<string> {
    try {
      // Convert video to blob
      const videoBlob = await this.uriToBlob(videoUri);
      
      // Generate unique filename
      const fileName = `sign-language-${Date.now()}.mp4`;
      const filePath = `videos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('sign-language-videos')
        .upload(filePath, videoBlob);

      if (error) {
        throw new Error(`Video upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sign-language-videos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  private async saveAnalysisToHistory(
    analysis: MediaPipeResponse, 
    userId: string, 
    supabase: any
  ) {
    try {
      const { data, error } = await supabase
        .from('sign_language_analysis')
        .insert({
          user_id: userId,
          video_url: analysis.sessionId,
          sign_language_type: analysis.language, // Now this should work
          detected_text: analysis.text,
          confidence_score: analysis.confidence,
          detected_gestures: analysis.gestures,
          processing_time: analysis.processingTime
        });

      if (error) {
        console.error('Failed to save analysis history:', error);
      }
    } catch (error) {
      console.error('History save error:', error);
    }
  }

  async getAnalysisHistory(userId: string, supabase: any): Promise<AnalysisHistory[]> {
    try {
      const { data, error } = await supabase
        .from('sign_language_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to fetch analysis history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('History fetch error:', error);
      return [];
    }
  }

  // Simulation for development (unchanged)
  private async simulateMediaPipeAnalysis(request: VideoAnalysisRequest): Promise<MediaPipeResponse> {
    await new Promise(resolve => setTimeout(resolve, 2500));

    const demoResponses = {
      'ASL': {
        text: 'Hello! How are you today?',
        confidence: 0.94,
        gestures: ['hello', 'how', 'you', 'today']
      },
      'BSL': {
        text: 'Good morning! How are you feeling?',
        confidence: 0.89,
        gestures: ['good', 'morning', 'how', 'feeling']
      },
      'ISL': {
        text: 'Welcome! Nice to meet you!',
        confidence: 0.87,
        gestures: ['welcome', 'nice', 'meet', 'you']
      }
    };

    const response = demoResponses[request.language];

    return {
      text: response.text,
      confidence: response.confidence,
      landmarks: Array(21).fill(0).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      })),
      processingTime: 2.3,
      gestures: response.gestures,
      sessionId: `session-${Date.now()}`,
      language: request.language // Add the language to response
    };
  }

  private async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
  }
}

export const signLanguageService = new SignLanguageService();