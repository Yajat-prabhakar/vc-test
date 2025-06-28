import { useState, useEffect, useRef, useCallback } from 'react';

interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  timestamp: string;
}

interface MedicineDictationHook {
  isRecording: boolean;
  medicines: Medicine[];
  isSharedWithPatient: boolean;
  startDictation: () => void;
  stopDictation: () => void;
  togglePatientVisibility: () => void;
  clearMedicines: () => void;
  removeMedicine: (id: string) => void;
  editMedicine: (id: string, updates: Partial<Medicine>) => void;
  isSupported: boolean;
  error: string | null;
}

export const useMedicineDictation = (): MedicineDictationHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isSharedWithPatient, setIsSharedWithPatient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure for better offline/local performance
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError(null);
      retryCountRef.current = 0;
      console.log('Medicine dictation started');
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          if (transcript) {
            console.log('Medicine dictation result:', transcript);
            parseMedicineFromTranscript(transcript);
          }
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Medicine dictation error:', event.error);
      
      // Handle different types of errors
      switch (event.error) {
        case 'network':
          // Don't retry on network errors, just use local processing
          setError('Using offline speech recognition. Please speak clearly.');
          setIsRecording(false);
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions and try again.');
          setIsRecording(false);
          break;
        case 'no-speech':
          setError('No speech detected. Please speak clearly and try again.');
          setIsRecording(false);
          break;
        case 'audio-capture':
          setError('Microphone not available. Please check your microphone and try again.');
          setIsRecording(false);
          break;
        case 'service-not-allowed':
          setError('Speech recognition service not available. Please try again later.');
          setIsRecording(false);
          break;
        default:
          setError(`Speech recognition error: ${event.error}. Please try again.`);
          setIsRecording(false);
      }
    };

    recognition.onend = () => {
      console.log('Medicine dictation ended');
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, isRecording]);

  const parseMedicineFromTranscript = (transcript: string) => {
    console.log('Parsing transcript:', transcript);
    
    // Enhanced parsing patterns with more specific regex
    const patterns = [
      // Pattern 1: "Prescribe [medicine] [dosage] [frequency] for [duration]"
      {
        regex: /(?:prescribe|give|take)\s+([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|g|milligrams?|milliliters?|grams?|tablets?|capsules?))\s+(once|twice|three times|four times|1|2|3|4)\s*(?:times?\s*)?(?:daily|a day|per day|in the morning|in the evening|morning|evening)?\s*(?:for\s+(\d+\s*(?:days?|weeks?|months?)))?/i,
        groups: { name: 1, dosage: 2, frequency: 3, duration: 4 }
      },
      // Pattern 2: "[Medicine] [dosage] [frequency] [duration]"
      {
        regex: /^([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|g|milligrams?|milliliters?|grams?|tablets?|capsules?))\s+(once|twice|three times|four times|1|2|3|4)\s*(?:times?\s*)?(?:daily|a day|per day|morning|evening)?\s*(?:for\s+(\d+\s*(?:days?|weeks?|months?)))?/i,
        groups: { name: 1, dosage: 2, frequency: 3, duration: 4 }
      },
      // Pattern 3: "[Medicine] [dosage] for [duration]"
      {
        regex: /^([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|g|milligrams?|milliliters?|grams?|tablets?|capsules?))\s+for\s+(\d+\s*(?:days?|weeks?|months?))/i,
        groups: { name: 1, dosage: 2, duration: 3 }
      },
      // Pattern 4: "[Medicine] [frequency] for [duration]"
      {
        regex: /^([a-zA-Z\s]+?)\s+(once|twice|three times|four times|1|2|3|4)\s*(?:times?\s*)?(?:daily|a day|per day|morning|evening)\s+for\s+(\d+\s*(?:days?|weeks?|months?))/i,
        groups: { name: 1, frequency: 2, duration: 3 }
      },
      // Pattern 5: "[Medicine] [dosage]"
      {
        regex: /^([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|g|milligrams?|milliliters?|grams?|tablets?|capsules?))/i,
        groups: { name: 1, dosage: 2 }
      },
      // Pattern 6: Just medicine name (3+ characters)
      {
        regex: /^([a-zA-Z\s]{3,})/i,
        groups: { name: 1 }
      }
    ];

    let parsed = false;
    
    for (const pattern of patterns) {
      const match = transcript.match(pattern.regex);
      if (match) {
        console.log('Pattern matched:', pattern, match);
        
        // Extract medicine name and clean it
        let medicineName = match[pattern.groups.name]?.trim() || '';
        
        // Clean up common parsing issues
        medicineName = medicineName
          .replace(/\b(for|one|morning|night|evening|daily|twice|once|three|four|times)\b.*$/i, '')
          .trim();
        
        // Skip if medicine name is too short or contains only numbers
        if (medicineName.length < 2 || /^\d+$/.test(medicineName)) {
          continue;
        }

        // Extract other components
        let dosage = match[pattern.groups.dosage]?.trim() || '';
        let frequency = match[pattern.groups.frequency]?.trim() || '';
        let duration = match[pattern.groups.duration]?.trim() || '';

        // Normalize frequency
        if (frequency) {
          frequency = frequency
            .replace(/^1$/, 'once')
            .replace(/^2$/, 'twice')
            .replace(/^3$/, 'three times')
            .replace(/^4$/, 'four times');
          
          if (!frequency.includes('daily') && !frequency.includes('morning') && !frequency.includes('evening')) {
            frequency += ' daily';
          }
        }

        const medicine: Medicine = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: medicineName,
          dosage: dosage,
          frequency: frequency,
          duration: duration,
          instructions: transcript, // Keep original for reference
          timestamp: new Date().toISOString()
        };

        setMedicines(prev => [...prev, medicine]);
        parsed = true;
        console.log('Medicine parsed and added:', medicine);
        break;
      }
    }

    // If no pattern matched, try to extract just the medicine name
    if (!parsed) {
      // Look for medicine names in common patterns
      const words = transcript.toLowerCase().split(/\s+/);
      const medicineKeywords = ['paracetamol', 'aspirin', 'ibuprofen', 'amoxicillin', 'azithromycin', 'metformin', 'omeprazole', 'atorvastatin', 'lisinopril', 'amlodipine'];
      
      let foundMedicine = '';
      for (const keyword of medicineKeywords) {
        if (transcript.toLowerCase().includes(keyword)) {
          foundMedicine = keyword;
          break;
        }
      }
      
      // If no known medicine found, take the first few words as medicine name
      if (!foundMedicine) {
        const firstWords = words.slice(0, 2).join(' ');
        if (firstWords.length > 2 && !/^\d+$/.test(firstWords)) {
          foundMedicine = firstWords;
        }
      }

      if (foundMedicine) {
        const medicine: Medicine = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: foundMedicine.charAt(0).toUpperCase() + foundMedicine.slice(1),
          dosage: '',
          frequency: '',
          duration: '',
          instructions: transcript,
          timestamp: new Date().toISOString()
        };
        setMedicines(prev => [...prev, medicine]);
        console.log('Medicine added as name only:', medicine);
      }
    }
  };

  const startDictation = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    setError(null);
    retryCountRef.current = 0;
    
    try {
      // Stop any existing recognition
      if (isRecording) {
        recognitionRef.current.stop();
      }
      
      // Start new recognition
      recognitionRef.current.start();
      setIsRecording(true);
      console.log('Starting medicine dictation...');
    } catch (err) {
      console.error('Error starting medicine dictation:', err);
      setError('Failed to start dictation. Please try again.');
    }
  }, [isSupported, isRecording]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      console.log('Stopping medicine dictation...');
    }
  }, [isRecording]);

  const togglePatientVisibility = useCallback(() => {
    setIsSharedWithPatient(prev => !prev);
  }, []);

  const clearMedicines = useCallback(() => {
    setMedicines([]);
    setIsSharedWithPatient(false);
  }, []);

  const removeMedicine = useCallback((id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
  }, []);

  const editMedicine = useCallback((id: string, updates: Partial<Medicine>) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, ...updates } : med
    ));
  }, []);

  return {
    isRecording,
    medicines,
    isSharedWithPatient,
    startDictation,
    stopDictation,
    togglePatientVisibility,
    clearMedicines,
    removeMedicine,
    editMedicine,
    isSupported,
    error
  };
};