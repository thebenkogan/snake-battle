export type PlayerColor = "red" | "blue";

export function oppositeColor(color: PlayerColor): PlayerColor {
  return color === "red" ? "blue" : "red";
}

type Point = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

function isOppositeDirection(d1: Direction, d2: Direction): boolean {
  return (
    (d1 === "up" && d2 === "down") ||
    (d1 === "down" && d2 === "up") ||
    (d1 === "left" && d2 === "right") ||
    (d1 === "right" && d2 === "left")
  );
}

function moveDirection(p: Point, dir: Direction): Point {
  switch (dir) {
    case "up":
      return { x: p.x, y: p.y - 1 };
    case "down":
      return { x: p.x, y: p.y + 1 };
    case "left":
      return { x: p.x - 1, y: p.y };
    case "right":
      return { x: p.x + 1, y: p.y };
  }
}

type PlayerState = {
  body: Point[];
  direction: Direction;
  numToGrow: number;
};

export class Game {
  static readonly HEIGHT = 30;
  static readonly WIDTH = 70;
  static readonly STARTING_LENGTH = 5;

  static inBounds(p: Point): boolean {
    return p.x >= 0 && p.x < Game.WIDTH && p.y >= 0 && p.y < Game.HEIGHT;
  }

  board: (PlayerColor | null)[][];
  private red: PlayerState;
  private blue: PlayerState;

  private get(p: Point): PlayerColor | null {
    return this.board[p.y]![p.x]!;
  }

  private set(p: Point, v: PlayerColor | null) {
    this.board[p.y]![p.x] = v;
  }

  constructor() {
    this.board = new Array(Game.HEIGHT)
      .fill(null)
      .map(() => new Array(Game.WIDTH).fill(null));

    const xOffset = Math.floor(Game.WIDTH * 0.1);
    const startY = Math.floor(Game.HEIGHT / 2);
    this.red = {
      body: [{ x: xOffset, y: startY }],
      direction: "right",
      numToGrow: Game.STARTING_LENGTH,
    };

    this.blue = {
      body: [{ x: Game.WIDTH - xOffset, y: startY }],
      direction: "left",
      numToGrow: Game.STARTING_LENGTH,
    };

    this.set(this.red.body[0]!, "red");
    this.set(this.blue.body[0]!, "blue");
  }

  private player(color: PlayerColor): PlayerState {
    return color === "red" ? this.red : this.blue;
  }

  setDirection(color: PlayerColor, direction: Direction) {
    const player = this.player(color);
    if (!isOppositeDirection(player.direction, direction)) {
      player.direction = direction;
    }
  }

  private stepPlayer(color: PlayerColor): PlayerColor | null {
    const player = this.player(color);

    if (player.numToGrow > 0) {
      player.numToGrow--;
    } else {
      const tail = player.body.pop()!;
      this.set(tail, null);
    }

    const newHead = moveDirection(player.body[0]!, player.direction);

    if (!Game.inBounds(newHead) || this.get(newHead)) {
      return oppositeColor(color);
    }

    player.body.unshift(newHead);
    this.set(newHead, color);

    return null;
  }

  step(): PlayerColor | null {
    const redResult = this.stepPlayer("red");
    if (redResult) {
      return redResult;
    }
    return this.stepPlayer("blue");
  }
}
