import type { Server } from "bun";
import { PORT } from "./config";
import { randomUUID } from "crypto";
import { Game, type Direction, type PlayerColor, oppositeColor } from "./snake";

type PlayerInfo = {
  gameId: string;
  color: PlayerColor;
};

type GameState = {
  game: Game;
  queuedMoves: [PlayerColor, Direction][];
};

let server: Server;

class GameManager {
  private static readonly TICK_RATE = 0.1 * 1000;

  private activeGames: Record<string, GameState> = {};
  private waitingPool: PlayerInfo[] = [];

  private tickGames() {
    console.time("TICK");
    for (const [id, state] of Object.entries(this.activeGames)) {
      const { game, queuedMoves } = state;
      for (const [color, move] of queuedMoves) {
        game.setDirection(color, move);
      }
      const winner = game.step();

      if (winner) {
        delete this.activeGames[id];
        server.publish(id, JSON.stringify({ winner }));
      } else {
        server.publish(id, JSON.stringify(game));
        queuedMoves.splice(0, queuedMoves.length);
      }
    }
    console.timeEnd("TICK");
  }

  constructor() {
    setInterval(this.tickGames.bind(this), GameManager.TICK_RATE);
  }

  assignGame(): PlayerInfo {
    if (this.waitingPool.length > 0) {
      const waitingPlayer = this.waitingPool.pop()!;
      this.activeGames[waitingPlayer.gameId] = {
        game: new Game(),
        queuedMoves: [],
      };
      return {
        gameId: waitingPlayer.gameId,
        color: oppositeColor(waitingPlayer.color),
      };
    } else {
      const info: PlayerInfo = { gameId: randomUUID(), color: "red" };
      this.waitingPool.push(info);
      return info;
    }
  }

  receiveMove(info: PlayerInfo, move: Direction) {
    const { queuedMoves } = this.activeGames[info.gameId]!;
    if (queuedMoves.some(([color]) => color === info.color)) {
      return;
    }
    queuedMoves.push([info.color, move]);
  }

  closeGame(info: PlayerInfo) {
    if (info.gameId in this.activeGames) {
      delete this.activeGames[info.gameId];
      this.waitingPool.push({
        gameId: info.gameId,
        color: oppositeColor(info.color),
      });
      server.publish(
        info.gameId,
        JSON.stringify({ winner: oppositeColor(info.color) })
      );
    } else {
      this.waitingPool = this.waitingPool.filter(
        (i) => i.gameId !== info.gameId
      );
    }
  }
}

const gameManager = new GameManager();

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
      console.log("OPENED:", ws.data.gameId);
      ws.subscribe(ws.data.gameId);
    },
    message(ws, message) {
      console.log(
        `RECEIVED MOVE ${message} from ${ws.data.color} in ${ws.data.gameId}`
      );
      gameManager.receiveMove(ws.data, message as Direction);
    },
    close(ws) {
      gameManager.closeGame(ws.data);
      console.log("CLOSED:", ws.data.gameId);
    },
  },
  port: PORT,
});
