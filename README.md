# Monument Valley Chess Game

A beautiful, cross-platform chess game with Monument Valley–inspired 3D visuals, featuring both single-player bot battles with progressive difficulty and local 2-player mode.

## Features

### Game Modes
1. **Single-Player vs Bot**
   - 4 difficulty levels: Easy, Medium, Hard, Impossible
   - Progressive difficulty scaling: earn up to 5 points per level to unlock the next
   - Minimax AI with alpha-beta pruning
   - Adjustable search depth (2-5) based on difficulty

2. **Local 2-Player**
   - Play on the same screen against a friend
   - Full chess rules implementation
   - Turn indicator and game state display

### Visual Design
- Monument Valley–inspired isometric perspective
- 3D rendering with Three.js
- Soft lighting and geometric aesthetics
- Smooth piece animations
- Responsive design for web and mobile

### Gameplay Features
- Full chess rules: castling, en passant, pawn promotion, checkmate detection
- Move validation with check detection
- Game statistics tracking (wins, losses, win streaks)
- Local persistence with browser localStorage
- Settings panel for managing progress

## How to Play

### Running Locally
```bash
cd /Users/Kiran/Applications/ChessApp
python3 -m http.server 3000
```
Then open http://localhost:3000 in your browser.

### Game Controls
- Click on a piece to select it (highlighted in green)
- Click on a destination square to move
- Current turn indicator shows whose move it is
- View your stats in the main menu

### Bot Difficulty
- **Easy** (Level 1): 2-move lookahead, basic evaluation
- **Medium** (Level 2): 3-move lookahead, positional awareness
- **Hard** (Level 3): 4-move lookahead, tactical pattern recognition
- **Impossible** (Level 4): 5-move lookahead, complete evaluation

Beat a bot at each level and earn 5 points to unlock the next difficulty!

## Project Structure

```
/src
  /game
    ChessEngine.js         - Core chess rules and move validation
    BotAI.js               - Minimax algorithm with difficulty scaling
    DifficultyManager.js   - Progression system (levels 1-4, points tracking)
    GameController.js      - Main game orchestration
    GameState.js           - Player stats and localStorage persistence
  /3d
    ChessBoardRenderer.js  - Three.js scene setup and rendering
  /styles
    main.css               - Monument Valley–inspired styling
  main.js                  - Application entry point

index.html                 - Main HTML file
package.json              - Project metadata
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Graphics**: Three.js (3D rendering)
- **Storage**: Browser localStorage
- **Deployment**: Web-first (easy deployment to Vercel, Netlify)
- **Mobile**: Capacitor (wrap web app for iOS/Android stores)

## Planned Enhancements

- [ ] Sound effects and background music
- [ ] Move undo/redo functionality
- [ ] Online multiplayer via WebSockets
- [ ] Leaderboards and social features
- [ ] More customization options (themes, piece sets)
- [ ] Chess puzzle mode
- [ ] Opening book integration for bot

## Deployment

### Web Hosting
1. Build: Project is ready to deploy as-is (no build step needed for basic deployment)
2. Deploy to Vercel or Netlify: just push the repository
3. Enable HTTPS for security

### Mobile Apps
1. Install Capacitor: `npm install @capacitor/core @capacitor/cli`
2. Initialize: `npx cap init`
3. Build for iOS: `npx cap open ios` (requires Xcode)
4. Build for Android: `npx cap open android` (requires Android Studio)
5. Submit to App Store and Google Play Store

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT - Feel free to use and modify for personal or commercial projects.

---

Made with ❤️ by Kiran
