// Chess Engine - Standard rules implementation

class ChessEngine {
  constructor() {
    this.board = this.initializeBoard();
    this.moveHistory = [];
    this.currentPlayer = 'white';
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    this.enPassantTarget = null; // [row, col] of en passant capture square
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
  }

  initializeBoard() {
    const board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    const backRank = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
    board[0] = backRank.map(type => ({ type, color: 'black' }));
    board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));
    board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));
    board[7] = backRank.map(type => ({ type, color: 'white' }));
    return board;
  }

  notationToCoords(notation) {
    const col = notation.charCodeAt(0) - 97; // 'a'=0
    const row = 8 - parseInt(notation[1]);
    return [row, col];
  }

  coordsToNotation(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  isValid(row, col) {
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
  }

  // ── Attack detection (NO recursion — separate from move generation) ────────
  // Returns true if (row, col) is attacked by any piece of attackerColor.
  // Uses raw board state, no legality checks.
  isAttackedBy(row, col, attackerColor) {
    // Pawn attacks
    const pawnDir = attackerColor === 'white' ? 1 : -1; // white pawns attack upward (row-1), so attacking square is below them
    // A white pawn on (row+1, col±1) attacks (row, col)
    for (const dc of [-1, 1]) {
      const pr = row + pawnDir; // row where attacker pawn would be
      const pc = col + dc;
      if (this.isValid(pr, pc)) {
        const p = this.board[pr][pc];
        if (p && p.type === 'pawn' && p.color === attackerColor) return true;
      }
    }

    // Knight attacks
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = row + dr, nc = col + dc;
      if (this.isValid(nr, nc)) {
        const p = this.board[nr][nc];
        if (p && p.type === 'knight' && p.color === attackerColor) return true;
      }
    }

    // King attacks (1 square in any direction)
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = row + dr, nc = col + dc;
      if (this.isValid(nr, nc)) {
        const p = this.board[nr][nc];
        if (p && p.type === 'king' && p.color === attackerColor) return true;
      }
    }

    // Sliding pieces: bishop / queen (diagonals)
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let nr = row + dr, nc = col + dc;
      while (this.isValid(nr, nc)) {
        const p = this.board[nr][nc];
        if (p) {
          if (p.color === attackerColor && (p.type === 'bishop' || p.type === 'queen')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }

    // Sliding pieces: rook / queen (straights)
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let nr = row + dr, nc = col + dc;
      while (this.isValid(nr, nc)) {
        const p = this.board[nr][nc];
        if (p) {
          if (p.color === attackerColor && (p.type === 'rook' || p.type === 'queen')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }

    return false;
  }

  isInCheck(color) {
    const enemy = color === 'white' ? 'black' : 'white';
    // Find king
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type === 'king' && p.color === color) {
          return this.isAttackedBy(r, c, enemy);
        }
      }
    }
    return false;
  }

  // ── Pseudo-legal move generation (no check validation) ────────────────────
  _pseudoMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    const { type, color } = piece;
    const moves = [];

    if (type === 'pawn') {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      // Forward
      if (this.isValid(row+dir, col) && !this.board[row+dir][col]) {
        moves.push([row+dir, col]);
        if (row === startRow && !this.board[row+2*dir][col]) {
          moves.push([row+2*dir, col]);
        }
      }
      // Diagonal captures
      for (const dc of [-1, 1]) {
        const nr = row+dir, nc = col+dc;
        if (this.isValid(nr, nc)) {
          const t = this.board[nr][nc];
          if (t && t.color !== color) moves.push([nr, nc]);
          // En passant
          if (this.enPassantTarget && this.enPassantTarget[0] === nr && this.enPassantTarget[1] === nc) {
            moves.push([nr, nc]);
          }
        }
      }

    } else if (type === 'knight') {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = row+dr, nc = col+dc;
        if (this.isValid(nr, nc)) {
          const t = this.board[nr][nc];
          if (!t || t.color !== color) moves.push([nr, nc]);
        }
      }

    } else if (type === 'king') {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = row+dr, nc = col+dc;
        if (this.isValid(nr, nc)) {
          const t = this.board[nr][nc];
          if (!t || t.color !== color) moves.push([nr, nc]);
        }
      }
      // Castling is handled separately in getLegalMoves

    } else {
      // Sliding pieces
      const dirs = type === 'bishop' ? [[-1,-1],[-1,1],[1,-1],[1,1]]
                 : type === 'rook'   ? [[-1,0],[1,0],[0,-1],[0,1]]
                 :                     [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of dirs) {
        let nr = row+dr, nc = col+dc;
        while (this.isValid(nr, nc)) {
          const t = this.board[nr][nc];
          if (!t) { moves.push([nr, nc]); nr += dr; nc += dc; }
          else { if (t.color !== color) moves.push([nr, nc]); break; }
        }
      }
    }

    return moves;
  }

  // ── Apply / undo move on board for legality testing ───────────────────────
  _apply(fromRow, fromCol, toRow, toCol) {
    const piece    = this.board[fromRow][fromCol];
    const captured = this.board[toRow][toCol];
    this.board[toRow][toCol]     = piece;
    this.board[fromRow][fromCol] = null;

    // En passant capture
    let epRow = null, epPiece = null;
    if (piece && piece.type === 'pawn' &&
        this.enPassantTarget &&
        toRow === this.enPassantTarget[0] && toCol === this.enPassantTarget[1]) {
      epRow = fromRow; // captured pawn sits on fromRow, same col as toCol
      epPiece = this.board[epRow][toCol];
      this.board[epRow][toCol] = null;
    }

    return { fromRow, fromCol, toRow, toCol, piece, captured, epRow, epPiece };
  }

  _undo(snap) {
    const { fromRow, fromCol, toRow, toCol, piece, captured, epRow, epPiece } = snap;
    this.board[fromRow][fromCol] = piece;
    this.board[toRow][toCol]     = captured;
    if (epRow !== null) this.board[epRow][toCol] = epPiece;
  }

  _isMoveLegal(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    if (!piece) return false;
    const snap = this._apply(fromRow, fromCol, toRow, toCol);
    const safe = !this.isInCheck(piece.color);
    this._undo(snap);
    return safe;
  }

  // ── Full legal move list ──────────────────────────────────────────────────
  getLegalMoves(fromNotation = null) {
    const results = [];

    const processSquare = (r, c) => {
      const piece = this.board[r][c];
      if (!piece || piece.color !== this.currentPlayer) return;

      // Regular moves
      for (const [tr, tc] of this._pseudoMoves(r, c)) {
        if (this._isMoveLegal(r, c, tr, tc)) {
          results.push(this.coordsToNotation(r, c) + this.coordsToNotation(tr, tc));
        }
      }

      // Castling
      if (piece.type === 'king') {
        for (const mv of this._castlingMoves(r, c, piece.color)) {
          results.push(mv);
        }
      }
    };

    if (fromNotation) {
      const [r, c] = this.notationToCoords(fromNotation);
      processSquare(r, c);
    } else {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) processSquare(r, c);
    }

    return results;
  }

  _castlingMoves(row, col, color) {
    const moves = [];
    const kingRow = color === 'white' ? 7 : 0;
    if (row !== kingRow || col !== 4) return moves;
    if (this.isInCheck(color)) return moves; // Cannot castle while in check

    const enemy = color === 'white' ? 'black' : 'white';
    const rights = this.castlingRights[color];

    // Kingside: squares 5 and 6 empty and not attacked, rook at 7
    if (rights.kingside &&
        !this.board[kingRow][5] && !this.board[kingRow][6] &&
        this.board[kingRow][7]?.type === 'rook' &&
        !this.isAttackedBy(kingRow, 5, enemy) &&
        !this.isAttackedBy(kingRow, 6, enemy)) {
      moves.push(this.coordsToNotation(row, col) + this.coordsToNotation(kingRow, 6));
    }

    // Queenside: squares 1, 2, 3 empty; 3 and 2 not attacked; rook at 0
    if (rights.queenside &&
        !this.board[kingRow][1] && !this.board[kingRow][2] && !this.board[kingRow][3] &&
        this.board[kingRow][0]?.type === 'rook' &&
        !this.isAttackedBy(kingRow, 3, enemy) &&
        !this.isAttackedBy(kingRow, 2, enemy)) {
      moves.push(this.coordsToNotation(row, col) + this.coordsToNotation(kingRow, 2));
    }

    return moves;
  }

  // ── Make a move ────────────────────────────────────────────────────────────
  makeMove(moveNotation) {
    const [fromRow, fromCol] = this.notationToCoords(moveNotation.slice(0, 2));
    const [toRow, toCol]     = this.notationToCoords(moveNotation.slice(2, 4));

    const piece = this.board[fromRow][fromCol];
    if (!piece || piece.color !== this.currentPlayer) return false;

    // Check legality
    const legal = this.getLegalMoves(moveNotation.slice(0, 2));
    if (!legal.includes(moveNotation)) return false;

    const captured = this.board[toRow][toCol];

    // Castling: move rook
    if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
      if (toCol === 6) { // Kingside
        this.board[fromRow][5] = this.board[fromRow][7];
        this.board[fromRow][7] = null;
      } else { // Queenside
        this.board[fromRow][3] = this.board[fromRow][0];
        this.board[fromRow][0] = null;
      }
    }

    // En passant: remove captured pawn
    if (piece.type === 'pawn' && this.enPassantTarget &&
        toRow === this.enPassantTarget[0] && toCol === this.enPassantTarget[1]) {
      this.board[fromRow][toCol] = null;
    }

    // Move piece
    this.board[toRow][toCol]     = piece;
    this.board[fromRow][fromCol] = null;

    // Pawn promotion → queen
    if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      this.board[toRow][toCol] = { type: 'queen', color: piece.color };
    }

    // Update castling rights
    if (piece.type === 'king') {
      this.castlingRights[piece.color] = { kingside: false, queenside: false };
    }
    if (piece.type === 'rook') {
      if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
      if (fromCol === 7) this.castlingRights[piece.color].kingside  = false;
    }
    // If a rook is captured, revoke its side's castling
    if (captured && captured.type === 'rook') {
      const cr = this.castlingRights[captured.color];
      if (toCol === 0) cr.queenside = false;
      if (toCol === 7) cr.kingside  = false;
    }

    // En passant target for next move
    this.enPassantTarget = null;
    if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      const dir = piece.color === 'white' ? 1 : -1;
      this.enPassantTarget = [toRow + dir, toCol];
    }

    // Halfmove clock
    if (piece.type === 'pawn' || captured) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    this.moveHistory.push(moveNotation);
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    if (this.currentPlayer === 'white') this.fullmoveNumber++;

    return true;
  }

  isCheckmate() {
    return this.isInCheck(this.currentPlayer) && this.getLegalMoves().length === 0;
  }

  isStaleMate() {
    return !this.isInCheck(this.currentPlayer) && this.getLegalMoves().length === 0;
  }

  isDraw() {
    return this.isStaleMate() || this.halfmoveClock >= 100;
  }

  getGameState() {
    return {
      board: this.board.map(row => row.map(p => p ? { ...p } : null)),
      currentPlayer: this.currentPlayer,
      moveHistory: [...this.moveHistory],
      isCheckmate: this.isCheckmate(),
      isStaleMate: this.isStaleMate(),
      isDraw: this.isDraw(),
      isInCheck: this.isInCheck(this.currentPlayer),
      legalMoves: this.getLegalMoves()
    };
  }

  resetGame() {
    this.board = this.initializeBoard();
    this.moveHistory = [];
    this.currentPlayer = 'white';
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    this.enPassantTarget = null;
    this.halfmoveClock   = 0;
    this.fullmoveNumber  = 1;
  }

  copyState() {
    const copy = new ChessEngine();
    copy.board = this.board.map(row => row.map(p => p ? { ...p } : null));
    copy.moveHistory = [...this.moveHistory];
    copy.currentPlayer = this.currentPlayer;
    copy.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    copy.enPassantTarget = this.enPassantTarget ? [...this.enPassantTarget] : null;
    copy.halfmoveClock   = this.halfmoveClock;
    copy.fullmoveNumber  = this.fullmoveNumber;
    return copy;
  }
}

export default ChessEngine;
