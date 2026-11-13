#!/usr/bin/env bash
# Rechenblitz-APK bauen – aus denselben Dateien wie die Web-App (../kopfrechnen).
# Aufruf: bash build.sh [debug|release]   (release braucht Signier-Angaben, siehe ANDROID.md)
set -euo pipefail
cd "$(dirname "$0")"
MODE="${1:-debug}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"

# 1. Web-App 1:1 übernehmen (eine Quelle für Web und APK); Service Worker braucht die APK nicht
rm -rf www && mkdir www
cp -r ../kopfrechnen/. www/
rm -f www/sw.js

# 2. Version aus js/changelog.js (z. B. 3.5.2 → versionCode 30502)
VER=$(grep -oP "APP_VERSION = '\K[0-9.]+" www/js/changelog.js)
IFS=. read -r A B C <<<"$VER"; CODE=$((A*10000 + B*100 + C))
echo "Rechenblitz $VER (versionCode $CODE)"

# 3. Android-Projekt anlegen (nur beim ersten Mal) und Dateien übertragen
[ -d android ] || npx cap add android
npx cap sync android
sed -i -E "s/versionCode [0-9]+/versionCode $CODE/; s/versionName \"[^\"]*\"/versionName \"$VER\"/" android/app/build.gradle

# 4. Bauen
cd android
if [ "$MODE" = release ]; then ./gradlew -q clean assembleRelease bundleRelease; ls -1 app/build/outputs/apk/release/*.apk app/build/outputs/bundle/release/*.aab
else ./gradlew -q clean assembleDebug; ls -1 app/build/outputs/apk/debug/*.apk; fi
