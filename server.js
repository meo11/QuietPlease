import express from "express";
import path from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();

// --- SERVE STATIC FILES (HTML, CSS, JS) ---
app.use(express.static(__dirname)); // serves your whole folder

// Root route → load index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start HTTP server
const server = app.listen(PORT, () =>
  console.log(`HTTP server live on port ${PORT}`)
);

// --- WEBSOCKET SERVER ---
const wss = new WebSocketServer({ server });

let users = {};

function broadcastPresence() {
  const payload = JSON.stringify({
    type: "presence",
    users: Object.values(users),
  });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

wss.on("connection", (ws) => {
  let userId = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === "profile") {
        userId = msg.id;
        users[userId] = msg;
        broadcastPresence();
      }

      if (msg.type === "chat") {
        const payload = JSON.stringify(msg);
        for (const client of wss.clients) {
          if (client.readyState === 1) client.send(payload);
        }
      }
    } catch {}
  });

  ws.on("close", () => {
    if (userId && users[userId]) {
      delete users[userId];
      broadcastPresence();
    }
  });
});
