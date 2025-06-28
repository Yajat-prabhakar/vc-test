import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Send, Users, AlertCircle, FileText, Pill } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';
import ConversationRecorder from './ConversationRecorder';
import MedicineDictation from './MedicineDictation';
import Webcam from "react-webcam";

const PatientPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(true);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  
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

  const handleJoinRoom = () => {
    if (roomId.trim() && patientName.trim()) {
      joinRoom(roomId, 'patient', patientName);
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
      sendMessage(roomId, message, patientName, 'patient');
      setMessage('');
    }
  };

  const doctorParticipant = participants.find(p => p.type === 'doctor');

  if (showJoinForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Portal</h1>
            <p className="text-gray-600">Join your video consultation</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter room ID provided by doctor"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your doctor will provide you with the room ID
              </p>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!roomId.trim() || !patientName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Consultation
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Video Consultation</h1>
                <p className="opacity-90">Room ID: {roomId}</p>
              </div>
              <div className="flex items-center gap-4">
                {doctorParticipant && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-sm">Doctor: {doctorParticipant.name}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="font-medium">{patientName}</p>
                  <p className="text-sm opacity-90">Patient</p>
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
              {/* Remote Video (Doctor) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: remoteStream ? 'block' : 'none' }}
              />
              
              {/* Local Video (Patient) */}
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
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {doctorParticipant ? 'Ready to Start Call' : 'Waiting for Doctor'}
                    </h3>
                    <p className="text-gray-300">
                      {doctorParticipant 
                        ? `Doctor ${doctorParticipant.name} is available. Click "Start Call" to begin.`
                        : 'Please wait while we connect you with your doctor'
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
                  <h3 className="font-semibold text-gray-900">Consultation Chat</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderType === 'patient'
                            ? 'bg-blue-600 text-white'
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
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                  patientName={patientName}
                  doctorName={doctorParticipant?.name || 'Doctor'}
                  userType="patient"
                />
              </div>
            )}

            {/* Prescription Sidebar */}
            {showPrescription && (
              <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                <MedicineDictation
                  userType="patient"
                  isCallActive={isCallActive}
                  patientName={patientName}
                  doctorName={doctorParticipant?.name || 'Doctor'}
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
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioEnabled
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {doctorParticipant && !isCallActive ? (
                <button
                  onClick={handleStartCall}
                  className="bg-green-600 text-white px-8 py-4 rounded-full hover:bg-green-700 transition-colors font-medium"
                >
                  Start Call
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
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
                title="Conversation Recording"
              >
                <FileText className="w-6 h-6" />
              </button>

              <button
                onClick={() => setShowPrescription(!showPrescription)}
                className={`p-4 rounded-full transition-colors ${
                  showPrescription
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title="View Prescription"
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

export default PatientPage;