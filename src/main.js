// Main application entry point

import GameController from './game/GameController.js';
import ChessBoardRenderer from './ChessBoardRenderer.js';

class ChessGameApp {
  constructor() {
    this.gameController = new GameController();
    this.renderer = null;
    this.currentDifficulty = 1;
    this.music = null;
    this.setupEventListeners();
    this.updateStatsDisplay();
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
        // Show legal move dots before handling the click
        const fromNotation = this.gameController.engine.coordsToNotation(square.row, square.col);
        const piece = this.gameController.engine.getPiece(square.row, square.col);
        const currentPlayer = this.gameController.engine.currentPlayer;

        if (piece && piece.color === currentPlayer && !this.gameController.selectedSquare) {
          const legalMoves = this.gameController.engine.getLegalMoves();
          this.renderer.clearHighlights();
          this.renderer.highlightSquare(square.row, square.col);
          this.renderer.highlightLegalMoves(legalMoves, fromNotation);
        }

        this.gameController.handleSquareClick(square.row, square.col);
        this.updateGameInfo();

        // Highlight king in check
        if (this.gameController.engine.isInCheck(this.gameController.engine.currentPlayer)) {
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const p = this.gameController.engine.getPiece(r, c);
              if (p && p.type === 'king' && p.color === this.gameController.engine.currentPlayer) {
                this.renderer.highlightCheck(r, c);
              }
            }
          }
        }
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

    const boardElement = document.getElementById('gameBoard');
    if (!boardElement) return;

    // Re-create renderer fresh each game
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.renderer = new ChessBoardRenderer(boardElement);
    this.gameController.setRenderer(this.renderer);
    this.renderer.updateBoard(this.gameController.engine.board);

    // Wire up sound callbacks
    this.gameController.onCapture = () => this.playCaptureSfx();
    this.gameController.onCheck = () => this.playCheckSfx();
    this.gameController.onCheckmate = () => this.playVictorySfx();

    this.updateGameInfo();

    if (this.gameController.gameMode === 'bot' && this.gameController.engine.currentPlayer === 'black') {
      setTimeout(() => this.gameController.makeBotMove(), 500);
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
    this.startGame();
  }

  undoMove() {
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

  // ── Background Music (Web Audio API - no external files needed) ───────────
  toggleMusic() {
    if (this.music && this.music.playing) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  startMusic() {
    try {
      if (!this.music) {
        this.music = { ctx: new (window.AudioContext || window.webkitAudioContext)(), playing: false, nodes: [] };
      }
      if (this.music.ctx.state === 'suspended') {
        this.music.ctx.resume();
      }

      // Chill ambient melody: pentatonic notes that loop
      const ctx = this.music.ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.12;
      masterGain.connect(ctx.destination);

      // Reverb-like delay for ambience
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.45;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.35;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(masterGain);

      // Pentatonic scale notes (Hz) for a peaceful loop
      const notes = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
      const melody = [0, 2, 4, 5, 4, 2, 0, 1, 3, 5, 4, 3, 2, 0, 4, 5];
      const tempo = 0.55; // seconds per note

      const totalDuration = melody.length * tempo;

      const scheduleLoop = (startTime) => {
        melody.forEach((noteIdx, i) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = notes[noteIdx];
          osc.connect(gain);
          gain.connect(delay);
          gain.connect(masterGain);

          const t = startTime + i * tempo;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + tempo * 0.85);

          osc.start(t);
          osc.stop(t + tempo);
          this.music.nodes.push(osc, gain);
        });
        // Schedule next loop
        this.music.loopTimer = setTimeout(() => {
          if (this.music && this.music.playing) {
            scheduleLoop(ctx.currentTime + 0.05);
          }
        }, (totalDuration - 0.3) * 1000);
      };

      scheduleLoop(ctx.currentTime + 0.1);
      this.music.nodes.push(masterGain, delay, feedback);
      this.music.playing = true;

      const btn = document.getElementById('btnMusic');
      if (btn) btn.textContent = '🔊 Music';
    } catch (e) {
      console.warn('Music unavailable:', e);
    }
  }

  stopMusic() {
    if (!this.music) return;
    clearTimeout(this.music.loopTimer);
    this.music.nodes.forEach(n => { try { n.disconnect(); } catch(e) {} });
    this.music.nodes = [];
    this.music.playing = false;
    const btn = document.getElementById('btnMusic');
    if (btn) btn.textContent = '🔇 Music';
  }

  _getSfxContext() {
    if (!this.music) {
      this.music = { ctx: new (window.AudioContext || window.webkitAudioContext)(), playing: false, nodes: [] };
    }
    if (this.music.ctx.state === 'suspended') this.music.ctx.resume();
    return this.music.ctx;
  }

  playCaptureSfx() {
    try {
      const ctx = this._getSfxContext();
      const now = ctx.currentTime;
      // Thud + metallic ring
      [80, 160, 320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.25);
        gain.gain.setValueAtTime(0.35 - i * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    } catch(e) {}
  }

  playCheckSfx() {
    try {
      const ctx = this._getSfxContext();
      const now = ctx.currentTime;
      // Tense staccato danger chord
      const notes = [220, 277.2, 369.99]; // Am chord
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.07 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      });
      // Extra low bass hit
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(110, now);
      bass.frequency.exponentialRampToValueAtTime(55, now + 0.4);
      bassGain.gain.setValueAtTime(0.4, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.start(now);
      bass.stop(now + 0.5);
    } catch(e) {}
  }

  playVictorySfx() {
    try {
      const ctx = this._getSfxContext();
      const now = ctx.currentTime;
      // Triumphant ascending fanfare
      const fanfare = [523.3, 659.3, 783.99, 1046.5];
      fanfare.forEach((freq, i) => {
        const t = now + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
        gain.gain.setValueAtTime(0.3, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
      });
      // Harmony on top
      const harmony = [659.3, 783.99, 987.77, 1318.5];
      harmony.forEach((freq, i) => {
        const t = now + i * 0.18 + 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch(e) {}
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChessGameApp();
});
