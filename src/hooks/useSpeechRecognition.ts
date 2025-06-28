import { useState, useEffect, useRef, useCallback } from 'react';

interface TranscriptEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  speakerName: string;
  text: string;
  timestamp: string;
  confidence: number;
}

interface SpeechRecognitionHook {
  isRecording: boolean;
  transcript: TranscriptEntry[];
  startRecording: (speaker: 'doctor' | 'patient', speakerName: string) => void;
  stopRecording: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<'doctor' | 'patient'>('doctor');
  const [currentSpeakerName, setCurrentSpeakerName] = useState<string>('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        const newEntry: TranscriptEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          speaker: currentSpeaker,
          speakerName: currentSpeakerName,
          text: finalTranscript.trim(),
          timestamp: new Date().toISOString(),
          confidence: event.results[event.results.length - 1][0].confidence || 0.9
        };

        setTranscript(prev => [...prev, newEntry]);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, currentSpeaker, currentSpeakerName]);

  const startRecording = useCallback((speaker: 'doctor' | 'patient', speakerName: string) => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    setCurrentSpeaker(speaker);
    setCurrentSpeakerName(speakerName);
    setError(null);
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start recording');
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
    error
  };
};