// server.js - Quiet Please backend with profiles + presence
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;
const app = express();

// Serve static files (deviceA.html, deviceB.html, etc.)
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Keep track of connected clients & their profiles
// Map<WebSocket, { id, name, avatar, color }>
const clients = new Map();

function broadcast(jsonObj) {
  const data = JSON.stringify(jsonObj);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}

function broadcastPresence() {
  const users = [];
  for (const [, profile] of clients) {
    if (profile && profile.id) {
      users.push(profile);
    }
  }
  broadcast({
    type: "presence",
    users,
  });
}

wss.on("connection", (ws) => {
  // Initialize with an empty profile
  clients.set(ws, { id: null, name: null, avatar: null, color: null });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "profile") {
        // Update stored profile for this client
        clients.set(ws, {
          id: msg.id,
          name: msg.name,
          avatar: msg.avatar,
          color: msg.color,
        });
        // Notify everyone of the new presence list
        broadcastPresence();
      } else if (msg.type === "chat") {
        // Attach server timestamp (optional)
        const serverMsg = {
          ...msg,
          serverTime: new Date().toISOString(),
        };
        // Broadcast chat message as-is to all
        broadcast(serverMsg);
      }
    } catch (err) {
      console.error("Bad message:", err);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcastPresence();
  });
});

server.listen(PORT, () => {
  console.log(`QuietPlease WebSocket server running on port ${PORT}`);
});
