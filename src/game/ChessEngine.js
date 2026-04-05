// Simple Chess Engine using standard chess rules
// This is a lightweight implementation without external dependencies

class ChessEngine {
  constructor() {
    this.board = this.initializeBoard();
    this.moveHistory = [];
    this.currentPlayer = 'white';
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    this.enPassantTarget = null;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
  }

  initializeBoard() {
    const board = new Array(8);
    for (let i = 0; i < 8; i++) {
      board[i] = new Array(8).fill(null);
    }

    // Black pieces (top)
    board[0] = [
      { type: 'rook', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'queen', color: 'black' },
      { type: 'king', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'rook', color: 'black' }
    ];

    // Black pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
    }

    // White pawns
    for (let i = 0; i < 8; i++) {
      board[6][i] = { type: 'pawn', color: 'white' };
    }

    // White pieces (bottom)
    board[7] = [
      { type: 'rook', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'queen', color: 'white' },
      { type: 'king', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'rook', color: 'white' }
    ];

    return board;
  }

  // Convert position like "e2" to [row, col]
  notationToCoords(notation) {
    const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(notation[1]);
    return [row, col];
  }

  // Convert [row, col] to notation like "e2"
  coordsToNotation(row, col) {
    return String.fromCharCode('a'.charCodeAt(0) + col) + (8 - row);
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  setPiece(row, col, piece) {
    if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
      this.board[row][col] = piece;
    }
  }

  isValidSquare(row, col) {
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
  }

  getLegalMoves(fromNotation = null) {
    const moves = [];

    if (fromNotation) {
      const [row, col] = this.notationToCoords(fromNotation);
      const piece = this.getPiece(row, col);
      if (!piece || piece.color !== this.currentPlayer) return [];

      const pieceMoves = this.getPieceMoves(row, col);
      for (const [toRow, toCol] of pieceMoves) {
        if (this.isLegalMove(row, col, toRow, toCol)) {
          const toNotation = this.coordsToNotation(toRow, toCol);
          moves.push(fromNotation + toNotation);
        }
      }
      return moves;
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (piece && piece.color === this.currentPlayer) {
          const pieceMoves = this.getPieceMoves(row, col);
          for (const [toRow, toCol] of pieceMoves) {
            if (this.isLegalMove(row, col, toRow, toCol)) {
              const fromNotation = this.coordsToNotation(row, col);
              const toNotation = this.coordsToNotation(toRow, toCol);
              moves.push(fromNotation + toNotation);
            }
          }
        }
      }
    }

    return moves;
  }

  getPieceMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];

    const moves = [];
    const { type, color } = piece;

    switch (type) {
      case 'pawn':
        this.getPawnMoves(row, col, color, moves);
        break;
      case 'knight':
        this.getKnightMoves(row, col, color, moves);
        break;
      case 'bishop':
        this.getBishopMoves(row, col, color, moves);
        break;
      case 'rook':
        this.getRookMoves(row, col, color, moves);
        break;
      case 'queen':
        this.getQueenMoves(row, col, color, moves);
        break;
      case 'king':
        this.getKingMoves(row, col, color, moves);
        break;
    }

    return moves;
  }

  getPawnMoves(row, col, color, moves) {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    const singleForward = row + direction;
    if (this.isValidSquare(singleForward, col) && !this.getPiece(singleForward, col)) {
      moves.push([singleForward, col]);

      const doubleForward = row + 2 * direction;
      if (row === startRow && !this.getPiece(doubleForward, col)) {
        moves.push([doubleForward, col]);
      }
    }

    // Captures
    for (const colOffset of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + colOffset;
      if (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (target && target.color !== color) {
          moves.push([newRow, newCol]);
        }
        // En passant
        if (this.enPassantTarget && this.enPassantTarget[0] === newRow && this.enPassantTarget[1] === newCol) {
          moves.push([newRow, newCol]);
        }
      }
    }
  }

  getKnightMoves(row, col, color, moves) {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [dRow, dCol] of offsets) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (!target || target.color !== color) {
          moves.push([newRow, newCol]);
        }
      }
    }
  }

  getBishopMoves(row, col, color, moves) {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    this.getSlidingMoves(row, col, color, directions, moves);
  }

  getRookMoves(row, col, color, moves) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    this.getSlidingMoves(row, col, color, directions, moves);
  }

  getQueenMoves(row, col, color, moves) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    this.getSlidingMoves(row, col, color, directions, moves);
  }

  getSlidingMoves(row, col, color, directions, moves) {
    for (const [dRow, dCol] of directions) {
      let newRow = row + dRow;
      let newCol = col + dCol;

      while (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (!target) {
          moves.push([newRow, newCol]);
        } else {
          if (target.color !== color) {
            moves.push([newRow, newCol]);
          }
          break;
        }
        newRow += dRow;
        newCol += dCol;
      }
    }
  }

  getKingMoves(row, col, color, moves) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (!target || target.color !== color) {
          moves.push([newRow, newCol]);
        }
      }
    }

    // Castling
    if (row === (color === 'white' ? 7 : 0)) {
      const rights = this.castlingRights[color];
      // Kingside
      if (rights.kingside && !this.getPiece(row, 5) && !this.getPiece(row, 6) && this.isPathSafe(row, 4, row, 6, color)) {
        moves.push([row, 6]);
      }
      // Queenside
      if (rights.queenside && !this.getPiece(row, 1) && !this.getPiece(row, 2) && !this.getPiece(row, 3) && this.isPathSafe(row, 4, row, 2, color)) {
        moves.push([row, 2]);
      }
    }
  }

  isPathSafe(fromRow, fromCol, toRow, toCol, color) {
    for (let col = Math.min(fromCol, toCol); col <= Math.max(fromCol, toCol); col++) {
      if (this.isSquareUnderAttack(fromRow, col, color)) {
        return false;
      }
    }
    return true;
  }

  isSquareUnderAttack(row, col, byColor) {
    const enemyColor = byColor === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.color === enemyColor) {
          const pieceMoves = this.getPieceMoves(r, c);
          for (const [moveRow, moveCol] of pieceMoves) {
            if (moveRow === row && moveCol === col) return true;
          }
        }
      }
    }
    return false;
  }

  isLegalMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.getPiece(fromRow, fromCol);
    const target = this.getPiece(toRow, toCol);

    if (!piece) return false;
    if (target && target.color === piece.color) return false;

    this.makeTemporaryMove(fromRow, fromCol, toRow, toCol);
    const kingRow = this.findKingPosition(piece.color);
    const isLegal = kingRow !== null && !this.isSquareUnderAttack(kingRow[0], kingRow[1], piece.color);
    this.undoTemporaryMove();

    return isLegal;
  }

  makeTemporaryMove(fromRow, fromCol, toRow, toCol) {
    this.boardSnapshot = JSON.parse(JSON.stringify(this.board));
    const piece = this.getPiece(fromRow, fromCol);
    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, null);
  }

  undoTemporaryMove() {
    this.board = this.boardSnapshot;
  }

  findKingPosition(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece(row, col);
        if (piece && piece.type === 'king' && piece.color === color) {
          return [row, col];
        }
      }
    }
    return null;
  }

  makeMove(moveNotation) {
    const [fromRow, fromCol] = this.notationToCoords(moveNotation.slice(0, 2));
    const [toRow, toCol] = this.notationToCoords(moveNotation.slice(2, 4));

    const piece = this.getPiece(fromRow, fromCol);
    if (!piece || !this.isLegalMove(fromRow, fromCol, toRow, toCol)) {
      return false;
    }

    // Handle castling
    if (piece.type === 'king') {
      if (toCol === 6) { // Kingside castling
        const rook = this.getPiece(fromRow, 7);
        this.setPiece(fromRow, 5, rook);
        this.setPiece(fromRow, 7, null);
        this.castlingRights[piece.color].kingside = false;
        this.castlingRights[piece.color].queenside = false;
      } else if (toCol === 2) { // Queenside castling
        const rook = this.getPiece(fromRow, 0);
        this.setPiece(fromRow, 3, rook);
        this.setPiece(fromRow, 0, null);
        this.castlingRights[piece.color].kingside = false;
        this.castlingRights[piece.color].queenside = false;
      } else {
        this.castlingRights[piece.color].kingside = false;
        this.castlingRights[piece.color].queenside = false;
      }
    }

    // Handle rook moves (castling rights)
    if (piece.type === 'rook') {
      if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
      if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
    }

    // Handle en passant capture
    if (piece.type === 'pawn' && this.enPassantTarget && toRow === this.enPassantTarget[0] && toCol === this.enPassantTarget[1]) {
      const captureRow = fromRow;
      this.setPiece(captureRow, toCol, null);
    }

    // Move piece
    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, null);

    // Update en passant target
    this.enPassantTarget = null;
    if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      const direction = piece.color === 'white' ? 1 : -1;
      this.enPassantTarget = [toRow + direction, toCol];
    }

    // Pawn promotion
    if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      piece.type = 'queen'; // Default to queen
    }

    this.moveHistory.push(moveNotation);
    
    // Pawn move or capture resets halfmove clock
    const capturedPiece = this.getPiece(toRow, toCol);
    if (piece.type === 'pawn' || this.moveHistory.length > 1) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock += 1;
    }

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    if (this.currentPlayer === 'white') this.fullmoveNumber += 1;

    return true;
  }

  isCheckmate() {
    return this.isInCheck() && this.getLegalMoves().length === 0;
  }

  isStaleMate() {
    return !this.isInCheck() && this.getLegalMoves().length === 0;
  }

  isDraw() {
    return this.isStaleMate() || this.halfmoveClock >= 100;
  }

  isInCheck() {
    const kingPos = this.findKingPosition(this.currentPlayer);
    if (!kingPos) return false;
    return this.isSquareUnderAttack(kingPos[0], kingPos[1], this.currentPlayer);
  }

  getGameState() {
    return {
      board: JSON.parse(JSON.stringify(this.board)),
      currentPlayer: this.currentPlayer,
      moveHistory: [...this.moveHistory],
      isCheckmate: this.isCheckmate(),
      isStaleMate: this.isStaleMate(),
      isDraw: this.isDraw(),
      isInCheck: this.isInCheck(),
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
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
  }

  copyState() {
    const copy = new ChessEngine();
    copy.board = JSON.parse(JSON.stringify(this.board));
    copy.moveHistory = [...this.moveHistory];
    copy.currentPlayer = this.currentPlayer;
    copy.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    copy.enPassantTarget = this.enPassantTarget ? [...this.enPassantTarget] : null;
    copy.halfmoveClock = this.halfmoveClock;
    copy.fullmoveNumber = this.fullmoveNumber;
    return copy;
  }
}

export default ChessEngine;
