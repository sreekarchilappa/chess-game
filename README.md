# ♟️ Chess Game

A fully playable chess game built with vanilla JavaScript — no frameworks, no internet required. Play against the **Stockfish** engine (the world's #1 chess AI) or challenge a friend locally.

**Live on:** [GitHub](https://github.com/sreekarchilappa/chess-game)

---

## Features

- **vs Bot** — 4 difficulty levels powered by Stockfish
- **2 Player** — local same-screen multiplayer
- **Progressive difficulty** — win 5 games to level up automatically
- **Sound effects** — capture thud, danger chord on check, victory fanfare on checkmate
- **Background music** — chill ambient loop, toggle on/off
- **Stats tracking** — wins, losses, streaks saved in browser
- **Full chess rules** — castling, en passant, promotion, stalemate, 50-move draw

---

## Difficulty Levels

| Level | Stockfish Think Time | Strength |
|-------|---------------------|----------|
| Easy | 50ms | Beginner |
| Medium | 300ms | Intermediate |
| Hard | 1,000ms | Advanced |
| Impossible | 3,000ms | Grandmaster |

---

## Play Now (Browser)

```bash
# Clone the repo
git clone https://github.com/sreekarchilappa/chess-game.git
cd chess-game

# Start local server
python3 -m http.server 3000

# Open in browser
# http://localhost:3000
```

> Requires a local server (not `file://`) because Stockfish runs as a Web Worker.

---

## Tech Stack

| Part | Technology |
|------|-----------|
| Chess engine (rules) | Vanilla JavaScript |
| Bot AI | [Stockfish.js](https://github.com/nmrugg/stockfish.js) via Web Worker |
| Board rendering | HTML/CSS DOM (2D) |
| Sound & music | Web Audio API (no audio files needed) |
| Storage | localStorage |
| Server | Python `http.server` |

---

## Project Structure

```
chess-game/
├── index.html                  # Main HTML
├── src/
│   ├── main.js                 # App entry point, UI, sound
│   ├── ChessBoardRenderer.js   # DOM board, piece rendering, highlights
│   ├── stockfish.js            # Stockfish engine (Web Worker, 1.5MB)
│   ├── styles/
│   │   └── main.css
│   └── game/
│       ├── ChessEngine.js      # Chess rules, FEN generation
│       ├── StockfishBot.js     # Stockfish UCI wrapper
│       ├── GameController.js   # Game flow, move handling
│       ├── DifficultyManager.js # Progressive difficulty (5-point system)
│       └── GameState.js        # localStorage persistence
```

---

## Roadmap

- [ ] Deploy to web (Vercel/Netlify)
- [ ] Mobile apps (iOS & Android via Capacitor)
- [ ] Undo move
- [ ] Move history panel
- [ ] Online multiplayer

---

## Author

**Sreekar Chilappa**

