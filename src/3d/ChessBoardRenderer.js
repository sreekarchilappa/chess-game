// 2D Chess Board Renderer — clean HTML/CSS, no Three.js needed

class ChessBoardRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.pieces    = {};   // key -> DOM element
    this.highlights = {};  // key -> DOM element
    this.selectedSquare = null;
    this._build();
  }

  // White pieces use hollow outline symbols, black pieces use filled symbols
  static SYMBOLS = {
    white: { king:'♔', queen:'♕', rook:'♖', bishop:'♗', knight:'♘', pawn:'♙' },
    black: { king:'♚', queen:'♛', rook:'♜', bishop:'♝', knight:'♞', pawn:'♟' }
  };

  _build() {
    this.container.innerHTML = '';

    // Wrapper keeps board square and centered
    const wrap = document.createElement('div');
    wrap.className = 'board-wrap';
    this.container.appendChild(wrap);

    // Rank labels left column
    const ranks = document.createElement('div');
    ranks.className = 'board-ranks';
    for (let r = 8; r >= 1; r--) {
      const lbl = document.createElement('span');
      lbl.textContent = r;
      ranks.appendChild(lbl);
    }
    wrap.appendChild(ranks);

    // Board + file labels
    const right = document.createElement('div');
    right.className = 'board-right';
    wrap.appendChild(right);

    // The 8×8 grid
    const grid = document.createElement('div');
    grid.className = 'board-grid';
    right.appendChild(grid);

    this.squares = {};
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const sq = document.createElement('div');
        const isLight = (row + col) % 2 === 0;
        sq.className = `board-sq ${isLight ? 'sq-light' : 'sq-dark'}`;
        sq.dataset.row = row;
        sq.dataset.col = col;
        grid.appendChild(sq);
        this.squares[`${row}-${col}`] = sq;
      }
    }

    // File labels a–h
    const files = document.createElement('div');
    files.className = 'board-files';
    'abcdefgh'.split('').forEach(f => {
      const lbl = document.createElement('span');
      lbl.textContent = f;
      files.appendChild(lbl);
    });
    right.appendChild(files);
  }

  // Place / remove a piece on a square
  addPiece(row, col, piece) {
    const key = `${row}-${col}`;
    const sq  = this.squares[key];
    if (!sq) return;

    // Clear existing piece span
    const existing = sq.querySelector('.piece');
    if (existing) existing.remove();

    if (!piece) return;

    const span = document.createElement('span');
    span.className = `piece piece-${piece.color}`;
    span.textContent = ChessBoardRenderer.SYMBOLS[piece.color][piece.type];
    sq.appendChild(span);
  }

  // Sync the whole board to engine state
  updateBoard(board) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        this.addPiece(row, col, board[row][col]);
      }
    }
  }

  // Highlight a square (selection = green, legal move = yellow)
  highlightSquare(row, col, color = 0x44ff00) {
    this.clearHighlights();
    const key = `${row}-${col}`;
    const sq  = this.squares[key];
    if (sq) sq.classList.add('sq-selected');
    this.selectedSquare = { row, col };
  }

  highlightLegalMoves(moves, fromNotation) {
    moves.forEach(move => {
      if (move.startsWith(fromNotation)) {
        const toNotation = move.slice(2, 4);
        const col = toNotation.charCodeAt(0) - 97;
        const row = 8 - parseInt(toNotation[1]);
        const sq  = this.squares[`${row}-${col}`];
        if (sq) sq.classList.add('sq-legal');
      }
    });
  }

  clearHighlights() {
    Object.values(this.squares).forEach(sq => {
      sq.classList.remove('sq-selected', 'sq-legal', 'sq-check');
    });
    this.selectedSquare = null;
  }

  highlightCheck(row, col) {
    const sq = this.squares[`${row}-${col}`];
    if (sq) sq.classList.add('sq-check');
  }

  // Click position → {row, col} (called from main.js via click on the container)
  getSquareAtPixel(x, y) {
    const el = document.elementFromPoint(
      this.container.getBoundingClientRect().left + x,
      this.container.getBoundingClientRect().top  + y
    );
    if (!el) return null;
    const sq = el.closest('.board-sq');
    if (!sq) return null;
    return { row: parseInt(sq.dataset.row), col: parseInt(sq.dataset.col) };
  }

  dispose() {
    this.container.innerHTML = '';
  }
}

export default ChessBoardRenderer;
