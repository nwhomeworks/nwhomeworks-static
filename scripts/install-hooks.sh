#!/bin/sh
# One-time hook installer. Points git at the committed .githooks/ directory
# so every clone of this repo can opt in with a single command:
#   sh scripts/install-hooks.sh
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit 2>/dev/null || true
echo "git hooks installed (core.hooksPath=.githooks)"
