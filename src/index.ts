import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { v4 as uuid } from "uuid";
const app = express();
const port = 8080;

class TicTacToe {
  gameId: string;
  gameType: string;
  playerIds: string[];
  moveHistory: number[];
  winner: number;
}

app.use(bodyParser.json());

// create singleplayer game
app.get("/singleplayerGame", (req, res) => {
  const myUUID = uuid();
  const data = JSON.parse(fs.readFileSync("./data.json").toString());

  const newGame: TicTacToe = {
    gameId: uuid(),
    gameType: "S",
    playerIds: [uuid()],
    moveHistory: [],
    winner: undefined,
  };

  data.game.push({});
  fs.writeFileSync("./data.json", JSON.stringify(data));

  res.json(data);
});

// create multiplayer game
app.get("/multiplayerGame", (req, res) => {
  const myUUID = uuid();
  const data = JSON.parse(fs.readFileSync("./data.json").toString());

  const newGame: TicTacToe = {
    gameId: uuid(),
    gameType: "M",
    playerIds: [uuid(), uuid()],
    moveHistory: [],
    winner: undefined,
  };

  data.game.push(newGame);
  fs.writeFileSync("./data.json", JSON.stringify(data));

  res.json(newGame);
});

// make a move
app.post("/:gameId", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data.json").toString());
  const game: TicTacToe = data.game.find(
    (o: TicTacToe) => o.gameId === req.params.gameId
  );
  const position = req.body.position;
  const playerNum = game.moveHistory.length % 2;

  if (game.winner !== undefined) {
    res.status(400);
    res.json({
      message: "Game allready finished, the winner is player " + game.winner,
    });
    return;
  }
  if (position > 8 || position < 0) {
    // wrong position
    res.status(400);
    res.json({ message: "Invalid position" });
    return;
  }
  if (game.gameType === "M") {
    if (game.playerIds[playerNum] !== req.body.playerId) {
      // not the players turn or invalid playerId
      res.status(400);
      res.json({ message: "Not your turn" });
      return;
    }
  }
  if (game.moveHistory.includes(position)) {
    // occupied position
    res.status(400);
    res.json({ message: "Occupied position" });
    return;
  } else {
    game.moveHistory.push(position);
    if (game.moveHistory.length > 4) {
      const player: number[] = [];
      game.moveHistory.forEach((int, i) => {
        if ((i + playerNum + 1) % 2) {
          player.push(int);
        }
      });

      for (let i = 0; i < 3; i++) {
        // horizontal
        if (
          player.includes(0 + 3 * i) &&
          player.includes(1 + 3 * i) &&
          player.includes(2 + 3 * i)
        ) {
          game.winner = playerNum;
        }
        // vertical
        if (
          player.includes(0 + i) &&
          player.includes(3 + i) &&
          player.includes(6 + i)
        ) {
          game.winner = playerNum;
        }
      }
      // diagonal
      if (player.includes(4)) {
        if (player.includes(0) && player.includes(8)) {
          game.winner = playerNum;
        }
        if (player.includes(2) && player.includes(6)) {
          game.winner = playerNum;
        }
      }
    }
    const gameIndex = data.game.findIndex(
      (o: TicTacToe) => o.gameId === req.params.gameId
    );
    data.game[gameIndex] = game;
    fs.writeFileSync("./data.json", JSON.stringify(data));

    res.send("Player " + playerNum + " selected position " + position);
  }
});

// game status
app.get("/:gameId", (req, res) => {
  const game: TicTacToe = JSON.parse(
    fs.readFileSync("./data.json").toString()
  ).game.find((o: TicTacToe) => o.gameId === req.params.gameId);
  res.json(game);
});
app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});
