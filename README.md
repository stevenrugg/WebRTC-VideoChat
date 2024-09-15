# WebRTC-VideoChat

 WebRTC implementation of a video chat application, peer to peer connection. I used socket.io for the signaling channel. This is pretty much vanilla javascript and node.js. I used .ejs render the html which is responsive. It will auto resize when the window resizes. It also includes breakpoints to be used by mobile phones. The mobile phone version doesn't have the text chatroom, only the videochat.

## Start by opening a terminal and typing `npm install`

After all of the npm dependencies are installed, you can
run your node.js development server by typing:`npm run dev`.
This will start the server and make it available at `http://localhost:3000`.
You can then open two browser windows and navigate to `http://localhost:3000` in each
window to start a video chat. This emulates two random users connecting. In production this will be two users
of the page, not two browser tabs. Opening two browser tabs is just a way to test to make sure the appication
works as intended.

To start the node.js server in a production environment use `npm run start`

## Important

**make sure to change the server.js file `server.listen()` method to match your website hosting configuration.**
