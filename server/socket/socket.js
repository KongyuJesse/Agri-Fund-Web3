const socketio = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room based on user ID
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Handle messaging events
    socket.on('sendMessage', (data) => {
      const { receiver } = data;
      io.to(receiver).emit('newMessage', data);
    });

    // Handle contract updates
    socket.on('contractUpdate', (contractId) => {
      io.emit('contractUpdated', contractId);
    });

    // Handle application updates
    socket.on('applicationUpdate', (applicationId) => {
      io.emit('applicationUpdated', applicationId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };