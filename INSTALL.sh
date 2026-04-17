#!/bin/bash

echo "========================================"
echo "Plume & Reve - Installation Script"
echo "========================================"
echo

# Check Node.js installation
echo "[1/4] Verifying Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "Node.js is installed"
echo

# Install dependencies
echo "[2/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "Dependencies installed successfully"
echo

# Create asset directories
echo "[3/4] Creating placeholder assets directory structure..."
mkdir -p src/assets/images/backgrounds
mkdir -p src/assets/images/heroes
mkdir -p src/assets/images/items
mkdir -p src/assets/images/effects
mkdir -p src/assets/images/icons
mkdir -p src/assets/animations
mkdir -p src/assets/models
echo "Asset directories created"
echo

# Start Expo
echo "[4/4] Starting Expo development server..."
echo
echo "========================================"
echo "Installation complete!"
echo "========================================"
echo
echo "The app will now start with placeholder assets."
echo "You can replace them with real assets later."
echo
echo "Press Ctrl+C to stop the server"
echo
npm start