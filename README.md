# WebRTC-VideoChat

 WebRTC implementation of a video chat application, peer to peer connection. I used socket.io for the signaling channel. This is pretty much vanilla javascript and node.js. I used .ejs render the html.

## Start by opening a terminal and typing `npm install`

After all of the npm dependencies are installed, you can
run your node.js development server by typing:`npm run dev`.
This will start the server and make it available at `http://localhost:3000`.
You can then open two browser windows and navigate to `http://localhost:3000` in each
window to start a video chat.

To start the node.js server in a production environment use `npm run start`
**make sure the change the server.js file `server.listen()` method to match your website hosting configuration.**
