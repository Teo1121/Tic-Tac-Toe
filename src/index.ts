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
  winner: number; // undefined = no winner, -1 = tie, 0 = player 0, 1 = player 1
}

function winnerCheck(game: TicTacToe, playerIndex: number): boolean {
  const player: number[] = [];
  game.moveHistory.forEach((int, i) => {
    if ((i + playerIndex + 1) % 2) {
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
      game.winner = playerIndex;
      return true;
    }
    // vertical
    if (
      player.includes(0 + i) &&
      player.includes(3 + i) &&
      player.includes(6 + i)
    ) {
      game.winner = playerIndex;
      return true;
    }
  }
  // diagonal
  if (player.includes(4)) {
    if (player.includes(0) && player.includes(8)) {
      game.winner = playerIndex;
      return true;
    }
    if (player.includes(2) && player.includes(6)) {
      game.winner = playerIndex;
      return true;
    }
  }
  return false;
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

  data.game.push(newGame);
  fs.writeFileSync("./data.json", JSON.stringify(data));

  res.json(newGame);
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
  if (game === undefined) {
    res.status(400);
    res.json({
      message: "Cant find game",
    });
    return;
  }
  const position = req.body.position;
  const playerNum = game.moveHistory.length % 2;
  let aiMove;

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

  if (game.playerIds[playerNum] !== req.body.playerId) {
    // not the players turn or invalid playerId
    res.status(400);
    res.json({ message: "Not your turn or Invalid playedId" });
    return;
  }
  if (game.moveHistory.includes(position)) {
    // occupied position
    res.status(400);
    res.json({ message: "Occupied position" });
    return;
  } else {
    game.moveHistory.push(position);
    if (game.moveHistory.length > 4) {
      if (!winnerCheck(game, playerNum) && game.moveHistory.length === 9) {
        game.winner = -1;
      }
    }
    if (game.gameType === "S" && game.winner === undefined) {
      do {
        aiMove = Math.round(Math.random() * 8);
      } while (game.moveHistory.includes(aiMove));

      game.moveHistory.push(aiMove);
      if (game.moveHistory.length > 4) {
        winnerCheck(game, (playerNum + 1) % 2);
      }
    }
    const gameIndex = data.game.findIndex(
      (o: TicTacToe) => o.gameId === req.params.gameId
    );
    data.game[gameIndex] = game;
    fs.writeFileSync("./data.json", JSON.stringify(data));
    if (game.gameType === "M") {
      if (game.winner === playerNum) {
        res.json({ message: "You win!" });
      } else if (game.winner === -1) {
        res.json({ message: "Tie" });
      } else {
        res.json({
          message: "Player " + playerNum + " selected position " + position,
        });
      }
    } else {
      if (game.winner === -1) {
        res.json({ message: "Tie" });
      } else if (game.winner !== undefined) {
        res.json({ message: "Player " + game.winner + " has won!" });
      } else {
        res.json({ message: "Ai selected position " + aiMove });
      }
    }
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
