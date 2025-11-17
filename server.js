const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static frontend files
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    } catch (e) {
      console.error("Bad message:", e);
    }
  });
});

server.listen(PORT, () => {
  console.log(`QuietPlease WebSocket server running on port ${PORT}`);
});