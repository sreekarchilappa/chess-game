// Main game controller - orchestrates game flow

import ChessEngine from './ChessEngine.js';
import StockfishBot from './StockfishBot.js';
import DifficultyManager from './DifficultyManager.js';
import GameState from './GameState.js';

class GameController {
  constructor() {
    this.engine = new ChessEngine();
    this.stockfish = new StockfishBot();
    this.difficultyManager = new DifficultyManager();
    this.gameState = new GameState();
    this.renderer = null;
    this.gameMode = null; // 'bot' or 'twoPlayer'
    this.selectedSquare = null;
    this.isPlayerTurn = true;
    this.gameOver = false;
    this.gameResult = null;

    // Sound callbacks — set by the app
    this.onCapture = null;
    this.onCheck = null;
    this.onCheckmate = null;
  }

  initializeBotGame(difficulty = 1) {
    this.engine.resetGame();
    this.gameMode = 'bot';
    this.gameState.initializeBotGame(difficulty);
    this.selectedSquare = null;
    this.isPlayerTurn = true;
    this.gameOver = false;
    this.gameResult = null;

    // Always start at the level the player chose — never override with saved progress
    this.difficultyManager.resetToLevel(difficulty);
  }

  initializeTwoPlayerGame() {
    this.engine.resetGame();
    this.gameMode = 'twoPlayer';
    this.gameState.initializeTwoPlayerGame();
    this.selectedSquare = null;
    this.isPlayerTurn = true;
    this.gameOver = false;
    this.gameResult = null;
  }

  handleSquareClick(row, col) {
    if (this.gameOver) return;
    if (this.gameMode === 'bot' && !this.isPlayerTurn) return;

    const state = this.engine.getGameState();

    // If no square selected, select this one if it has a player piece
    if (!this.selectedSquare) {
      const piece = this.engine.getPiece(row, col);
      if (piece && piece.color === state.currentPlayer) {
        this.selectedSquare = { row, col };
        if (this.renderer) {
          this.renderer.highlightSquare(row, col, 0x00ff00);
        }
      }
      return;
    }

    // If clicking the same square, deselect
    if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
      this.selectedSquare = null;
      if (this.renderer) {
        this.renderer.clearHighlights();
      }
      return;
    }

    // Try to move piece
    const fromNotation = this.engine.coordsToNotation(this.selectedSquare.row, this.selectedSquare.col);
    const toNotation = this.engine.coordsToNotation(row, col);
    const moveNotation = fromNotation + toNotation;

    const targetPiece = this.engine.getPiece(row, col);

    if (this.engine.makeMove(moveNotation)) {
      if (targetPiece && this.onCapture) this.onCapture();

      // Move successful
      this.selectedSquare = null;
      if (this.renderer) {
        this.renderer.updateBoard(this.engine.board);
        this.renderer.clearHighlights();
      }

      this.checkGameEnd();

      // Handle bot move in single-player
      if (this.gameMode === 'bot' && !this.gameOver) {
        this.isPlayerTurn = false;
        setTimeout(() => this.makeBotMove(), 500);
      }
    } else {
      // Invalid move, try selecting new piece
      const piece = this.engine.getPiece(row, col);
      if (piece && piece.color === state.currentPlayer) {
        this.selectedSquare = { row, col };
        if (this.renderer) {
          this.renderer.highlightSquare(row, col, 0x00ff00);
        }
      } else {
        this.selectedSquare = null;
        if (this.renderer) {
          this.renderer.clearHighlights();
        }
      }
    }
  }

  async makeBotMove() {
    if (this.gameOver) return;

    const difficulty = this.difficultyManager.getCurrentLevel();
    const movetime = StockfishBot.getMovetime(difficulty);
    const fen = this.engine.toFEN();

    const move = await this.stockfish.getBestMove(fen, movetime);

    if (!move || this.gameOver) {
      this.checkGameEnd();
      return;
    }

    // Stockfish returns UCI notation e.g. "e2e4" or "e7e8q" (promotion)
    // Our engine uses same format already
    const [toRow, toCol] = this.engine.notationToCoords(move.slice(2, 4));
    const targetPiece = this.engine.getPiece(toRow, toCol);

    this.engine.makeMove(move);
    if (targetPiece && this.onCapture) this.onCapture();

    if (this.renderer) {
      this.renderer.updateBoard(this.engine.board);
    }

    this.isPlayerTurn = true;
    this.checkGameEnd();
  }

  checkGameEnd() {
    const state = this.engine.getGameState();

    if (state.isCheckmate) {
      this.gameOver = true;
      const winner = this.engine.currentPlayer === 'white' ? 'black' : 'white';
      this.gameResult = { type: 'checkmate', winner };
      if (this.onCheckmate) this.onCheckmate();
      this.onGameEnd();
      return;
    }

    if (state.isDraw) {
      this.gameOver = true;
      this.gameResult = { type: 'draw' };
      this.onGameEnd();
      return;
    }

    if (state.isInCheck && this.onCheck) {
      this.onCheck();
    }
  }

  onGameEnd() {
    if (this.gameMode === 'bot') {
      const playerColor = 'white';
      const winner = this.gameResult.winner;

      let resultType = 'draw';
      if (winner === playerColor) {
        resultType = 'win';
        this.difficultyManager.recordWin();
      } else if (winner !== playerColor) {
        resultType = 'loss';
        this.difficultyManager.recordLoss();
      }

      this.gameState.recordBotGameResult(resultType);
      this.gameState.saveDifficultyProgress(this.difficultyManager.getState());
    } else {
      const winner = this.gameResult.type === 'draw' ? 'draw' : this.gameResult.winner;
      this.gameState.recordTwoPlayerGameResult(winner);
    }

    // Emit game end event for UI to handle
    window.dispatchEvent(new CustomEvent('gameEnd', {
      detail: {
        result: this.gameResult,
        stats: this.gameState.getStats(),
        difficulty: this.gameMode === 'bot' ? this.difficultyManager.getState() : null
      }
    }));
  }

  getGameState() {
    return {
      engineState: this.engine.getGameState(),
      gameMode: this.gameMode,
      difficultyState: this.gameMode === 'bot' ? this.difficultyManager.getState() : null,
      gameOver: this.gameOver,
      gameResult: this.gameResult,
      stats: this.gameState.getStats(),
      currentPlayer: this.engine.currentPlayer
    };
  }

  setRenderer(renderer) {
    this.renderer = renderer;
    if (renderer && this.engine && this.engine.board) {
      renderer.updateBoard(this.engine.board);
    }
  }
}

export default GameController;
