import { createSignal, type Component, For } from "solid-js";
import { Direction, Game } from "../../snake";
import { PORT } from "../../config";

const [game, setGame] = createSignal(new Game());

const socket = new WebSocket(`ws://localhost:${PORT}`);

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data.toString());

  if ("winner" in data) {
    console.log("winner", data.winner);
    socket.close();
    location.reload();
  }

  const game = data as Game;

  setGame(game);

  console.log(lastMove);
  if (lastMove !== null) {
    socket.send(lastMove);
  }
});

let lastMove: Direction | null = null;
const INPUT_MAP: Record<string, Direction> = {
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

const App: Component = () => {
  return (
    <div
      tabIndex="0"
      onKeyDown={(e) => {
        if (e.key in INPUT_MAP) {
          lastMove = INPUT_MAP[e.key]!;
        }
      }}
      class="bg-gray-400 h-screen"
    >
      <h1>Snake</h1>
      <Board />
    </div>
  );
};

function Board() {
  const flatBoard = () => game().board.flat();
  return (
    <div
      class="max-w-full"
      style={{
        display: "grid",
        "grid-template-columns": `repeat(${Game.WIDTH}, 1fr)`,
      }}
    >
      <For each={flatBoard()}>
        {(cell) => (
          <div
            class="aspect-square border-black border-2 max-h-fit"
            style={{
              "background-color": cell ?? "gray",
            }}
          ></div>
        )}
      </For>
    </div>
  );
}

export default App;