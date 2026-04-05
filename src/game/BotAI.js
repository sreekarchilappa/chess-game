// Bot AI using Minimax algorithm with alpha-beta pruning
// 4 difficulty levels with varying search depth and evaluation

class BotAI {
  constructor() {
    this.evaluationCache = {};
  }

  // Get the best move for the current position at given difficulty
  getBestMove(gameEngine, difficulty = 1) {
    const depth = this.getSearchDepth(difficulty);
    const legalMoves = gameEngine.getLegalMoves();

    if (legalMoves.length === 0) return null;
    if (legalMoves.length === 1) return legalMoves[0];

    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      const testEngine = gameEngine.copyState();
      testEngine.makeMove(move);

      const score = -this.minimax(testEngine, depth - 1, -Infinity, Infinity, difficulty);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  getSearchDepth(difficulty) {
    const depths = {
      1: 2,
      2: 3,
      3: 4,
      4: 5
    };
    return depths[difficulty] || 2;
  }

  minimax(gameEngine, depth, alpha, beta, difficulty) {
    const state = gameEngine.getGameState();

    // Terminal node
    if (depth === 0 || state.isCheckmate || state.isDraw) {
      return this.evaluatePosition(gameEngine, state, difficulty);
    }

    const legalMoves = state.legalMoves;
    if (legalMoves.length === 0) {
      return this.evaluatePosition(gameEngine, state, difficulty);
    }

    const isMaximizing = gameEngine.currentPlayer === 'black';

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        const testEngine = gameEngine.copyState();
        testEngine.makeMove(move);
        const evalScore = this.minimax(testEngine, depth - 1, alpha, beta, difficulty);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Prune
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        const testEngine = gameEngine.copyState();
        testEngine.makeMove(move);
        const evalScore = this.minimax(testEngine, depth - 1, alpha, beta, difficulty);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Prune
      }
      return minEval;
    }
  }

  evaluatePosition(gameEngine, state, difficulty) {
    // Checkmate: huge bonus for finding it
    if (state.isCheckmate) {
      return gameEngine.currentPlayer === 'white' ? -10000 : 10000;
    }

    // Draw: neutral
    if (state.isDraw) {
      return 0;
    }

    let score = 0;

    // Material evaluation
    const materialScore = this.evaluateMaterial(gameEngine.board);
    score += materialScore;

    // Positional evaluation (only for higher difficulties)
    if (difficulty >= 2) {
      const positionalScore = this.evaluatePosition_v2(gameEngine.board, gameEngine.currentPlayer);
      score += positionalScore * 0.5;
    }

    // Tactical patterns (only for harder difficulties)
    if (difficulty >= 3) {
      const tacticalScore = this.evaluateTactics(gameEngine, gameEngine.currentPlayer);
      score += tacticalScore * 0.3;
    }

    return score;
  }

  evaluateMaterial(board) {
    const pieceValues = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 0
    };

    let score = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = pieceValues[piece.type];
          score += piece.color === 'black' ? value : -value;
        }
      }
    }
    return score;
  }

  evaluatePosition_v2(board, currentPlayer) {
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        let pieceScore = 0;

        // Encourage center control
        const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
        pieceScore += (7 - centerDistance) * 0.1;

        // Pawn advancement
        if (piece.type === 'pawn') {
          const advancementBonus = piece.color === 'black' ? (row * 0.2) : ((7 - row) * 0.2);
          pieceScore += advancementBonus;
        }

        // Piece safety (basic)
        if (piece.type !== 'king' && piece.type !== 'pawn') {
          pieceScore += 0.5; // Encourage piece activity
        }

        score += piece.color === 'black' ? pieceScore : -pieceScore;
      }
    }

    return score;
  }

  evaluateTactics(gameEngine, currentPlayer) {
    let score = 0;

    // Attacking opponent pieces
    const legalMoves = gameEngine.getLegalMoves();
    for (const move of legalMoves) {
      const toRow = 8 - parseInt(move.slice(3, 4));
      const toCol = move.charCodeAt(2) - 'a'.charCodeAt(0);
      const target = gameEngine.getPiece(toRow, toCol);

      if (target && target.color !== currentPlayer) {
        const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
        score += pieceValues[target.type] * 0.5;
      }
    }

    return score;
  }

  clearCache() {
    this.evaluationCache = {};
  }
}

export default BotAI;
