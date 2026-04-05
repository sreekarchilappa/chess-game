// Bot AI — Negamax with alpha-beta pruning + quiescence search
// Quiescence search is the key: after depth runs out, keep searching captures
// until the position is "quiet" — eliminates the horizon effect that causes blunders.

class BotAI {
  constructor() {
    this.VALS = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 };

    // Piece-square tables (from each piece's own color perspective, row 0 = own back rank)
    this.PST = {
      pawn: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [78, 83, 86, 73, 102, 82, 85, 90],
        [ 7, 29, 21, 44, 40, 31, 44,  7],
        [-17,  16,  -2, 15, 14,  0, 15,-13],
        [-26,  3,  10, 9,  6,  1,  0,-23],
        [-22,  9,  5,-11,-10,-2,  3,-19],
        [-31,  8, -7,-37,-36,-14,  3,-31],
        [  0,  0,  0,  0,  0,  0,  0,  0]
      ],
      knight: [
        [-66,-53,-75,-75,-10,-55,-58,-70],
        [ -3,-6, 100,-36,  4,62,  -4,-14],
        [ 10, 67,  1, 74, 73,27, 62, -2],
        [ 24, 24, 45, 37, 33,41, 25, 17],
        [ -1, 5,  31, 21, 22,35,  2,  0],
        [-18, 10,  13, 22, 18,15, 11,-14],
        [-23,-15,   2,  0,  2, 0,-23,-20],
        [-74,-23, -26,-24,-19,-35,-22,-69]
      ],
      bishop: [
        [-59,-78,-82,-76,-23,-107,-37,-50],
        [-11, 20,  35,-42,-39, 31, 2,-22],
        [ -9, 39, -32, 41, 52,-10, 28,-14],
        [ 25, 17,  20, 34, 26, 25, 15, 10],
        [ 13, 10,  17, 23, 17, 16,  0,  7],
        [ 14, 25,  24, 15, 8, 25, 20, 15],
        [ 19, 20,  11,  6,  7,  6, 20, 16],
        [ -7, 2, -15,-12,-14,-15,-10,-10]
      ],
      rook: [
        [ 35, 29, 33,  4, 37, 33, 56, 50],
        [ 55, 29, 56, 67, 55, 62, 34, 60],
        [ 19, 35, 28, 33, 45, 27, 25, 15],
        [  0,  5, 16, 13, 18, -4, -9, -6],
        [-28,-35,-16,-21,-13,-29,-46,-30],
        [-42,-28,-42,-25,-25,-35,-26,-46],
        [-53,-38,-31,-26,-29,-43,-44,-53],
        [-30,-24,-18,  5, -2,-18,-31,-32]
      ],
      queen: [
        [  6,  1, -8,-104,69, 24, 88, 26],
        [ 14, 32, 60, -10, 20, 76, 57, 24],
        [ -2, 43, 32, 60, 72, 63, 43,  2],
        [  1,-16, 22, 17, 25, 20, -13,-6],
        [-14,-15,  -2, -5,  -1,-10,-20,-22],
        [-30, -6, -13,-11,-16,-11,-16,-27],
        [-36,-18,   0,-19,-15,-15,-21,-38],
        [-39,-30,-31,-13,-31,-36,-34,-42]
      ],
      king: [
        [  4, 54, 47,-99,-99, 60, 83,-62],
        [-32, 10,  55,  56, 56, 55, 10, 3],
        [-62, 12, -57,  44,-67, 28, 37,-31],
        [-55,  50,  11,  -4,-19, 13,  0,-49],
        [-55,-43,-52,-28,-51,-47,  -8,-50],
        [-47,-42,-43,-79,-64,-32,-29,-32],
        [ -4,-10,-42,-44,-44,-38,-13,-47],
        [-17, -20,-12, 6, -27,  -30,  22,  0]
      ]
    };
  }

  getBestMove(engine, difficulty = 1) {
    const legalMoves = engine.getLegalMoves();
    if (legalMoves.length === 0) return null;
    if (legalMoves.length === 1) return legalMoves[0];

    // Depths per level — quiescence search extends each further on captures
    const depths = { 1: 2, 2: 3, 3: 4, 4: 5 };
    const depth = depths[difficulty] || 5;

    const ordered = this._orderMoves(engine, legalMoves);
    let bestMove = ordered[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of ordered) {
      const copy = engine.copyState();
      copy.makeMove(move);
      const score = -this._negamax(copy, depth - 1, -beta, -alpha);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    }
    return bestMove;
  }

  _negamax(engine, depth, alpha, beta) {
    const state = engine.getGameState();
    if (state.isCheckmate) return -100000 - depth; // faster mate = better
    if (state.isDraw) return 0;

    if (depth === 0) {
      // Drop into quiescence search instead of returning static eval
      return this._quiescence(engine, alpha, beta, 6);
    }

    const moves = this._orderMoves(engine, state.legalMoves);
    let best = -Infinity;

    for (const move of moves) {
      const copy = engine.copyState();
      copy.makeMove(move);
      const score = -this._negamax(copy, depth - 1, -beta, -alpha);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break; // beta cutoff
    }
    return best;
  }

  // Quiescence search: only look at captures until position is quiet
  // This eliminates the "horizon effect" — bot won't move a piece somewhere it gets taken
  _quiescence(engine, alpha, beta, maxDepth) {
    const standPat = this._evaluate(engine);
    if (maxDepth === 0) return standPat;
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const captures = this._getCaptureMoves(engine);
    for (const move of captures) {
      const copy = engine.copyState();
      copy.makeMove(move);
      const score = -this._quiescence(copy, -beta, -alpha, maxDepth - 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  _getCaptureMoves(engine) {
    const all = engine.getLegalMoves();
    const captures = all.filter(m => {
      const [r, c] = engine.notationToCoords(m.slice(2, 4));
      return engine.getPiece(r, c) !== null;
    });
    return this._orderMoves(engine, captures);
  }

  // MVV-LVA move ordering: captures sorted by (victim value - attacker value)
  // Quiet moves ordered by piece-square table improvement
  _orderMoves(engine, moves) {
    return [...moves].sort((a, b) => {
      return this._moveScore(engine, b) - this._moveScore(engine, a);
    });
  }

  _moveScore(engine, move) {
    const [fromR, fromC] = engine.notationToCoords(move.slice(0, 2));
    const [toR, toC] = engine.notationToCoords(move.slice(2, 4));
    const attacker = engine.getPiece(fromR, fromC);
    const victim = engine.getPiece(toR, toC);
    if (victim) {
      // Captures: high-value victim taken by low-value attacker scores highest
      return this.VALS[victim.type] * 10 - this.VALS[attacker.type];
    }
    // Quiet moves: score by pst improvement
    return 0;
  }

  _evaluate(engine) {
    let score = 0;
    const current = engine.currentPlayer;
    const enemy = current === 'white' ? 'black' : 'white';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = engine.board[row][col];
        if (!piece) continue;

        const material = this.VALS[piece.type];
        // PST: flip row for white (row 7 = white's back rank = index 0 in table)
        const pstRow = piece.color === current ? (7 - row) : row;
        const positional = this.PST[piece.type]?.[pstRow]?.[col] ?? 0;

        if (piece.color === current) {
          score += material + positional;
        } else {
          score -= material + positional;
        }
      }
    }

    // Mobility bonus: more legal moves = better position
    const myMoves = engine.getLegalMoves().length;
    score += myMoves * 5;

    // King safety: penalize open files near king
    score += this._kingUnsafetyPenalty(engine, current) * -1;
    score += this._kingUnsafetyPenalty(engine, enemy);

    return score;
  }

  _kingUnsafetyPenalty(engine, color) {
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = engine.board[r][c];
        if (p && p.type === 'king' && p.color === color) { kingRow = r; kingCol = c; }
      }
    }
    if (kingRow === -1) return 0;

    let penalty = 0;
    // Check files adjacent to king for missing pawns (open file = danger)
    for (let c = Math.max(0, kingCol - 1); c <= Math.min(7, kingCol + 1); c++) {
      let hasPawn = false;
      for (let r = 0; r < 8; r++) {
        const p = engine.board[r][c];
        if (p && p.type === 'pawn' && p.color === color) { hasPawn = true; break; }
      }
      if (!hasPawn) penalty += 20;
    }
    return penalty;
  }
}

export default BotAI;

  constructor() {
    // Piece-square tables — from Black's perspective (row 0 = Black's back rank)
    // White mirrors these vertically
    this.PST = {
      pawn: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
      ],
      knight: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
      ],
      bishop: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
      ],
      rook: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [ 0,  0,  0,  5,  5,  0,  0,  0]
      ],
      queen: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
      ],
      king: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
      ]
    };
  }

  getBestMove(engine, difficulty = 1) {
    const legalMoves = engine.getLegalMoves();
    if (legalMoves.length === 0) return null;
    if (legalMoves.length === 1) return legalMoves[0];

    // All levels use full strength — depth scales 3→4→5→6
    const depths = { 1: 3, 2: 4, 3: 5, 4: 6 };
    const depth = depths[difficulty] || 6;
    return this._minimaxMove(engine, legalMoves, depth);
  }

  // Easy: 85% random, 15% takes a free capture if available
  _easyMove(engine, legalMoves) {
    if (Math.random() < 0.85) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    const captures = this._getCaptures(engine, legalMoves);
    if (captures.length > 0) return captures[Math.floor(Math.random() * captures.length)];
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Medium: 40% random, otherwise picks best capture or shallow depth-1 search
  _mediumMove(engine, legalMoves) {
    if (Math.random() < 0.40) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    // Prefer captures by highest-value target
    const captures = this._getCaptures(engine, legalMoves);
    if (captures.length > 0) {
      captures.sort((a, b) => this._captureValue(engine, b) - this._captureValue(engine, a));
      // Still make a mistake 25% of the time even when capturing
      if (Math.random() < 0.25) return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return captures[0];
    }
    // Depth-1 search, no positional understanding
    return this._minimaxMove(engine, legalMoves, 1);
  }

  _getCaptures(engine, moves) {
    return moves.filter(m => {
      const [toRow, toCol] = engine.notationToCoords(m.slice(2, 4));
      return engine.getPiece(toRow, toCol) !== null;
    });
  }

  _captureValue(engine, move) {
    const vals = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
    const [toRow, toCol] = engine.notationToCoords(move.slice(2, 4));
    const target = engine.getPiece(toRow, toCol);
    return target ? vals[target.type] : 0;
  }

  _minimaxMove(engine, legalMoves, depth) {
    const ordered = this._orderMoves(engine, legalMoves);
    let bestMove = ordered[0];
    let bestScore = -Infinity;

    for (const move of ordered) {
      const copy = engine.copyState();
      copy.makeMove(move);
      const score = -this._minimax(copy, depth - 1, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  _minimax(engine, depth, alpha, beta) {
    const state = engine.getGameState();
    if (state.isCheckmate) return engine.currentPlayer === 'white' ? -100000 : 100000;
    if (state.isDraw) return 0;
    if (depth === 0) return this._evaluate(engine);

    const moves = this._orderMoves(engine, state.legalMoves);
    let best = -Infinity;

    for (const move of moves) {
      const copy = engine.copyState();
      copy.makeMove(move);
      const score = -this._minimax(copy, depth - 1, -beta, -alpha);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return best;
  }

  // Order moves: captures first (MVV-LVA), then checks, then rest
  _orderMoves(engine, moves) {
    const vals = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
    return [...moves].sort((a, b) => {
      const [aToR, aToC] = engine.notationToCoords(a.slice(2, 4));
      const [bToR, bToC] = engine.notationToCoords(b.slice(2, 4));
      const aTarget = engine.getPiece(aToR, aToC);
      const bTarget = engine.getPiece(bToR, bToC);
      const aVal = aTarget ? vals[aTarget.type] * 10 : 0;
      const bVal = bTarget ? vals[bTarget.type] * 10 : 0;
      return bVal - aVal;
    });
  }

  _evaluate(engine) {
    const vals = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 };
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = engine.board[row][col];
        if (!piece) continue;

        const material = vals[piece.type];
        const pstRow = piece.color === 'black' ? row : 7 - row;
        const positional = this.PST[piece.type][pstRow][col];

        if (piece.color === 'black') {
          score += material + positional;
        } else {
          score -= material + positional;
        }
      }
    }

    return score;
  }
}

export default BotAI;

