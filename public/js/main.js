// Establish the connection to the server via Socket.io
const socket = io();

// HTML elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const chatWindow = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const newButton = document.getElementById('newButton');

// Local variables
let localStream; // Holds the stream from the user's camera and microphone
let peerConnection; // The RTCPeerConnection object that handles WebRTC connection
let currentPeer; // Store the current connected peer's socket ID

// WebRTC configuration object, including STUN servers
const peerConnectionConfig = {
  iceServers: [
    { urls: ["stun:ws-turn2.xirsys.com"] },
    {
      username:
        "5M9SglXJKNk2nSpyqGbuaKjl7QQEF00VWotB7W7mP9RbiO0r3I5nYHNvA54sKca3AAAAAGbQ2mpzdGV2ZW5ydWdn",
      credential: "8b6ba896-6645-11ef-ac3d-0242ac140004",
      urls: [
        "turn:ws-turn2.xirsys.com:80?transport=udp",
        "turn:ws-turn2.xirsys.com:3478?transport=udp",
        "turn:ws-turn2.xirsys.com:80?transport=tcp",
        "turn:ws-turn2.xirsys.com:3478?transport=tcp",
        "turns:ws-turn2.xirsys.com:443?transport=tcp",
        "turns:ws-turn2.xirsys.com:5349?transport=tcp",
      ],
    },
  ],

};

// Get the local media stream and display it in the local video element
async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    return localStream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    return null;
  }
}

// Initialize the local stream on page load
getLocalStream();

// Event listener for the "New" button to disconnect from the current chat and find a new peer
newButton.addEventListener('click', () => {
  disconnect();
  socket.emit('find-new-peer'); // Request to find a new peer
});

// Event listener for the "Send" button to send chat messages
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    appendMessage('You', message); // Append message to the sender's chat window
    socket.emit('send-message', { message, to: currentPeer }); // Send the message to the current peer
    messageInput.value = ''; // Clear the input
  }
});

// Append messages to the chat window
function appendMessage(sender, message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the latest message
}

// Socket event listeners

// When connected to a new peer
socket.on('connect-to-peer', (peerId) => {
  currentPeer = peerId;
  setupPeerConnection();
  console.log('Connected to peer:', peerId);
});

// When receiving an offer from a peer
socket.on('offer', async (offer) => {
  try {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { answer: peerConnection.localDescription, to: currentPeer });
  } catch (error) {
    console.error('Error handling offer:', error);
  }
});

// When receiving an answer from a peer
socket.on('answer', async (answer) => {
  try {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error handling answer:', error);
  }
});

// When receiving ICE candidates from a peer
socket.on('ice-candidate', async (candidate) => {
  try {
    if (!peerConnection) return;
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error('Error adding received ICE candidate:', error);
  }
});

// When receiving a chat message from a peer
socket.on('receive-message', ({ message, from }) => {
  appendMessage('Stranger', message); // Append the received message to the chat window
});

// Setup WebRTC peer connection and event listeners
function setupPeerConnection() {
  getLocalStream().then((stream) => {
    if (!stream) {
      console.error('Failed to get local stream!');
      return;
    }
  
  peerConnection = new RTCPeerConnection(peerConnectionConfig);

  // Add local stream to peer connection
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0]; // Display the remote stream
  };

  // Handle ICE candidate gathering
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate, to: currentPeer });
    }
  };

  // Handle negotiation needed event
  peerConnection.onnegotiationneeded = async () => {
  try {
   await createAndSendOffer();
   } catch (error) {
     console.error('Error creating or sending offer:', error);
  }
  };

  createAndSendOffer();
});
}

// Create an offer to initiate the connection with the peer
async function createAndSendOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer: peerConnection.localDescription, to: currentPeer });
  } catch (error) {
    console.error('Error creating or sending offer:', error);
  }
}

// Disconnect from the current peer and clean up
function disconnect() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteVideo.srcObject = null;
  currentPeer = null;
}

socket.on('disconnect', disconnect); // Handle disconnection events
