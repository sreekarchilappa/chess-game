# Quick Start Guide

## 🎮 Play Locally (Right Now!)

```bash
cd /Users/Kiran/Applications/ChessApp
python3 -m http.server 3000
```

Then open **http://localhost:3000** in your browser.

## 📖 How to Play

### Main Menu
- **Play vs Bot**: Challenge the computer at 4 difficulty levels
- **2-Player Local**: Play with a friend on the same screen
- **Settings**: View your progress and reset stats

### Game Controls
1. Click on a piece to select it (glows green)
2. Click on a destination square to move
3. The game validates moves automatically
4. Your stats are saved automatically

### Bot Difficulty
- **Easy (Level 1)**: Perfect for learning
- **Medium (Level 2)**: Fair challenge
- **Hard (Level 3)**: Very tough
- **Impossible (Level 4)**: Master difficulty

**How to Unlock**: Win 5 games at each level to earn 5 points and unlock the next difficulty!

## 🏠 Project Overview

```
ChessApp/
├── index.html              # Open this in browser
├── src/
│   ├── main.js             # App logic
│   ├── game/               # Chess engine & AI
│   ├── 3d/                 # 3D graphics (Three.js)
│   └── styles/             # Monument Valley styling
└── README.md               # Full documentation
```

## 🚀 Deploy to Web (Next Steps)

### Option 1: Vercel (Recommended - 1 minute)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Your game will be live at a custom URL!
```

### Option 2: Netlify (Also easy - 1 minute)
```bash
# Just drag and drop the ChessApp folder to https://app.netlify.com
```

### Option 3: Custom Domain
1. Deploy to Vercel or Netlify (above)
2. Buy a domain (Namecheap, GoDaddy, etc.)
3. Point domain to your hosting
4. Done! ✅

## 📱 Deploy to App Stores (Later)

See `DEPLOYMENT.md` for detailed iOS and Android instructions.

## ✨ Features Built

✅ Full chess rules (castling, en passant, promotion)
✅ Smart bot with 4 difficulty levels
✅ Progressive difficulty that gets harder as you win
✅ Beautiful 3D board (Monument Valley style)
✅ 2-player local multiplayer
✅ Stats tracking (wins, streaks, points)
✅ Auto-save progress
✅ Mobile-friendly design
✅ Web + App Store ready

## 🎯 Next Steps

1. **Try it out**: Open http://localhost:3000
2. **Play some games**: Get familiar with the game
3. **Deploy online**: Follow deployment steps
4. **Share with friends**: Send them your domain link
5. **Enjoy!** 🎉

## 📧 Need Help?

Check these files:
- `README.md` - Full feature documentation
- `DEPLOYMENT.md` - How to deploy online
- `IMPLEMENTATION_SUMMARY.md` - Technical details

---

**The game is fully playable right now. Start http server and enjoy! 🎮**
