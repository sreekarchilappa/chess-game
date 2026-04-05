// Main application entry point

import GameController from './game/GameController.js';
import ChessBoardRenderer from './3d/ChessBoardRenderer.js';

class ChessGameApp {
  constructor() {
    console.log('Initializing ChessGameApp...');
    this.gameController = new GameController();
    this.renderer = null;
    this.currentDifficulty = 1;
    this.musicEnabled = false;
    this.audioElement = null;
    this.setupEventListeners();
    this.updateStatsDisplay();
    this.initializeMusic();
    console.log('ChessGameApp initialized successfully');
  }

  initializeMusic() {
    this.audioElement = document.getElementById('backgroundMusic');
    if (this.audioElement) {
      this.audioElement.volume = 0.3; // Set to 30% volume
      // Try to play, but don't fail if autoplay is blocked
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log('Autoplay blocked. Music can be enabled by clicking the button.');
          this.musicEnabled = false;
        });
      }
    }
  }

  setupEventListeners() {
    // Main menu buttons
    document.getElementById('btnPlayBot')?.addEventListener('click', () => this.startBotGame());
    document.getElementById('btnTwoPlayer')?.addEventListener('click', () => this.startTwoPlayerGame());
    document.getElementById('btnSettings')?.addEventListener('click', () => this.showSettings());

    // Game screen buttons
    document.getElementById('btnUndo')?.addEventListener('click', () => this.undoMove());
    document.getElementById('btnResign')?.addEventListener('click', () => this.resignGame());
    document.getElementById('btnMusic')?.addEventListener('click', () => this.toggleMusic());

    // Game end screen buttons
    document.getElementById('btnPlayAgain')?.addEventListener('click', () => this.playAgain());
    document.getElementById('btnBackToMenu')?.addEventListener('click', () => this.backToMenu());

    // Difficulty selection buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const difficulty = parseInt(e.currentTarget.getAttribute('data-difficulty'));
        this.selectDifficulty(difficulty);
      });
    });
    document.getElementById('btnCancelDifficulty')?.addEventListener('click', () => this.showMainMenu());

    // Settings buttons
    document.getElementById('btnResetStats')?.addEventListener('click', () => this.resetStats());
    document.getElementById('btnSettingsMenu')?.addEventListener('click', () => this.showMainMenu());

    // Game end event
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

  toggleMusic() {
    const musicBtn = document.getElementById('btnMusic');
    if (!this.audioElement) return;

    if (this.musicEnabled) {
      this.audioElement.pause();
      this.musicEnabled = false;
      if (musicBtn) {
        musicBtn.textContent = '🔇';
        musicBtn.classList.add('muted');
      }
    } else {
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.musicEnabled = true;
          if (musicBtn) {
            musicBtn.textContent = '🔊';
            musicBtn.classList.remove('muted');
          }
        }).catch(() => {
          console.log('Could not play music');
        });
      }
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
console.log('=== Chess Game Script Loading ===');
console.log('Current time:', new Date().toISOString());

let appInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  console.log('ChessGameApp available?', typeof ChessGameApp);
  console.log('window.app before init:', window.app);
  
  try {
    if (typeof ChessGameApp === 'undefined') {
      console.error('ERROR: ChessGameApp class not found! Module import may have failed.');
      // Create a placeholder to avoid errors
      window.app = {
        startBotGame: () => alert('Game is loading, please wait...'),
        startTwoPlayerGame: () => alert('Game is loading, please wait...'),
        showSettings: () => alert('Game is loading, please wait...'),
        selectDifficulty: () => alert('Game is loading, please wait...'),
        playAgain: () => alert('Game is loading, please wait...'),
        backToMenu: () => alert('Game is loading, please wait...'),
        showMainMenu: () => alert('Game is loading, please wait...'),
        undoMove: () => alert('Game is loading, please wait...'),
        resignGame: () => alert('Game is loading, please wait...'),
        resetStats: () => alert('Game is loading, please wait...')
      };
      return;
    }
    
    console.log('Creating ChessGameApp instance...');
    window.app = new ChessGameApp();
    appInitialized = true;
    console.log('✓ Chess game initialized successfully');
    console.log('window.app methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.app)));
  } catch (error) {
    console.error('FAILED to initialize chess game:', error);
    console.error('Error stack:', error.stack);
    alert('Error initializing game: ' + error.message + '\n\nPlease open browser console (F12) for more details.');
  }
});

// Fallback - wait a bit and try again if needed
setTimeout(() => {
  console.log('Timeout check - app initialized?', appInitialized);
  if (!appInitialized && document.readyState === 'complete') {
    console.log('Retrying initialization...');
    try {
      if (typeof ChessGameApp !== 'undefined' && !window.app) {
        window.app = new ChessGameApp();
        appInitialized = true;
        console.log('✓ Chess game initialized on retry');
      }
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }
}, 3000);
