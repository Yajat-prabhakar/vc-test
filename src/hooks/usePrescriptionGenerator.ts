import { useState, useCallback } from 'react';

interface TranscriptEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  speakerName: string;
  text: string;
  timestamp: string;
  confidence: number;
}

interface PrescriptionData {
  patientName: string;
  doctorName: string;
  consultationDate: string;
  symptoms: string[];
  diagnosis: string;
  recommendedTests: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  additionalNotes: string;
  followUpInstructions: string;
}

interface PrescriptionGeneratorHook {
  isGenerating: boolean;
  prescription: PrescriptionData | null;
  generatePrescription: (transcript: TranscriptEntry[], patientName: string, doctorName: string) => Promise<void>;
  clearPrescription: () => void;
  error: string | null;
}

export const usePrescriptionGenerator = (): PrescriptionGeneratorHook => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePrescription = useCallback(async (
    transcript: TranscriptEntry[],
    patientName: string,
    doctorName: string
  ) => {
    if (transcript.length === 0) {
      setError('No conversation transcript available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Convert transcript to conversation format
      const conversation = transcript.map(entry => 
        `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.speakerName} (${entry.speaker}): ${entry.text}`
      ).join('\n');

      // Simulate AI processing with a more sophisticated analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract medical information using pattern matching and keywords
      const symptoms = extractSymptoms(transcript);
      const diagnosis = extractDiagnosis(transcript);
      const medications = extractMedications(transcript);
      const tests = extractRecommendedTests(transcript);
      const additionalNotes = extractAdditionalNotes(transcript);
      const followUpInstructions = extractFollowUpInstructions(transcript);

      const prescriptionData: PrescriptionData = {
        patientName,
        doctorName,
        consultationDate: new Date().toISOString().split('T')[0],
        symptoms,
        diagnosis,
        recommendedTests: tests,
        medications,
        additionalNotes,
        followUpInstructions
      };

      setPrescription(prescriptionData);
    } catch (err) {
      console.error('Error generating prescription:', err);
      setError('Failed to generate prescription. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearPrescription = useCallback(() => {
    setPrescription(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    prescription,
    generatePrescription,
    clearPrescription,
    error
  };
};

// Helper functions for extracting medical information
function extractSymptoms(transcript: TranscriptEntry[]): string[] {
  const symptoms: string[] = [];
  const symptomKeywords = [
    'pain', 'ache', 'hurt', 'fever', 'headache', 'nausea', 'vomiting', 'diarrhea',
    'constipation', 'fatigue', 'tired', 'dizzy', 'cough', 'cold', 'flu', 'sore throat',
    'runny nose', 'congestion', 'shortness of breath', 'chest pain', 'back pain',
    'stomach pain', 'abdominal pain', 'joint pain', 'muscle pain', 'rash', 'itching',
    'swelling', 'bloating', 'heartburn', 'indigestion', 'anxiety', 'depression',
    'insomnia', 'sleep problems', 'weight loss', 'weight gain', 'loss of appetite'
  ];

  transcript.forEach(entry => {
    if (entry.speaker === 'patient') {
      const text = entry.text.toLowerCase();
      symptomKeywords.forEach(keyword => {
        if (text.includes(keyword) && !symptoms.includes(keyword)) {
          symptoms.push(keyword);
        }
      });
    }
  });

  return symptoms;
}

function extractDiagnosis(transcript: TranscriptEntry[]): string {
  const diagnosisKeywords = [
    'diagnosis', 'diagnosed with', 'condition', 'disease', 'infection', 'syndrome',
    'disorder', 'illness', 'medical condition'
  ];

  for (const entry of transcript) {
    if (entry.speaker === 'doctor') {
      const text = entry.text.toLowerCase();
      for (const keyword of diagnosisKeywords) {
        if (text.includes(keyword)) {
          // Extract the sentence containing the diagnosis
          const sentences = entry.text.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(keyword)) {
              return sentence.trim();
            }
          }
        }
      }
    }
  }

  return 'Diagnosis to be determined based on further evaluation';
}

function extractMedications(transcript: TranscriptEntry[]): Array<{
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}> {
  const medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }> = [];

  const medicationKeywords = [
    'prescribe', 'medication', 'medicine', 'drug', 'tablet', 'capsule', 'syrup',
    'take', 'mg', 'ml', 'twice daily', 'once daily', 'three times', 'morning',
    'evening', 'before meals', 'after meals', 'with food', 'without food'
  ];

  transcript.forEach(entry => {
    if (entry.speaker === 'doctor') {
      const text = entry.text.toLowerCase();
      const hasmedication = medicationKeywords.some(keyword => text.includes(keyword));
      
      if (hasmedication) {
        // This is a simplified extraction - in a real implementation,
        // you'd use more sophisticated NLP or integrate with a medical API
        medications.push({
          name: 'Medication as discussed',
          dosage: 'As prescribed',
          frequency: 'As directed',
          duration: 'As specified',
          instructions: entry.text
        });
      }
    }
  });

  return medications;
}

function extractRecommendedTests(transcript: TranscriptEntry[]): string[] {
  const tests: string[] = [];
  const testKeywords = [
    'blood test', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'ecg', 'ekg',
    'urine test', 'stool test', 'biopsy', 'endoscopy', 'colonoscopy',
    'mammogram', 'pap smear', 'allergy test', 'glucose test', 'cholesterol test'
  ];

  transcript.forEach(entry => {
    if (entry.speaker === 'doctor') {
      const text = entry.text.toLowerCase();
      testKeywords.forEach(test => {
        if (text.includes(test) && !tests.includes(test)) {
          tests.push(test);
        }
      });
    }
  });

  return tests;
}

function extractAdditionalNotes(transcript: TranscriptEntry[]): string {
  const notes: string[] = [];
  const noteKeywords = [
    'important', 'note', 'remember', 'warning', 'caution', 'side effect',
    'monitor', 'watch for', 'contact me if', 'call if', 'emergency'
  ];

  transcript.forEach(entry => {
    if (entry.speaker === 'doctor') {
      const text = entry.text.toLowerCase();
      const hasNote = noteKeywords.some(keyword => text.includes(keyword));
      
      if (hasNote) {
        notes.push(entry.text);
      }
    }
  });

  return notes.join(' ');
}

function extractFollowUpInstructions(transcript: TranscriptEntry[]): string {
  const followUpKeywords = [
    'follow up', 'next appointment', 'see you', 'come back', 'return',
    'schedule', 'book appointment', 'check up', 'review'
  ];

  for (const entry of transcript) {
    if (entry.speaker === 'doctor') {
      const text = entry.text.toLowerCase();
      for (const keyword of followUpKeywords) {
        if (text.includes(keyword)) {
          return entry.text;
        }
      }
    }
  }

  return 'Follow up as needed or if symptoms persist';
}