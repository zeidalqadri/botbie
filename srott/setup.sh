#!/bin/bash

# SROTT Setup Script

echo "Setting up SROTT - Personal Port Sniffer"
echo "======================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment (optional but recommended)
read -p "Create virtual environment? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python3 -m venv venv
    source venv/bin/activate
    echo "Virtual environment created and activated."
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Make srott executable
chmod +x srott.py

# Create symlink for global usage (optional)
read -p "Create symlink for global usage? (requires sudo) (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo ln -sf "$(pwd)/srott.py" /usr/local/bin/srott
    echo "Symlink created. You can now run 'srott' from anywhere."
fi

echo ""
echo "Setup complete!"
echo ""
echo "Usage:"
echo "  ./srott.py              # Run locally"
echo "  sudo ./srott.py -i      # Run with sudo for process management"
echo ""
echo "If symlink was created:"
echo "  srott                   # Run from anywhere"
echo "  sudo srott -i           # Run with sudo from anywhere"