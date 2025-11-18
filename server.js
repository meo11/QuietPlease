// server.js for Render (supports HTTPS + WebSockets + static hosting)

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;
const app = express();

// Serve quietplease.html + any assets
app.use(express.static(__dirname));

const server = http.createServer(app);

// WebSocket server on same port
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(msg.toString());
      }
    });
  });
});

server.listen(PORT, () => {
  console.log("QuietPlease WebSocket server running on port", PORT);
});
