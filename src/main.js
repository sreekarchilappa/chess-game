// Main application entry point

import GameController from './game/GameController.js';
import ChessBoardRenderer from './3d/ChessBoardRenderer.js';

class ChessGameApp {
  constructor() {
    console.log('Initializing ChessGameApp...');
    this.gameController = new GameController();
    this.renderer = null;
    this.currentDifficulty = 1;
    this.setupEventListeners();
    this.updateStatsDisplay();
    console.log('ChessGameApp initialized successfully');
  }

  setupEventListeners() {
    window.addEventListener('gameEnd', (event) => {
      this.handleGameEnd(event.detail);
    });

    // Handle game board clicks when game is active
    document.addEventListener('click', (event) => {
      if (!this.renderer || !this.gameController.gameMode) return;

      const boardElement = document.getElementById('gameBoard');
      if (!boardElement.contains(event.target)) return;

      const rect = boardElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const square = this.renderer.getSquareAtPixel(x, y);
      if (square) {
        this.gameController.handleSquareClick(square.row, square.col);
        this.updateGameInfo();
      }
    });
  }

  startBotGame() {
    this.showScreen('difficultyScreen');
  }

  selectDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    this.gameController.initializeBotGame(difficulty);
    this.startGame();
  }

  startTwoPlayerGame() {
    this.gameController.initializeTwoPlayerGame();
    this.startGame();
  }

  startGame() {
    this.showScreen('gameScreen');

    // Initialize renderer if not already done
    if (!this.renderer) {
      try {
        const boardElement = document.getElementById('gameBoard');
        if (!boardElement) {
          console.error('Game board element not found');
          return;
        }
        
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
          console.error('Three.js not yet loaded, retrying...');
          setTimeout(() => this.startGame(), 500);
          return;
        }
        
        this.renderer = new ChessBoardRenderer(boardElement);
        this.gameController.setRenderer(this.renderer);
      } catch (error) {
        console.error('Failed to initialize renderer:', error);
        alert('Failed to load game board. Please refresh the page.');
        this.backToMenu();
        return;
      }
    }

    // Update initial board state
    if (this.renderer && this.gameController.engine) {
      this.renderer.updateBoard(this.gameController.engine.board);
      this.updateGameInfo();

      // If it's bot mode and it's bot's turn, make bot move
      if (this.gameController.gameMode === 'bot' && this.gameController.engine.currentPlayer === 'black') {
        setTimeout(() => this.gameController.makeBotMove(), 500);
      }
    }
  }

  updateGameInfo() {
    const state = this.gameController.getGameState();
    const difficultyState = state.difficultyState;

    // Update turn display
    const turnDisplay = document.getElementById('turnDisplay');
    if (state.gameMode === 'bot') {
      const isPlayerTurn = state.engineState.currentPlayer === 'white';
      turnDisplay.textContent = isPlayerTurn ? "Your Turn" : "Bot Thinking...";
    } else {
      const player = state.engineState.currentPlayer === 'white' ? 'White' : 'Black';
      turnDisplay.textContent = `${player}'s Turn`;
    }

    // Update difficulty info
    if (difficultyState) {
      document.getElementById('difficultyName').textContent = difficultyState.difficultyName;
      document.getElementById('pointsDisplay').textContent = `${difficultyState.points}/${difficultyState.maxPoints}`;
    }

    // Update status
    if (state.engineState.isCheckmate) {
      turnDisplay.textContent = "Checkmate!";
    } else if (state.engineState.isDraw) {
      turnDisplay.textContent = "Draw!";
    }
  }

  playAgain() {
    if (this.gameController.gameMode === 'bot') {
      this.gameController.initializeBotGame(this.currentDifficulty);
    } else {
      this.gameController.initializeTwoPlayerGame();
    }

    // Clear renderer and reinitialize
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.startGame();
  }

  undoMove() {
    // TODO: Implement undo functionality
    console.log('Undo not yet implemented');
  }

  resignGame() {
    if (confirm('Are you sure you want to resign?')) {
      if (this.gameController.gameMode === 'bot') {
        this.gameController.gameResult = { type: 'resignation', winner: 'black' };
        this.gameController.difficultyManager.recordLoss();
        this.gameController.gameState.recordBotGameResult('loss');
      }

      this.gameController.gameOver = true;
      this.handleGameEnd({
        result: this.gameController.gameResult,
        stats: this.gameController.gameState.getStats(),
        difficulty: this.gameController.gameMode === 'bot' ? this.gameController.difficultyManager.getState() : null
      });
    }
  }

  handleGameEnd(detail) {
    this.updateStatsDisplay();
    this.showGameEndScreen(detail);
  }

  showGameEndScreen(detail) {
    const { result, stats, difficulty } = detail;

    let title = 'Draw!';
    let message = 'The game ended in a draw.';
    let pointsText = '';

    if (result.type === 'checkmate') {
      if (result.winner === 'white') {
        title = 'Victory! 🎉';
        message = 'You won the game!';
        if (difficulty) {
          pointsText = `+1 Point (${difficulty.points}/${difficulty.maxPoints})<br>Difficulty: ${difficulty.difficultyName}`;
        }
      } else {
        title = 'Defeat!';
        message = 'The bot defeated you. Try again!';
      }
    } else if (result.type === 'resignation') {
      title = 'Game Resigned';
      message = 'You have resigned from the game.';
    }

    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultMessage').textContent = message;
    document.getElementById('pointsEarned').innerHTML = pointsText;

    this.showScreen('gameEndScreen');
  }

  backToMenu() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.showMainMenu();
  }

  showMainMenu() {
    this.showScreen('mainMenu');
    this.updateStatsDisplay();
  }

  showSettings() {
    const diffState = this.gameController.difficultyManager.getState();
    document.getElementById('settingsDifficultyLevel').textContent = diffState.level;
    document.getElementById('settingsDifficultyPoints').textContent = diffState.points;
    this.showScreen('settingsScreen');
  }

  resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
      this.gameController.gameState.resetStats();
      this.gameController.difficultyManager.resetToLevel(1);
      this.gameController.gameState.saveDifficultyProgress(this.gameController.difficultyManager.getState());
      this.updateStatsDisplay();
      alert('Statistics reset!');
    }
  }

  updateStatsDisplay() {
    const stats = this.gameController.gameState.getStats();
    document.getElementById('statsWins').textContent = stats.wins;
    document.getElementById('statsLosses').textContent = stats.losses;
    document.getElementById('statsStreak').textContent = stats.currentWinStreak;
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show selected screen
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.app = new ChessGameApp();
    window.app.showMainMenu();
    console.log('✓ Chess game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize chess game:', error);
    alert('Error initializing game. Please refresh the page.');
  }
});

// Fallback for older browsers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.app) {
      console.log('Retrying initialization...');
      window.app = new ChessGameApp();
      window.app.showMainMenu();
    }
  });
} else {
  // DOM already loaded
  if (!window.app) {
    window.app = new ChessGameApp();
    window.app.showMainMenu();
  }
}
