#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_NAME="CAD2BIM Studio"
BUNDLE_ID="com.ifcbim.cad2bimstudio"
VERSION="${1:-1.0.0}"
DIST_DIR="$ROOT_DIR/dist/macos"
STAGE_DIR="$DIST_DIR/stage"
PKG_ROOT="$DIST_DIR/pkgroot"
APP_DIR="$STAGE_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
SOURCE_DIR="$RESOURCES_DIR/app"
VENV_DIR="$RESOURCES_DIR/venv"
PKG_PATH="$DIST_DIR/$APP_NAME.pkg"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3)}"

echo "Building $APP_NAME $VERSION"
echo "Using Python: $PYTHON_BIN"

rm -rf "$DIST_DIR"
mkdir -p "$MACOS_DIR" "$SOURCE_DIR" "$PKG_ROOT/Applications"

rsync -a \
  --exclude '.git' \
  --exclude '.venv' \
  --exclude '.playwright-cli' \
  --exclude '.vercel' \
  --exclude '__pycache__' \
  --exclude 'dist' \
  --exclude 'data/jobs' \
  --exclude 'output' \
  --exclude 'sample_data' \
  --exclude 'tests' \
  "$ROOT_DIR/" "$SOURCE_DIR/"

"$PYTHON_BIN" -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip wheel setuptools
"$VENV_DIR/bin/pip" install -r "$ROOT_DIR/requirements.txt"

cat > "$CONTENTS_DIR/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>cad2bim-studio</string>
  <key>CFBundleIdentifier</key>
  <string>$BUNDLE_ID</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$APP_NAME</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>$VERSION</string>
  <key>CFBundleVersion</key>
  <string>$VERSION</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSUIElement</key>
  <true/>
</dict>
</plist>
EOF

cat > "$MACOS_DIR/cad2bim-studio" <<'EOF'
#!/bin/zsh
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CAD2BIM_APP_ROOT="$BUNDLE_ROOT/Resources/app"
export CAD2BIM_EMBEDDED_PYTHON="$BUNDLE_ROOT/Resources/venv/bin/python"

exec "$CAD2BIM_EMBEDDED_PYTHON" "$CAD2BIM_APP_ROOT/packaging/macos/launcher.py"
EOF
chmod +x "$MACOS_DIR/cad2bim-studio"

ditto "$APP_DIR" "$PKG_ROOT/Applications/$APP_NAME.app"

pkgbuild \
  --root "$PKG_ROOT" \
  --identifier "$BUNDLE_ID" \
  --version "$VERSION" \
  --install-location "/" \
  "$PKG_PATH"

echo
echo "App bundle: $APP_DIR"
echo "Installer: $PKG_PATH"
