// Centralized game state management with localStorage persistence

class GameState {
  constructor() {
    this.gameMode = null; // 'bot' or 'twoPlayer'
    this.gameActive = false;
    this.stats = this.loadStats();
  }

  initializeBotGame(difficulty = 1) {
    this.gameMode = 'bot';
    this.gameActive = true;
    this.currentDifficulty = difficulty;
    this.playerColor = 'white';
    this.botColor = 'black';
  }

  initializeTwoPlayerGame() {
    this.gameMode = 'twoPlayer';
    this.gameActive = true;
  }

  recordBotGameResult(result) {
    // result: 'win', 'loss', 'draw'
    this.stats.totalGames += 1;

    if (result === 'win') {
      this.stats.wins += 1;
      this.stats.currentWinStreak += 1;
    } else if (result === 'loss') {
      this.stats.losses += 1;
      this.stats.currentWinStreak = 0;
    } else {
      this.stats.draws += 1;
      this.stats.currentWinStreak = 0;
    }

    if (this.stats.currentWinStreak > this.stats.maxWinStreak) {
      this.stats.maxWinStreak = this.stats.currentWinStreak;
    }

    this.saveStats();
  }

  recordTwoPlayerGameResult(winner) {
    // winner: 'white', 'black', 'draw'
    this.stats.twoPlayerGames = (this.stats.twoPlayerGames || 0) + 1;
    this.saveStats();
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      twoPlayerGames: 0,
      totalPlayTime: 0
    };
    this.saveStats();
  }

  loadStats() {
    const saved = localStorage.getItem('chessGameStats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    }

    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      twoPlayerGames: 0,
      totalPlayTime: 0
    };
  }

  saveStats() {
    localStorage.setItem('chessGameStats', JSON.stringify(this.stats));
  }

  saveDifficultyProgress(difficultyState) {
    localStorage.setItem('chessGameDifficulty', JSON.stringify(difficultyState));
  }

  loadDifficultyProgress() {
    const saved = localStorage.getItem('chessGameDifficulty');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load difficulty progress:', e);
      }
    }
    return { level: 1, points: 0, winStreak: 0 };
  }

  saveGamePosition(engineState) {
    localStorage.setItem('chessGamePosition', JSON.stringify(engineState));
  }

  loadGamePosition() {
    const saved = localStorage.getItem('chessGamePosition');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load game position:', e);
      }
    }
    return null;
  }

  clearGamePosition() {
    localStorage.removeItem('chessGamePosition');
  }
}

export default GameState;
