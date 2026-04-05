// Configuration file for game settings
// Can be extended for more customization options

export const gameConfig = {
  // Difficulty levels and search depth
  difficulty: {
    1: {
      name: 'Easy',
      depth: 2,
      description: 'Great for learning'
    },
    2: {
      name: 'Medium',
      depth: 3,
      description: 'A fair challenge'
    },
    3: {
      name: 'Hard',
      depth: 4,
      description: 'Very challenging'
    },
    4: {
      name: 'Impossible',
      depth: 5,
      description: 'Face the ultimate challenge'
    }
  },

  // Points system
  points: {
    maxPerLevel: 5,
    resetOnLevelUp: true
  },

  // Visual settings
  visual: {
    boardSize: 8,
    pieceSize: 0.3,
    squareSize: 0.9,
    backgroundColor: 0xf5e6d3,
    lightSquareColor: 0xe8d4c0,
    darkSquareColor: 0xc9a878,
    pieceWhiteColor: 0xf5f5f5,
    pieceBlackColor: 0x333333
  },

  // Animation settings
  animation: {
    pieceMoveTime: 0.5, // seconds
    highlightOpacity: 0.3
  },

  // Keyboard shortcuts (future enhancement)
  shortcuts: {
    undo: 'ctrl+z',
    resign: 'ctrl+r',
    menu: 'escape'
  }
};

export default gameConfig;
