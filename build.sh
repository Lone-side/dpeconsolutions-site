#!/bin/bash
# D.P. Accounting Solutions - Build Script
# Usage: ./build.sh [--minify]

set -e

echo "=== D.P. Accounting Solutions Build Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Version from styles.css
VERSION="v6.1"

echo -e "${GREEN}Version:${NC} $VERSION"
echo ""

# Check if minification is requested
if [[ "$1" == "--minify" ]]; then
    echo -e "${YELLOW}Minification requested...${NC}"

    # Check for required tools
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}Error: npx not found. Install Node.js first.${NC}"
        echo "Run: npm install -g terser clean-css-cli"
        exit 1
    fi

    # Minify CSS
    echo "Minifying CSS..."
    if command -v cleancss &> /dev/null; then
        cleancss -o styles.min.css styles.css
        cleancss -o styles-consulting.min.css styles-consulting.css
        echo -e "${GREEN}CSS minified successfully${NC}"
    else
        echo -e "${YELLOW}clean-css-cli not found, skipping CSS minification${NC}"
        echo "Install with: npm install -g clean-css-cli"
    fi

    # Minify JS
    echo "Minifying JavaScript..."
    if command -v terser &> /dev/null; then
        terser script.js -o script.min.js -c -m
        terser script-consulting.js -o script-consulting.min.js -c -m
        echo -e "${GREEN}JavaScript minified successfully${NC}"
    else
        echo -e "${YELLOW}terser not found, skipping JS minification${NC}"
        echo "Install with: npm install -g terser"
    fi
fi

# Validate HTML files exist
echo ""
echo "Checking HTML files..."
HTML_FILES=(
    "index.html"
    "tools.html"
    "consulting.html"
    "faq.html"
    "case-studies.html"
    "funding.html"
    "privacy.html"
    "thanks.html"
    "404.html"
)

for file in "${HTML_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "  ${GREEN}[OK]${NC} $file"
    else
        echo -e "  ${RED}[MISSING]${NC} $file"
    fi
done

# Validate CSS files
echo ""
echo "Checking CSS files..."
CSS_FILES=("styles.css" "styles-consulting.css")
for file in "${CSS_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        SIZE=$(wc -c < "$file")
        echo -e "  ${GREEN}[OK]${NC} $file ($SIZE bytes)"
    else
        echo -e "  ${RED}[MISSING]${NC} $file"
    fi
done

# Validate JS files
echo ""
echo "Checking JavaScript files..."
JS_FILES=("script.js" "script-consulting.js" "calculator-core.js")
for file in "${JS_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        SIZE=$(wc -c < "$file")
        echo -e "  ${GREEN}[OK]${NC} $file ($SIZE bytes)"
    else
        echo -e "  ${RED}[MISSING]${NC} $file"
    fi
done

# Check assets
echo ""
echo "Checking assets..."
ASSETS=(
    "assets/logo-dp-gold.png"
    "assets/favicon.svg"
    "assets/og-image.jpg"
)
for file in "${ASSETS[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "  ${GREEN}[OK]${NC} $file"
    else
        echo -e "  ${YELLOW}[MISSING]${NC} $file"
    fi
done

# Sitemap validation
echo ""
echo "Checking sitemap.xml..."
if [[ -f "sitemap.xml" ]]; then
    URL_COUNT=$(grep -c "<loc>" sitemap.xml || echo "0")
    echo -e "  ${GREEN}[OK]${NC} sitemap.xml ($URL_COUNT URLs)"
else
    echo -e "  ${RED}[MISSING]${NC} sitemap.xml"
fi

echo ""
echo -e "${GREEN}=== Build complete ===${NC}"
echo ""
echo "To deploy:"
echo "  git add ."
echo "  git commit -m 'Build $VERSION'"
echo "  git push origin main"
