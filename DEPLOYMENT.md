# Deployment Guide

## Quick Start (Local Testing)

```bash
cd /Users/Kiran/Applications/ChessApp
python3 -m http.server 3000
# Open http://localhost:3000 in your browser
```

## Web Deployment (Vercel)

### Option 1: Using Vercel CLI
```bash
npm install -g vercel
vercel
# Follow prompts to connect GitHub repo and deploy
```

### Option 2: GitHub + Vercel Dashboard
1. Push code to GitHub: `git push origin main`
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"
6. Custom domain: Go to Project Settings → Domains → Add Domain

## Web Deployment (Netlify)

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

Or connect GitHub:
1. Go to https://netlify.com
2. Click "New site from Git"
3. Connect GitHub repository
4. Deploy

## Web Deployment (GitHub Pages)

GitHub Pages requires a build step. For now, use Vercel or Netlify above (they handle static files perfectly).

## Custom Domain Setup

After deploying to Vercel/Netlify:

1. **Buy domain** from Namecheap, GoDaddy, Google Domains, etc.
2. **Point domain to hosting**:
   - Vercel: Add custom domain in Project Settings → Domains
   - Netlify: Add custom domain in Domain Settings
3. **Update DNS records** as instructed by your hosting provider

## Mobile App Deployment (iOS & Android)

### Prerequisites
- Install Node.js and npm
- Install Xcode (iOS) and Android Studio (Android)

### Setup Capacitor

```bash
cd /Users/Kiran/Applications/ChessApp

# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add ios
npx cap add android
```

### iOS App Store Submission

```bash
# Build and open Xcode
npx cap open ios

# In Xcode:
# 1. Select target device or simulator
# 2. Product → Build (Cmd + B)
# 3. Product → Run (Cmd + R) to test on simulator
# 4. When ready: Product → Archive
# 5. Organizer window opens → Distribute App
# 6. Select "App Store Connect" → Follow submission wizard
```

**App Store Requirements:**
- Apple Developer Account ($99/year)
- App name, description, keywords
- App icon (1024x1024 PNG)
- Screenshots (multiple sizes)
- Privacy policy URL

### Android Play Store Submission

```bash
# Build and open Android Studio
npx cap open android

# In Android Studio:
# 1. Build → Make Project
# 2. Build → Generate Signed APK/Bundle
# 3. Create/select signing key
# 4. Build release APK or AAB (bundle)
```

**Play Store Requirements:**
- Google Play Developer Account ($25 one-time)
- App name, description, keywords
- App icon (512x512 PNG)
- Screenshots (multiple sizes)
- Feature graphic (1024x500 PNG)
- Privacy policy URL

## Environment Setup for App Stores

### iOS
```bash
# Install Ruby gems (for iOS build tools)
gem install cocoapods

# Or use Homebrew
brew install cocoapods
```

### Android
```bash
# Download Android SDK if not already installed
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## Publishing Checklist

### Before Launch
- [ ] Test game thoroughly on web
- [ ] Test on actual mobile devices (iOS and Android)
- [ ] Check app performance (FPS, load time)
- [ ] Ensure all features work correctly
- [ ] Test offline gameplay (localStorage)
- [ ] Verify responsive design on all screen sizes

### Web Launch
- [ ] Domain registered
- [ ] Deployed to Vercel/Netlify
- [ ] DNS configured
- [ ] HTTPS enabled (automatic with Vercel/Netlify)
- [ ] Test on multiple browsers (Chrome, Safari, Firefox, Edge)

### App Store Launch
- [ ] App name and description finalized
- [ ] All assets created (icons, screenshots, graphics)
- [ ] Privacy policy published
- [ ] Terms of Service created (optional but recommended)
- [ ] App tested on physical devices
- [ ] Build number/version updated in config
- [ ] Submitted for review

## Post-Launch

### Monitoring
- Use analytics to track user engagement
- Monitor crash reports in App Store/Play Store
- Collect user feedback

### Updates
```bash
# For web (automatic deployment)
git push origin main

# For mobile apps
npx cap sync
npx cap open ios  # or android
# Rebuild and re-submit to app stores
```

## Useful Resources

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Capacitor Docs**: https://capacitorjs.com/docs
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Chess.js Alternatives**: Consider adding a robust engine library for better bot strength

## Troubleshooting

### App not loading on mobile
- Check browser console for errors (F12 → Console)
- Ensure Three.js CDN is accessible
- Test with `python3 -m http.server` locally first

### Bot moves are slow
- Reduce search depth for lower difficulties
- Optimize move evaluation function
- Consider adding move caching

### Stats not persisting
- Check localStorage is enabled
- Check browser privacy settings
- Clear cache and reload

---

**Ready to launch! 🚀**
