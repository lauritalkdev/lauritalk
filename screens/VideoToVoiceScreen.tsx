import { ResizeMode, Video } from 'expo-av';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SignLanguageType = 'ASL' | 'BSL' | 'ISL';

interface TranslationHistoryItem {
  id: string;
  timestamp: Date;
  originalLanguage: SignLanguageType;
  translatedText: string;
  videoUri?: string;
}

const { height: screenHeight } = Dimensions.get('window');

const VideoToVoiceScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SignLanguageType>('ASL');
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryItem[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.goldButton} onPress={requestPermission}>
          <Text style={styles.goldButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        console.log('Starting recording...');
        
        const video = await cameraRef.current.recordAsync();
        console.log('Video recorded successfully:', video);
        
        if (video && video.uri) {
          setRecordedVideo(video.uri);
          // Simulate translation based on selected language
          const demoTexts = {
            'ASL': 'Hello! How are you today?',
            'BSL': 'Good morning! How are you feeling?', 
            'ISL': 'Welcome! Nice to meet you!'
          };
          const newTranslation = demoTexts[selectedLanguage];
          setTranslatedText(newTranslation);
          
          // Add to history
          const historyItem: TranslationHistoryItem = {
            id: Date.now().toString(),
            timestamp: new Date(),
            originalLanguage: selectedLanguage,
            translatedText: newTranslation,
            videoUri: video.uri
          };
          setTranslationHistory(prev => [historyItem, ...prev.slice(0, 4)]); // Keep last 5 items
        }
      } catch (error) {
        console.error('Recording error:', error);
        // Simulate translation even if recording fails
        const demoTexts = {
          'ASL': 'Hello! How are you today?',
          'BSL': 'Good morning! How are you feeling?',
          'ISL': 'Welcome! Nice to meet you!'
        };
        const newTranslation = demoTexts[selectedLanguage];
        setTranslatedText(newTranslation);
        
        // Add to history even if recording failed
        const historyItem: TranslationHistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date(),
          originalLanguage: selectedLanguage,
          translatedText: newTranslation,
        };
        setTranslationHistory(prev => [historyItem, ...prev.slice(0, 4)]);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      console.log('Stopping recording...');
      cameraRef.current.stopRecording();
    }
  };

  const playVideo = async () => {
    if (videoRef.current && recordedVideo) {
      await videoRef.current.replayAsync();
    }
  };

  const speakText = (text?: string) => {
    const textToSpeak = text || translatedText;
    if (textToSpeak) {
      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        language: 'en',
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearHistory = () => {
    setTranslationHistory([]);
  };

  const languageButtons: { key: SignLanguageType; label: string }[] = [
    { key: 'ASL', label: 'ASL' },
    { key: 'BSL', label: 'BSL' },
    { key: 'ISL', label: 'ISL' },
  ];

  return (
    <View style={styles.container}>
      {/* Fixed Camera Section */}
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing={facing}
          ref={cameraRef}
        />
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recording]}
            onPress={toggleRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop' : 'Record'}
            </Text>
          </TouchableOpacity>
        </View>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Text style={styles.recordingText}>● Recording...</Text>
          </View>
        )}
      </View>

      {/* Scrollable Content Section */}
      <ScrollView 
        style={styles.contentArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Language Selection */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>Select Sign Language:</Text>
          <View style={styles.languageButtons}>
            {languageButtons.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageButton,
                  selectedLanguage === lang.key && styles.selectedLanguageButton
                ]}
                onPress={() => setSelectedLanguage(lang.key)}
              >
                <Text style={[
                  styles.languageButtonText,
                  selectedLanguage === lang.key && styles.selectedLanguageText
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Video Preview */}
        {recordedVideo && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Recorded Video:</Text>
            <Video
              ref={videoRef}
              source={{ uri: recordedVideo }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
            <TouchableOpacity style={styles.forestGreenButton} onPress={playVideo}>
              <Text style={styles.buttonText}>Play Video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Translation */}
        {translatedText ? (
          <View style={styles.translationSection}>
            <Text style={styles.sectionTitle}>Translated Text ({selectedLanguage}):</Text>
            <Text style={styles.translatedText}>{translatedText}</Text>
            
            <View style={styles.speechControls}>
              <TouchableOpacity 
                style={[styles.goldButton, isSpeaking && styles.speaking]}
                onPress={isSpeaking ? stopSpeaking : () => speakText()}
              >
                <Text style={styles.goldButtonText}>
                  {isSpeaking ? '🔊 Stop' : '🔈 Speak'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderText}>
              Record a sign language video to see the translation here
            </Text>
          </View>
        )}

        {/* Translation History */}
        {translationHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent Translations</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearHistoryText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {translationHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyLanguage}>{item.originalLanguage}</Text>
                  <Text style={styles.historyTime}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.historyText}>{item.translatedText}</Text>
                <TouchableOpacity 
                  style={styles.smallSpeakerButton}
                  onPress={() => speakText(item.translatedText)}
                >
                  <Text style={styles.smallSpeakerText}>🔈 Speak</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Extra padding at bottom for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  cameraContainer: {
    height: 250,
    position: 'relative',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 30,
  },
  permissionText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  languageSection: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  languageButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedLanguageButton: {
    backgroundColor: '#228B22',
    borderColor: '#FFD700',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  previewSection: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  translationSection: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  placeholderSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  historySection: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearHistoryText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  historyItem: {
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyLanguage: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyTime: {
    color: '#888888',
    fontSize: 11,
  },
  historyText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  smallSpeakerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smallSpeakerText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFD700',
  },
  placeholderText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  video: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  forestGreenButton: {
    backgroundColor: '#228B22',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  goldButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  goldButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  translatedText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 22,
  },
  speechControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  speaking: {
    backgroundColor: '#B8860B',
  },
  controls: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
  },
  recordButton: {
    backgroundColor: '#228B22',
    padding: 12,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFD700',
    minWidth: 80,
    alignItems: 'center',
  },
  recording: {
    backgroundColor: '#DC143C',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  recordingText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
});

export default VideoToVoiceScreen;