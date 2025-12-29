#!/bin/bash

# Auto-push script for deteksi-gempa-web project
# Usage: ./auto-push.sh [commit-message]

# Default commit message
COMMIT_MSG="Auto commit - $(date '+%Y-%m-%d %H:%M:%S')"

# If user provides commit message, use it
if [ $# -gt 0 ]; then
    COMMIT_MSG="$*"
fi

echo "🚀 Starting auto-push process..."
echo "📝 Commit message: $COMMIT_MSG"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Add all changes
echo "📦 Adding files..."
git add .

# Commit with message
echo "💾 Committing changes..."
if git commit -m "$COMMIT_MSG"; then
    echo "✅ Commit successful"
else
    echo "❌ Commit failed"
    exit 1
fi

# Push to remote
echo "⬆️  Pushing to remote..."
if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
    echo "✅ Push successful"
    echo "🎉 Auto-push completed!"
else
    echo "❌ Push failed - check your remote configuration"
    exit 1
fi