import WebSocket from "ws";
import { PORT } from "./config";
import type { Direction, Game } from "./snake";
import { emitKeypressEvents } from "readline";

emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const INPUT_MAP: Record<string, Direction> = {
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

let input: Direction | null = null;
process.stdin.on("keypress", (ch, key) => {
  if (key && key.ctrl && key.name == "c") {
    process.exit();
  }
  if (ch in INPUT_MAP) {
    input = INPUT_MAP[ch]!;
  }
});

const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.addEventListener("open", () => {
  console.log("Connected to the server");
});

socket.addEventListener("message", (event) => {
  console.log("received message");

  const data = JSON.parse(event.data.toString());

  if ("winner" in data) {
    console.log(`Winner: ${data.winner}`);
    process.exit();
  }

  const game = data as Game;

  for (const row of game.board) {
    console.log(
      row.map((p) => (p === null ? "." : p === "red" ? "R" : "B")).join("")
    );
  }

  if (input) {
    socket.send(input);
  }
});
