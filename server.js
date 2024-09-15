// Required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;


app.set('view engine', 'ejs');
// Set the directory for EJS templates
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the index.ejs file
app.get('/', (req, res) => {
  res.render('index'); // Renders 'views/index.ejs'
});

// Queue to keep track of available users
let availableUsers = [];

// Handle new socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add user to the available queue when they connect
  availableUsers.push(socket.id);

  // Attempt to find a new peer when a user connects
  findPeerForSocket(socket);

  // Handle the 'find-new-peer' event when the user presses the "New" button
  socket.on('find-new-peer', () => {
    console.log(`User ${socket.id} is finding a new peer`);
    disconnectFromCurrentPeer(socket); // Disconnect from the current peer first
    availableUsers.push(socket.id); // Add the socket back to the queue
    findPeerForSocket(socket); // Try to find a new peer
  });

  // Handle receiving an offer from a peer
  socket.on('offer', ({ offer, to }) => {
    io.to(to).emit('offer', offer); // Send the offer to the target peer
  });

  // Handle receiving an answer from a peer
  socket.on('answer', ({ answer, to }) => {
    io.to(to).emit('answer', answer); // Send the answer back to the target peer
  });

  // Handle receiving ICE candidates
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', candidate); // Send the ICE candidate to the target peer
  });

  // Handle chat message sending
  socket.on('send-message', ({ message, to }) => {
    io.to(to).emit('receive-message', { message, from: socket.id }); // Send the message to the target peer
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    disconnectFromCurrentPeer(socket); // Clean up the disconnection
  });
});

// Function to find a peer for a socket
function findPeerForSocket(socket) {
  // If there are no other available users or the current socket is the only one in the queue
  if (availableUsers.length < 2) {
    return; // No other users to connect with at the moment
  }

  // Remove the current socket from the available users
  availableUsers = availableUsers.filter((user) => user !== socket.id);

  // Pick a random peer from the queue
  const randomPeerId = availableUsers[Math.floor(Math.random() * availableUsers.length)];

  // Connect the two users
  io.to(socket.id).emit('connect-to-peer', randomPeerId);
  io.to(randomPeerId).emit('connect-to-peer', socket.id);

  // Remove the connected peer from the queue
  availableUsers = availableUsers.filter((user) => user !== randomPeerId);

  console.log(`Connected ${socket.id} with ${randomPeerId}`);
}

// Function to handle disconnection and cleanup
function disconnectFromCurrentPeer(socket) {
  // Inform the peer that the user is disconnecting
  socket.broadcast.emit('disconnect-peer', socket.id);

  // Remove the socket from the available users queue
  availableUsers = availableUsers.filter((user) => user !== socket.id);
}

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
