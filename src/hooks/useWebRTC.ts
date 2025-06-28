import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export const useWebRTC = (
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef<string>('');

  // Initialize media on component mount
  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  // Set local video stream when available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Setting local video stream');
      localVideoRef.current.srcObject = localStream;
      
      // Force play the video
      localVideoRef.current.play().catch(error => {
        console.log('Auto-play prevented, user interaction required:', error);
      });
    }
  }, [localStream, localVideoRef]);

  // Set remote video stream when available
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('Setting remote video stream');
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force play the video
      remoteVideoRef.current.play().catch(error => {
        console.log('Auto-play prevented for remote video:', error);
      });
    }
  }, [remoteStream, remoteVideoRef]);

  const initializeMedia = async () => {
    try {
      console.log('Requesting media access...');
      setMediaError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Media stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks().length);
      console.log('Audio tracks:', stream.getAudioTracks().length);
      
      // Log track details
      stream.getVideoTracks().forEach((track, index) => {
        console.log(`Video track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
          settings: track.getSettings()
        });
      });
      
      setLocalStream(stream);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Try with basic constraints as fallback
      try {
        console.log('Trying with basic constraints...');
        const basicStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('Basic media stream obtained:', basicStream);
        setLocalStream(basicStream);
        setMediaError(null);
      } catch (basicError) {
        console.error('Error with basic media constraints:', basicError);
        setMediaError('Camera and microphone access denied. Please allow permissions and refresh the page.');
      }
    }
  };

  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && roomIdRef.current) {
        console.log('Sending ICE candidate');
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: roomIdRef.current
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const [stream] = event.streams;
      console.log('Remote stream received:', stream);
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsCallActive(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsCallActive(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  }, []);

  const startCall = async (socket: Socket, roomId: string) => {
    console.log('Starting call for room:', roomId);
    socketRef.current = socket;
    roomIdRef.current = roomId;
    
    // Create peer connection
    peerConnection.current = createPeerConnection();

    // Add local stream to peer connection
    if (localStream) {
      console.log('Adding local stream tracks to peer connection');
      localStream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, 'enabled:', track.enabled);
        if (peerConnection.current && localStream) {
          peerConnection.current.addTrack(track, localStream);
        }
      });
    } else {
      console.error('No local stream available for call');
      return;
    }

    // Set up socket event listeners
    socket.on('offer', async ({ offer, from }) => {
      console.log('Received offer from:', from);
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit('answer', { answer, roomId });
          console.log('Sent answer');
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    });

    socket.on('answer', async ({ answer, from }) => {
      console.log('Received answer from:', from);
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('Set remote description from answer');
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      console.log('Received ICE candidate from:', from);
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added ICE candidate');
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socket.on('call-ended', () => {
      console.log('Call ended by remote peer');
      endCall();
    });

    // Create and send offer
    try {
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId });
      console.log('Sent offer');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const endCall = useCallback(() => {
    console.log('Ending call');
    setIsCallActive(false);
    setRemoteStream(null);
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (socketRef.current) {
      socketRef.current.off('offer');
      socketRef.current.off('answer');
      socketRef.current.off('ice-candidate');
      socketRef.current.off('call-ended');
    }
  }, [remoteVideoRef]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('Video toggled:', videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() =>{
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('Audio toggled:', audioTrack.enabled);
      }
    }
  }, [localStream]);

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isCallActive,
    mediaError,
    toggleVideo,
    toggleAudio,
    startCall,
    endCall
  };
};