import { createSignal, type Component, For, Show } from "solid-js";
import { Direction, Game, PlayerColor } from "../../snake";
import { PORT } from "../../config";

let lastMove: Direction | null = null;
const INPUT_MAP: Record<string, Direction> = {
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

const App: Component = () => {
  const [game, setGame] = createSignal(new Game());
  const [winner, setWinner] = createSignal<PlayerColor>();
  const [isWaiting, setIsWaiting] = createSignal(true);

  const initializeGame = () => {
    setGame(new Game());
    setWinner(undefined);
    setIsWaiting(false);

    const socket = new WebSocket(`ws://localhost:${PORT}/game`);

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data.toString());

      if ("winner" in data) {
        socket.close();
        setIsWaiting(true);
        setWinner(data.winner);
        return;
      }

      setGame(data as Game);

      if (lastMove !== null) {
        socket.send(lastMove);
        lastMove = null;
      }
    });
  };

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
      <h1 class="inline text-left font-bold ml-2">Snake Battle</h1>
      <Show when={!!winner()}>
        <h1 class="absolute left-1/2 top-0 -translate-x-1/2 font-bold">
          {winner().charAt(0).toUpperCase() + winner().slice(1)} wins!
        </h1>
      </Show>
      <Board game={game()} />
      <Show when={isWaiting()}>
        <button
          class="absolute left-1/2 -translate-x-1/2 bg-blue-600 border-black font-bold px-4 py-2 mt-4 rounded text-white"
          onClick={initializeGame}
        >
          Join Game
        </button>
      </Show>
    </div>
  );
};

function Board(props: { game: Game }) {
  return (
    <div
      class="max-w-full"
      style={{
        display: "grid",
        "grid-template-columns": `repeat(${Game.WIDTH}, 1fr)`,
      }}
    >
      <For each={props.game.board.flat()}>
        {(cell) => (
          <div
            class="aspect-square border-black border-2 max-h-fit"
            style={{
              "background-color": cell === "food" ? "green" : cell ?? "gray",
            }}
          ></div>
        )}
      </For>
    </div>
  );
}

export default App;
