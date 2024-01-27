import type { Server } from "bun";
import { PORT } from "./config";
import { randomUUID } from "crypto";

class GameManager {
  private activeGames: Record<string, Date> = {};
  private waitingPool: string[] = [];

  assignGameId() {
    let gameId: string;
    if (this.waitingPool.length > 0) {
      gameId = this.waitingPool.pop()!;
      this.activeGames[gameId] = new Date();
    } else {
      gameId = randomUUID();
      this.waitingPool.push(gameId);
    }
    return gameId;
  }

  isGameReady(gameId: string): boolean {
    return gameId in this.activeGames;
  }
}

type WebSocketData = {
  gameId: string;
};

const gameManager = new GameManager();

let server: Server;
server = Bun.serve<WebSocketData>({
  fetch(req, server) {
    const gameId = gameManager.assignGameId();
    const success = server.upgrade(req, {
      data: { gameId },
    });
    if (!success) {
      new Response("Upgrade failed", { status: 500 });
    }
  },
  websocket: {
    open(ws) {
      const id = ws.data.gameId;
      console.log("OPENED:", id);
      ws.subscribe(id);
      if (gameManager.isGameReady(id)) {
        server.publish(id, "Game is ready");
      }
    },
    message(ws, message) {
      console.log("RECEIVED MESSAGE", message);
      ws.send("echo: " + message);
    },
  },
  port: PORT,
});
