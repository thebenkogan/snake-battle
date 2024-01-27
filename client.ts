import WebSocket from "ws";
import { PORT } from "./config";

const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.addEventListener("open", () => {
  console.log("Connected to the server");
});

socket.addEventListener("message", (event) => {
  console.log("Message from server ", event.data);
});
