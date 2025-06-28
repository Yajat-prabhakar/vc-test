import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Add a simple route handler for the root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'TeleHealth Connect Server Running',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const rooms = new Map();
const users = new Map();
const consultationRecords = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userType, userName }) => {
    socket.join(roomId);
    
    users.set(socket.id, { roomId, userType, userName });
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { 
        participants: [], 
        messages: [],
        status: 'waiting'
      });
    }
    
    const room = rooms.get(roomId);
    const existingParticipant = room.participants.find(p => p.type === userType);
    
    if (!existingParticipant) {
      room.participants.push({
        id: socket.id,
        type: userType,
        name: userName,
        connected: true
      });
    } else {
      existingParticipant.id = socket.id;
      existingParticipant.connected = true;
    }

    // Initialize consultation record
    if (!consultationRecords.has(roomId)) {
      consultationRecords.set(roomId, {
        roomId,
        participants: room.participants,
        startTime: new Date().toISOString(),
        transcript: [],
        prescription: null,
        status: 'active'
      });
    }

    // Notify room participants
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userType,
      userName,
      participants: room.participants
    });

    // Send current room state to the joining user
    socket.emit('room-joined', {
      roomId,
      participants: room.participants,
      messages: room.messages
    });

    // If both doctor and patient are present, update room status
    const hasDoctor = room.participants.some(p => p.type === 'doctor' && p.connected);
    const hasPatient = room.participants.some(p => p.type === 'patient' && p.connected);
    
    if (hasDoctor && hasPatient && room.status === 'waiting') {
      room.status = 'ready';
      io.to(roomId).emit('room-ready');
    }
  });

  socket.on('offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('send-message', ({ roomId, message, senderName, senderType }) => {
    const room = rooms.get(roomId);
    if (room) {
      const messageData = {
        id: Date.now().toString(),
        text: message,
        senderName,
        senderType,
        timestamp: new Date().toISOString()
      };
      
      room.messages.push(messageData);
      io.to(roomId).emit('new-message', messageData);
    }
  });

  // Handle conversation transcript storage
  socket.on('save-transcript', ({ roomId, transcript }) => {
    const consultationRecord = consultationRecords.get(roomId);
    if (consultationRecord) {
      consultationRecord.transcript = transcript;
      consultationRecord.lastUpdated = new Date().toISOString();
      console.log(`Transcript saved for room ${roomId}:`, transcript.length, 'entries');
    }
  });

  // Handle prescription storage
  socket.on('save-prescription', ({ roomId, prescription }) => {
    const consultationRecord = consultationRecords.get(roomId);
    if (consultationRecord) {
      consultationRecord.prescription = prescription;
      consultationRecord.lastUpdated = new Date().toISOString();
      console.log(`Prescription saved for room ${roomId}`);
    }
  });

  // Get consultation record
  socket.on('get-consultation-record', ({ roomId }, callback) => {
    const consultationRecord = consultationRecords.get(roomId);
    if (callback) {
      callback(consultationRecord || null);
    }
  });

  socket.on('call-ended', ({ roomId }) => {
    socket.to(roomId).emit('call-ended');
    const room = rooms.get(roomId);
    if (room) {
      room.status = 'ended';
    }

    // Update consultation record
    const consultationRecord = consultationRecords.get(roomId);
    if (consultationRecord) {
      consultationRecord.endTime = new Date().toISOString();
      consultationRecord.status = 'completed';
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const user = users.get(socket.id);
    if (user) {
      const room = rooms.get(user.roomId);
      if (room) {
        const participant = room.participants.find(p => p.id === socket.id);
        if (participant) {
          participant.connected = false;
        }
        
        socket.to(user.roomId).emit('user-left', {
          userId: socket.id,
          userType: user.userType,
          userName: user.userName
        });
      }
      users.delete(socket.id);
    }
  });
});

// API endpoint to get consultation records (for future integration)
app.get('/api/consultations/:roomId', (req, res) => {
  const { roomId } = req.params;
  const consultationRecord = consultationRecords.get(roomId);
  
  if (consultationRecord) {
    res.json(consultationRecord);
  } else {
    res.status(404).json({ error: 'Consultation record not found' });
  }
});

// API endpoint to get all consultation records (for admin/reporting)
app.get('/api/consultations', (req, res) => {
  const records = Array.from(consultationRecords.values());
  res.json(records);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TeleHealth Connect Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log('Features enabled:');
  console.log('- Video consultations');
  console.log('- Real-time chat');
  console.log('- Conversation recording');
  console.log('- Prescription generation');
});