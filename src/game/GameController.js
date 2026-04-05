// Main game controller - orchestrates game flow

import ChessEngine from './ChessEngine.js';
import BotAI from './BotAI.js';
import DifficultyManager from './DifficultyManager.js';
import GameState from './GameState.js';

class GameController {
  constructor() {
    this.engine = new ChessEngine();
    this.botAI = new BotAI();
    this.difficultyManager = new DifficultyManager();
    this.gameState = new GameState();
    this.renderer = null;
    this.gameMode = null; // 'bot' or 'twoPlayer'
    this.selectedSquare = null;
    this.isPlayerTurn = true;
    this.gameOver = false;
    this.gameResult = null;
  }

  initializeBotGame(difficulty = 1) {
    this.engine.resetGame();
    this.gameMode = 'bot';
    this.gameState.initializeBotGame(difficulty);
    this.difficultyManager.resetToLevel(difficulty);
    this.selectedSquare = null;
    this.isPlayerTurn = true;
    this.gameOver = false;
    this.gameResult = null;

    // Load any saved progress
    const saved = this.gameState.loadDifficultyProgress();
    this.difficultyManager.setState(saved);
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

    if (this.engine.makeMove(moveNotation)) {
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

  makeBotMove() {
    if (this.gameOver) return;

    const difficulty = this.difficultyManager.getCurrentLevel();
    const move = this.botAI.getBestMove(this.engine, difficulty);

    if (!move) {
      // No legal moves
      this.checkGameEnd();
      return;
    }

    this.engine.makeMove(move);

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
      this.onGameEnd();
      return;
    }

    if (state.isDraw) {
      this.gameOver = true;
      this.gameResult = { type: 'draw' };
      this.onGameEnd();
      return;
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

      console.log(`Game Over: ${resultType}`);
      console.log(`Current difficulty: ${this.difficultyManager.getDifficultyName()}`);
      console.log(`Points: ${this.difficultyManager.getPoints()}/${this.difficultyManager.maxPoints}`);
    } else {
      const winner = this.gameResult.type === 'draw' ? 'draw' : this.gameResult.winner;
      this.gameState.recordTwoPlayerGameResult(winner);
      console.log(`Game Over: ${winner}`);
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
