// Manages bot difficulty progression based on win streak
// Points cap at 5, then difficulty increases to next level

class DifficultyManager {
  constructor() {
    this.currentLevel = 1; // 1-4
    this.points = 0;
    this.maxPoints = 5;
    this.winStreak = 0;
  }

  recordWin() {
    this.winStreak += 1;
    this.points += 1;

    if (this.points >= this.maxPoints) {
      this.points = 0;
      this.levelUp();
    }
  }

  recordLoss() {
    this.winStreak = 0;
  }

  recordDraw() {
    this.winStreak = 0;
  }

  levelUp() {
    if (this.currentLevel < 4) {
      this.currentLevel += 1;
    }
  }

  resetToLevel(level) {
    this.currentLevel = Math.max(1, Math.min(4, level));
    this.points = 0;
    this.winStreak = 0;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getPoints() {
    return this.points;
  }

  getWinStreak() {
    return this.winStreak;
  }

  getDifficultyName() {
    const names = {
      1: 'Easy',
      2: 'Medium',
      3: 'Hard',
      4: 'Impossible'
    };
    return names[this.currentLevel];
  }

  getState() {
    return {
      level: this.currentLevel,
      points: this.points,
      maxPoints: this.maxPoints,
      winStreak: this.winStreak,
      difficultyName: this.getDifficultyName()
    };
  }

  setState(state) {
    this.currentLevel = state.level || 1;
    this.points = state.points || 0;
    this.winStreak = state.winStreak || 0;
  }
}

export default DifficultyManager;
