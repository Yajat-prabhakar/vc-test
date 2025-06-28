import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Send, Stethoscope, AlertCircle, FileText, Pill } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';
import ConversationRecorder from './ConversationRecorder';
import MedicineDictation from './MedicineDictation';
import Webcam from "react-webcam";
import { supabase } from '../supabase'; // adjust this path if needed

const DoctorPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(true);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showMedicineDictation, setShowMedicineDictation] = useState(false);
  const [dictatedMedicines, setDictatedMedicines] = useState<string[]>([]);

  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    mediaError,
    toggleVideo,
    toggleAudio,
    startCall,
    endCall,
    isCallActive
  } = useWebRTC(localVideoRef, remoteVideoRef);

  const {
    socket,
    messages,
    participants,
    isRoomReady,
    joinRoom,
    sendMessage,
    endConsultation
  } = useSocket();


  const generateRoomId = () => {
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    setRoomId(id);
  };

  const saveMedicineToSupabase = async () => {
    if (dictatedMedicines.length === 0) return;

    const { data, error } = await supabase.from('medicine_prescriptions').insert([
      {
        doctor_name: doctorName || 'Raunaq',
        patient_name: patientParticipant?.name || 'Patient',
        medicine: dictatedMedicines,
      },
    ]);

    if (error) {
      console.error('Supabase Error:', error.message);
    } else {
      console.log('Saved to Supabase:', data);
    }
  };


  const handleCreateRoom = () => {
    if (roomId.trim() && doctorName.trim()) {
      joinRoom(roomId, 'doctor', doctorName);
      setShowJoinForm(false);
      setIsConnected(true);
    }
  };

  const handleStartCall = () => {
    if (socket) {
      startCall(socket, roomId);
    }
  };

  const handleEndCall = () => {
    endCall();
    endConsultation(roomId);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(roomId, message, doctorName, 'doctor');
      setMessage('');
    }
  };

  const handleToggleMedicineDictation = () => {
    if (showMedicineDictation && dictatedMedicines.length > 0) {
      saveMedicineToSupabase();
    }
    setShowMedicineDictation(!showMedicineDictation);
  };


  const patientParticipant = participants.find(p => p.type === 'patient');

  if (showJoinForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-teal-100 p-4 rounded-full w-fit mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctor Portal</h1>
            <p className="text-gray-600">Create consultation room</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Dr. Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Room ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                  placeholder="Room ID will be generated"
                />
                <button
                  onClick={generateRoomId}
                  className="px-4 py-3 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium"
                >
                  Generate New
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this ID with your patient to join the consultation
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!roomId.trim() || !doctorName.trim()}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create Consultation Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Doctor Console</h1>
                <p className="opacity-90">Room ID: {roomId}</p>
              </div>
              <div className="flex items-center gap-4">
                {patientParticipant && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-sm">Patient: {patientParticipant.name}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="font-medium">{doctorName}</p>
                  <p className="text-sm opacity-90">Doctor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Media Error Alert */}
          {mediaError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{mediaError}</p>
                  <p className="text-xs text-red-600 mt-1">Please check your camera and microphone permissions.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex h-[calc(100vh-200px)]">
            {/* Video Area */}
            <div className="flex-1 relative bg-gray-900">
              {/* Remote Video (Patient) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: remoteStream ? 'block' : 'none' }}
              />
              
              {/* Local Video (Doctor) */}
              <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <Webcam
                  audio={false}
                  mirrored
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  You
                </div>
              </div>

              {/* Waiting State */}
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {patientParticipant ? 'Ready to Start Consultation' : 'Waiting for Patient'}
                    </h3>
                    <p className="text-gray-300">
                      {patientParticipant 
                        ? `Patient ${patientParticipant.name} is ready. Click "Start Consultation" to begin.`
                        : 'Patient will join shortly'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Sidebar */}
            {showChat && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Consultation Notes</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'doctor' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderType === 'doctor'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Add consultation notes..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Sidebar */}
            {showRecorder && (
              <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                <ConversationRecorder
                  isCallActive={isCallActive}
                  patientName={patientParticipant?.name || 'Patient'}
                  doctorName={doctorName}
                  userType="doctor"
                />
              </div>
            )}

            {/* Medicine Dictation Sidebar */}
            {showMedicineDictation && (
              <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                <MedicineDictation
                  userType="doctor"
                  isCallActive={isCallActive}
                  patientName={patientParticipant?.name || 'Patient'}
                  doctorName={doctorName}
                  onUpdateMedicines={setDictatedMedicines}
                />

              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-50 p-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoEnabled
                    ? 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioEnabled
                    ? 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {patientParticipant && !isCallActive ? (
                <button
                  onClick={handleStartCall}
                  className="bg-green-600 text-white px-8 py-4 rounded-full hover:bg-green-700 transition-colors font-medium"
                >
                  Start Consultation
                </button>
              ) : isCallActive ? (
                <button
                  onClick={handleEndCall}
                  className="bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors font-medium"
                >
                  <Phone className="w-6 h-6" />
                </button>
              ) : null}

              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-full transition-colors ${
                  showChat
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                }`}
              >
                <MessageCircle className="w-6 h-6" />
              </button>

              <button
                onClick={() => setShowRecorder(!showRecorder)}
                className={`p-4 rounded-full transition-colors ${
                  showRecorder
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                }`}
                title="Conversation Recording & Prescription"
              >
                <FileText className="w-6 h-6" />
              </button>

              <button
                onClick={handleToggleMedicineDictation}
                className={`p-4 rounded-full transition-colors ${
                  showMedicineDictation
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
                title="Medicine Prescription"
              >
                <Pill className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;