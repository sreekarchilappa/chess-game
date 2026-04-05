// StockfishBot — wraps Stockfish.js via Web Worker using UCI protocol
// Stockfish is the world's #1 chess engine (3500+ ELO, used by chess.com & lichess)
// Difficulty is controlled by movetime (how long Stockfish thinks in ms)

class StockfishBot {
  constructor() {
    this.worker = null;
    this.ready = false;
    this.resolveMove = null;
    this._init();
  }

  _init() {
    try {
      this.worker = new Worker('/src/stockfish.js');
      this.worker.onmessage = (e) => this._onMessage(e.data);
      this.worker.onerror = (e) => console.error('Stockfish error:', e);
      this.worker.postMessage('uci');
    } catch (err) {
      console.error('Failed to start Stockfish worker:', err);
    }
  }

  _onMessage(msg) {
    if (msg === 'uciok') {
      this.worker.postMessage('isready');
    } else if (msg === 'readyok') {
      this.ready = true;
    } else if (msg.startsWith('bestmove') && this.resolveMove) {
      const parts = msg.split(' ');
      const move = parts[1]; // e.g. "e2e4" or "e7e8q" (promotion)
      const resolve = this.resolveMove;
      this.resolveMove = null;
      resolve(move === '(none)' ? null : move);
    }
  }

  // Get best move for a given FEN position
  // Returns a promise that resolves with the move in UCI notation (e.g. "e2e4")
  getBestMove(fen, movetime) {
    return new Promise((resolve) => {
      if (!this.worker) { resolve(null); return; }

      this.resolveMove = resolve;
      this.worker.postMessage('position fen ' + fen);
      this.worker.postMessage('go movetime ' + movetime);
    });
  }

  // Difficulty → think time in milliseconds
  // Easy: 50ms (barely thinks), Impossible: 3000ms (thinks hard)
  static getMovetime(difficulty) {
    return { 1: 50, 2: 300, 3: 1000, 4: 3000 }[difficulty] || 500;
  }

  destroy() {
    if (this.worker) {
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export default StockfishBot;
