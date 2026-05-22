#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/output"
KEYSTORE_FILE="$PROJECT_DIR/app/alist.jks"

echo "============================================"
echo "  AList v3.6.0 Android APK Build Script"
echo "============================================"
echo

cd "$PROJECT_DIR"

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "[INFO] Keystore not found, generating..."
    keytool -genkey -v -keystore "$KEYSTORE_FILE" \
        -alias alist -keyalg RSA -keysize 2048 -validity 36500 \
        -storepass alist123 -keypass alist123 \
        -dname "CN=AList, OU=AList, O=AList, L=Beijing, S=Beijing, C=CN"
    echo "[OK] Keystore generated: $KEYSTORE_FILE"
fi

echo "[INFO] Building Release APK..."
./gradlew assembleRelease --no-daemon --stacktrace

mkdir -p "$OUTPUT_DIR"

APK_PATH=$(find "$PROJECT_DIR/app/build/outputs/apk" -name "*.apk" | head -1)

if [ -z "$APK_PATH" ]; then
    echo "[ERROR] No APK found!"
    exit 1
fi

SIGNED_APK="$OUTPUT_DIR/alist-v3.6.0-arm64-v8a-signed.apk"
UNSIGNED_APK="$PROJECT_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"

if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    SDK_DIR="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
    BUILD_TOOLS=$(ls -d "$SDK_DIR/build-tools"/*/ 2>/dev/null | head -1)
    if [ -n "$BUILD_TOOLS" ]; then
        echo "[INFO] Signing with Android SDK..."
        "${BUILD_TOOLS}zipalign" -v -p 4 "$APK_PATH" "${SIGNED_APK}.unaligned"
        "${BUILD_TOOLS}apksigner" sign --ks "$KEYSTORE_FILE" \
            --ks-pass pass:alist123 --ks-key-alias alist \
            --key-pass pass:alist123 \
            --out "$SIGNED_APK" "${SIGNED_APK}.unaligned"
        rm -f "${SIGNED_APK}.unaligned"
        echo "[OK] Signed APK: $SIGNED_APK"
    fi
else
    cp "$APK_PATH" "$OUTPUT_DIR/"
    echo "[WARN] No Android SDK found. Unsigned APK at: $OUTPUT_DIR/"
fi

echo ""
echo "============================================"
echo "  Build complete!"
echo "============================================"
