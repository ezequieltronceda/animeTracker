import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

const users: Map<string, User> = new Map();
const messages: Message[] = [];

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("init", { users: Array.from(users.values()), messages });

    socket.on("join", (username: string) => {
      const user: User = { id: socket.id, username };
      users.set(socket.id, user);
      io.emit("userJoined", user);
    });

    socket.on("changeUsername", (newUsername: string) => {
      const user = users.get(socket.id);
      if (user) {
        user.username = newUsername;
        users.set(socket.id, user);
        io.emit("usernameChanged", { userId: socket.id, username: newUsername });
      }
    });

    socket.on("sendMessage", (text: string) => {
      const user = users.get(socket.id);
      if (user) {
        const message: Message = {
          id: Date.now().toString(),
          userId: socket.id,
          username: user.username,
          text,
          timestamp: Date.now(),
        };
        messages.push(message);
        io.emit("newMessage", message);
      }
    });

    socket.on("disconnect", () => {
      const user = users.get(socket.id);
      if (user) {
        users.delete(socket.id);
        io.emit("userLeft", socket.id);
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});