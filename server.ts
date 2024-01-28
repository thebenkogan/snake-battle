import type { Server } from "bun";
import { PORT } from "./config";
import { randomUUID } from "crypto";
import { Game, type PlayerColor } from "./snake";

type PlayerInfo = {
  gameId: string;
  color: PlayerColor;
};

class GameManager {
  private activeGames: Record<string, Date> = {};
  private waitingPool: PlayerInfo[] = [];

  assignGame(): PlayerInfo {
    if (this.waitingPool.length > 0) {
      const waitingPlayer = this.waitingPool.pop()!;
      this.activeGames[waitingPlayer.gameId] = new Date();
      return {
        gameId: waitingPlayer.gameId,
        color: waitingPlayer.color === "red" ? "blue" : "red",
      };
    } else {
      const info: PlayerInfo = { gameId: randomUUID(), color: "red" };
      this.waitingPool.push(info);
      return info;
    }
  }

  isGameActive(gameId: string): boolean {
    return gameId in this.activeGames;
  }
}

const gameManager = new GameManager();

let server: Server;
server = Bun.serve<PlayerInfo>({
  fetch(req, server) {
    const data = gameManager.assignGame();
    const success = server.upgrade<PlayerInfo>(req, { data });
    if (!success) {
      new Response("Upgrade failed", { status: 500 });
    }
  },
  websocket: {
    open(ws) {
      const id = ws.data.gameId;
      console.log("OPENED:", id);
      ws.subscribe(id);
      if (gameManager.isGameActive(id)) {
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
