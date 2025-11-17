// services/audioRecordingService.ts
import { Audio } from 'expo-av';

export interface RecordingResult {
  uri: string;
  duration: number;
  success: boolean;
  error?: string;
}

export class AudioRecordingService {
  private static instance: AudioRecordingService;
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  public static getInstance(): AudioRecordingService {
    if (!AudioRecordingService.instance) {
      AudioRecordingService.instance = new AudioRecordingService();
    }
    return AudioRecordingService.instance;
  }

  /**
   * Request audio recording permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Start audio recording optimized for AssemblyAI
   */
  async startRecording(): Promise<boolean> {
    try {
      // Check permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode for optimal recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('🔊 Starting audio recording...');

      // Use HIGH_QUALITY for better speech recognition
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;

      console.log('✅ Recording started successfully');
      return true;

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop audio recording
   */
  async stopRecording(): Promise<RecordingResult> {
    try {
      if (!this.recording || !this.isRecording) {
        throw new Error('No active recording to stop');
      }

      console.log('⏹️ Stopping recording...');
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI() || '';

      this.isRecording = false;
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      console.log('✅ Recording stopped successfully, URI:', uri);

      return {
        uri,
        duration: 0, // You can implement duration tracking if needed
        success: true
      };

    } catch (error) {
      console.error('Failed to stop recording:', error);
      return {
        uri: '',
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.recording && this.isRecording) {
      await this.stopRecording();
    }
  }
}

// Export singleton instance
export const audioRecordingService = AudioRecordingService.getInstance();