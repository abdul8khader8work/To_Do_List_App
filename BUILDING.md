# Building Desktop & Mobile Apps

This guide explains how to build native desktop applications (.exe, .dmg, .AppImage) and Android APK from the Todo List web app.

## 🚀 Quick Start (Automated Builds)

The easiest way to get pre-built apps is to download them from [GitHub Releases](https://github.com/abdul8khader8work/todo-list-app/releases/latest).

If you want to trigger a new build:

```bash
# Create a version tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically build all platforms and create a release.

---

## 🖥️ Building Desktop Apps

### Prerequisites

- Node.js 20+
- npm
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/abdul8khader8work/todo-list-app.git
cd todo-list-app

# Install dependencies
npm ci
```

### Build for Windows (.exe)

```bash
# Build the web app
npm run build

# Package as Windows executable
npx electron-builder --win --config electron-builder.json
```

The .exe file will be in the `release/` directory.

### Build for macOS (.dmg)

```bash
# Build the web app
npm run build

# Package as macOS disk image
npx electron-builder --mac --config electron-builder.json
```

The .dmg file will be in the `release/` directory.

**Note:** Building on macOS requires macOS. You cannot cross-compile for macOS from Windows or Linux.

### Build for Linux (.AppImage)

```bash
# Build the web app
npm run build

# Package as Linux AppImage
npx electron-builder --linux --config electron-builder.json
```

The .AppImage file will be in the `release/` directory.

---

## 📱 Building Android APK

### Prerequisites

- Node.js 20+
- npm
- Java JDK 17+
- Android SDK
- Git

### Setup Android SDK

1. Download Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Install Android SDK via Android Studio
3. Set environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Build APK

```bash
# Clone the repository
git clone https://github.com/abdul8khader8work/todo-list-app.git
cd todo-list-app

# Install dependencies
npm ci

# Build the web app
npm run build

# Generate the Android project (once per checkout)
npx cap add android

# Sync web assets to Android
npx cap sync android

# Build the APK
cd android
gradlew.bat assembleDebug # Windows
# ./gradlew assembleDebug # macOS/Linux
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK (Signed)

For a production-ready APK:

```bash
cd android

# Generate a keystore (one-time setup)
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key

# Build release APK
./gradlew assembleRelease
```

The signed APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🍏 Building iOS App

### Prerequisites

- macOS
- Xcode 14+
- Node.js 20+
- npm
- Apple Developer Account (for App Store distribution)

### Build iOS App

```bash
# Install Capacitor iOS
npm install @capacitor/ios

# Add iOS platform
npx cap add ios

# Build the web app
npm run build

# Sync web assets to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your development team
2. Select a target device or simulator
3. Click "Run" to build and install

For App Store distribution, you'll need to:
1. Archive the build (Product → Archive)
2. Upload to App Store Connect
3. Submit for review

---

## 🔄 Automated Builds with GitHub Actions

The release workflow builds all platforms in a single run when you push a version tag. It publishes a release only after every platform build succeeds.

### Workflow Files

- `.github/workflows/build-desktop.yml` - Builds Windows, macOS, and Linux apps
- `.github/workflows/build-android.yml` - Builds Android APK
- `.github/workflows/release.yml` - Creates GitHub Release with all artifacts

### Triggering a Build

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

### Monitoring Builds

1. Go to your GitHub repository
2. Click "Actions" tab
3. You'll see the running workflows
4. Once complete, artifacts will be available in the "Releases" section

---

## 📦 Distribution

### Desktop Apps

- **Windows**: Distribute the .exe file directly or create an installer
- **macOS**: Distribute the .dmg file (may need code signing for distribution outside Mac App Store)
- **Linux**: Distribute the .AppImage file (portable, no installation needed)

### Android APK

- Distribute the APK file directly (users need to enable "Install from unknown sources")
- Or publish to Google Play Store (requires developer account and signed APK)

### iOS App

- Must be distributed through the App Store (requires Apple Developer Program membership)
- Or use TestFlight for beta testing

---

## 🐛 Troubleshooting

### Desktop Build Issues

**Issue:** `electron-builder` fails
- **Solution:** Make sure you've run `npm run build` first to generate the `dist/` folder

**Issue:** Missing dependencies on Linux
- **Solution:** Install required packages: `sudo apt-get install -y rpm fakeroot`

### Android Build Issues

**Issue:** `SDK location not found`
- **Solution:** Create `android/local.properties` with: `sdk.dir=/path/to/android/sdk`

**Issue:** Gradle build fails
- **Solution:** Make sure Java 17+ is installed: `java -version`

**Issue:** APK installation fails on device
- **Solution:** Enable "Install from unknown sources" in Android settings

---

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Development Guide](https://developer.apple.com/documentation/)

---

## 💡 Tips

1. **Test thoroughly** on target platforms before distributing
2. **Code signing** is recommended for production releases
3. **Version your releases** using semantic versioning (v1.0.0, v1.1.0, etc.)
4. **Include release notes** to inform users of changes
5. **Backup your signing keys** - losing them means you can't update your apps

---

Need help? [Open an issue](https://github.com/abdul8khader8work/todo-list-app/issues) on GitHub.
