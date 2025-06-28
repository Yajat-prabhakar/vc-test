import React, { useState, useEffect } from 'react';
import { Mic, MicOff, FileText, Download, Trash2, AlertCircle, Clock } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { usePrescriptionGenerator } from '../hooks/usePrescriptionGenerator';

interface ConversationRecorderProps {
  isCallActive: boolean;
  patientName: string;
  doctorName: string;
  userType: 'doctor' | 'patient';
}

const ConversationRecorder: React.FC<ConversationRecorderProps> = ({
  isCallActive,
  patientName,
  doctorName,
  userType
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'doctor' | 'patient'>(userType);

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
    error: speechError
  } = useSpeechRecognition();

  const {
    isGenerating,
    prescription,
    generatePrescription,
    clearPrescription,
    error: prescriptionError
  } = usePrescriptionGenerator();

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      const speakerName = currentSpeaker === 'doctor' ? doctorName : patientName;
      startRecording(currentSpeaker, speakerName);
    }
  };

  const handleGeneratePrescription = async () => {
    if (transcript.length === 0) return;
    await generatePrescription(transcript, patientName, doctorName);
    setShowPrescription(true);
  };

  const downloadTranscript = () => {
    const content = transcript.map(entry => 
      `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.speakerName} (${entry.speaker}): ${entry.text}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPrescription = () => {
    if (!prescription) return;
    
    const content = `
PRESCRIPTION SUMMARY
====================

Patient: ${prescription.patientName}
Doctor: ${prescription.doctorName}
Date: ${prescription.consultationDate}

SYMPTOMS:
${prescription.symptoms.map(s => `• ${s}`).join('\n')}

DIAGNOSIS:
${prescription.diagnosis}

RECOMMENDED TESTS:
${prescription.recommendedTests.map(t => `• ${t}`).join('\n')}

MEDICATIONS:
${prescription.medications.map(m => `• ${m.name} - ${m.dosage} - ${m.frequency} - ${m.duration}\n  Instructions: ${m.instructions}`).join('\n')}

ADDITIONAL NOTES:
${prescription.additionalNotes}

FOLLOW-UP INSTRUCTIONS:
${prescription.followUpInstructions}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription.patientName}-${prescription.consultationDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-sm text-red-700">
            Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Conversation Recording</h3>
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Speaking:</label>
            <select
              value={currentSpeaker}
              onChange={(e) => setCurrentSpeaker(e.target.value as 'doctor' | 'patient')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRecording}
            >
              <option value="doctor">Doctor ({doctorName})</option>
              <option value="patient">Patient ({patientName})</option>
            </select>
          </div>

          <button
            onClick={handleToggleRecording}
            disabled={!isCallActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        {/* Error Messages */}
        {(speechError || prescriptionError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-sm text-red-700">
                {speechError || prescriptionError}
              </p>
            </div>
          </div>
        )}

        {/* Transcript Summary */}
        {transcript.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {transcript.length} recorded segments
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                </button>
                <button
                  onClick={downloadTranscript}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="Download Transcript"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearTranscript}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Clear Transcript"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showTranscript && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg ${
                      entry.speaker === 'doctor'
                        ? 'bg-teal-50 border-l-4 border-teal-400'
                        : 'bg-blue-50 border-l-4 border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.speakerName} ({entry.speaker})
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{entry.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescription Generation */}
        {userType === 'doctor' && transcript.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-900">Prescription Summary</h4>
              <button
                onClick={handleGeneratePrescription}
                disabled={isGenerating || transcript.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                <FileText className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Generate Prescription'}
              </button>
            </div>

            {prescription && showPrescription && (
              <div className="bg-teal-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-teal-900">Generated Prescription</h5>
                  <button
                    onClick={downloadPrescription}
                    className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h6 className="font-medium text-gray-900 mb-2">Patient Information</h6>
                    <p><strong>Name:</strong> {prescription.patientName}</p>
                    <p><strong>Date:</strong> {prescription.consultationDate}</p>
                    <p><strong>Doctor:</strong> {prescription.doctorName}</p>
                  </div>

                  <div>
                    <h6 className="font-medium text-gray-900 mb-2">Symptoms</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {prescription.symptoms.map((symptom, index) => (
                        <li key={index} className="text-gray-700">{symptom}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-2">
                    <h6 className="font-medium text-gray-900 mb-2">Diagnosis</h6>
                    <p className="text-gray-700">{prescription.diagnosis}</p>
                  </div>

                  {prescription.recommendedTests.length > 0 && (
                    <div>
                      <h6 className="font-medium text-gray-900 mb-2">Recommended Tests</h6>
                      <ul className="list-disc list-inside space-y-1">
                        {prescription.recommendedTests.map((test, index) => (
                          <li key={index} className="text-gray-700">{test}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prescription.medications.length > 0 && (
                    <div>
                      <h6 className="font-medium text-gray-900 mb-2">Medications</h6>
                      <div className="space-y-2">
                        {prescription.medications.map((med, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            <p><strong>{med.name}</strong></p>
                            <p className="text-xs text-gray-600">{med.dosage} - {med.frequency} - {med.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prescription.additionalNotes && (
                    <div className="md:col-span-2">
                      <h6 className="font-medium text-gray-900 mb-2">Additional Notes</h6>
                      <p className="text-gray-700">{prescription.additionalNotes}</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <h6 className="font-medium text-gray-900 mb-2">Follow-up Instructions</h6>
                    <p className="text-gray-700">{prescription.followUpInstructions}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationRecorder;