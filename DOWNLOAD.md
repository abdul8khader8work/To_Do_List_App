# 🚀 Quick Start: Get Downloadable Apps

## 📥 Option 1: Download Pre-Built Apps (Easiest)

Visit [GitHub Releases](https://github.com/abdul8khader8work/todo-list-app/releases) to download:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image  
- **Linux**: `.AppImage` (portable)
- **Android**: `.apk` file

## 🔨 Option 2: Trigger Automated Build

If no releases exist yet, create one:

```bash
# Tag a release version
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
1. Build all desktop apps (Windows, macOS, Linux)
2. Build Android APK
3. Create a GitHub Release with all files
4. Upload everything to the Releases page

**Wait ~10-15 minutes** for all builds to complete, then check:
https://github.com/abdul8khader8work/todo-list-app/releases

## 🛠️ Option 3: Build Locally

See [BUILDING.md](./BUILDING.md) for detailed instructions on building apps on your own machine.

## 📱 Alternative: Use PWA (No Download Needed)

The app is also available as a Progressive Web App:

**Web URL**: https://to-do-list-app-seven-teal.vercel.app

**Install on any device:**
- **Desktop**: Click install icon in browser address bar
- **Android**: Chrome → Menu → "Install app"
- **iOS**: Safari → Share → "Add to Home Screen"

---

## 📋 What's Available

| Platform | File Type | How to Get |
|----------|-----------|------------|
| Windows | `.exe` | [Download](https://github.com/abdul8khader8work/todo-list-app/releases/latest) or build locally |
| macOS | `.dmg` | [Download](https://github.com/abdul8khader8work/todo-list-app/releases/latest) or build on Mac |
| Linux | `.AppImage` | [Download](https://github.com/abdul8khader8work/todo-list-app/releases/latest) or build locally |
| Android | `.apk` | [Download](https://github.com/abdul8khader8work/todo-list-app/releases/latest) or build locally |
| iOS | PWA | Install from web browser (no .ipa available without Apple Developer account) |

---

## ⚠️ Important Notes

1. **First build takes time**: The automated builds take 10-15 minutes to complete
2. **No releases yet?**: You need to create a tag first (`git tag v1.0.0 && git push origin v1.0.0`)
3. **macOS builds**: Can only be built on macOS machines
4. **Android APK**: May show "Unknown source" warning during installation (this is normal)
5. **iOS**: No native app available without Apple Developer Program ($99/year)

---

## 🆘 Need Help?

- **Build issues**: Check [BUILDING.md](./BUILDING.md)
- **GitHub Actions**: Check the [Actions tab](https://github.com/abdul8khader8work/todo-list-app/actions)
- **General questions**: [Open an issue](https://github.com/abdul8khader8work/todo-list-app/issues)
