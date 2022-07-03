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

function minimax(board: number[], depth: number, isAIFirst: boolean): number {
  const virtualGame = new TicTacToe();
  virtualGame.moveHistory = board;

  winnerCheck(
    virtualGame,
    isAIFirst ? (board.length + 1) % 2 : board.length % 2
  );

  if (virtualGame.winner !== undefined) {
    let score = -depth - 1;
    if (virtualGame.winner === -1) {
      // tie
      score = 0;
    }
    if (
      (virtualGame.winner === 0 && isAIFirst) ||
      (virtualGame.winner === 1 && !isAIFirst)
    ) {
      // ai win
      score = 1 / (depth + 1);
    }
    return score; // player win
  }

  if (
    (board.length % 2 && isAIFirst) ||
    (board.length % 2 === 0 && !isAIFirst)
  ) {
    // players turn
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board.includes(i)) {
        board.push(i);
        const score = minimax(board, depth + 1, isAIFirst);
        board.pop();
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  } else if (
    (board.length % 2 && !isAIFirst) ||
    (board.length % 2 === 0 && isAIFirst)
  ) {
    // ai turn
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board.includes(i)) {
        board.push(i);
        const score = minimax(board, depth + 1, isAIFirst);
        board.pop();
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  }
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
  if (game.moveHistory.length === 9) {
    game.winner = -1;
  }
  return false;
}

function draw(board: number[]): string {
  let result = "";
  for (let i = 0; i < 3; i++) {
    let str = "|";
    for (let j = 0; j < 3; j++) {
      str +=
        board.indexOf(i * 3 + j) === -1
          ? " |"
          : board.indexOf(i * 3 + j) % 2
          ? "O|"
          : "X|";
    }
    result += str + "\n";
  }
  return result;
}

app.use(bodyParser.json());

// create singleplayer game
app.get("/singleplayerGame", (req, res) => {
  const myUUID = uuid();
  const data = JSON.parse(fs.readFileSync("./data.json").toString());
  const firstMove = Math.random() > 0.5 ? [Math.round(Math.random() * 8)] : [];

  const newGame: TicTacToe = {
    gameId: uuid(),
    gameType: "S",
    playerIds: firstMove.length > 0 ? [, uuid()] : [uuid()],
    moveHistory: firstMove,
    winner: undefined,
  };

  data.game.push(newGame);
  fs.writeFileSync("./data.json", JSON.stringify(data));

  res.json({
    message:
      "Game Created Successfully! " +
      (firstMove.length > 0
        ? "AI goes first. He played position " + firstMove[0]
        : "You go first."),
    gameId: newGame.gameId,
    player: newGame.playerIds[firstMove.length],
  });
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

  res.json({
    message: "Game Created Successfully!",
    gameId: newGame.gameId,
    player1: newGame.playerIds[0],
    player2: newGame.playerIds[1],
  });
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
      message: "Can't find game",
    });
    return;
  }
  const position = Number(req.body.position);
  const playerNum = game.moveHistory.length % 2;
  let aiMove;

  if (game.winner !== undefined) {
    // game is over
    res.status(400);
    res.json({
      message: "Game already finished, the winner is player " + game.winner,
      board: draw(game.moveHistory),
    });
    return;
  }
  if (isNaN(position) || position > 8 || position < 0) {
    // wrong position
    res.status(400);
    res.json({ message: "Invalid position" });
    return;
  }
  if (game.playerIds[playerNum] !== req.body.playerId) {
    // not the players turn or invalid playerId
    res.status(400);
    res.json({ message: "Not your turn or Invalid playerId" });
    return;
  }
  if (game.moveHistory.includes(position)) {
    // occupied position
    res.status(400);
    res.json({ message: "Occupied position" });
    return;
  }

  game.moveHistory.push(position);
  if (game.moveHistory.length > 4) {
    winnerCheck(game, playerNum);
  }
  if (game.gameType === "S" && game.winner === undefined) {
    // AI move
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!game.moveHistory.includes(i)) {
        game.moveHistory.push(i);
        const score = minimax(game.moveHistory, 0, game.playerIds[0] === null);
        game.moveHistory.pop();
        if (score > bestScore) {
          bestScore = score;
          aiMove = i;
        }
      }
    }
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
      res.json({ message: "You win!", board: draw(game.moveHistory) });
    } else if (game.winner === -1) {
      res.json({ message: "Tie", board: draw(game.moveHistory) });
    } else {
      res.json({
        message: "Player " + playerNum + " selected position " + position,
        board: draw(game.moveHistory),
      });
    }
  } else {
    if (game.winner === -1) {
      res.json({ message: "Tie", board: draw(game.moveHistory) });
    } else if (game.winner !== undefined) {
      res.json({
        message: "Player " + game.winner + " has won!",
        board: draw(game.moveHistory),
      });
    } else {
      res.json({
        message: "Ai selected position " + aiMove,
        board: draw(game.moveHistory),
      });
    }
  }
});

// game status
app.get("/:gameId", (req, res) => {
  const game: TicTacToe = JSON.parse(
    fs.readFileSync("./data.json").toString()
  ).game.find((o: TicTacToe) => o.gameId === req.params.gameId);
  if (game === undefined) {
    res.status(404);
    res.json({ message: "game not found" });
  } else {
    res.json(game);
  }
});
app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});
