#!/bin/bash
# RentLoop - Push to GitHub Script
# Run this script from the project root to push fixes to GitHub

set -e

REPO="RentCart03"  # Change this if using a different repo
OWNER="Divyanshu621"
BRANCH="main"

echo "=== RentLoop GitHub Push Script ==="
echo ""

# Check if we have a token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "ERROR: GITHUB_TOKEN environment variable not set."
    echo ""
    echo "To fix this, you need a GitHub PAT with these permissions:"
    echo "  - Repository permissions > Contents: Read and Write"
    echo "  - Account permissions > Administration: Read and Write"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo "  bash push-to-github.sh"
    exit 1
fi

# Set up remote
echo "Setting up git remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${OWNER}:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"

# Push
echo "Pushing to GitHub..."
git push -u origin ${BRANCH}

echo ""
echo "=== Push Complete! ==="
echo "Render will auto-deploy from the new commit."
echo "Monitor at: https://dashboard.render.com"
