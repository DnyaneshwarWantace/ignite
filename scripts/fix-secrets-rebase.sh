#!/bin/bash
# Step 1: Commit fixed files (no secrets), then start rebase to edit commit 448be67.
# When rebase stops, run: ./scripts/fix-secrets-apply.sh

set -e
cd "$(git rev-parse --show-toplevel)"
BAD_COMMIT="448be6740442a21f87e024723685d31ef2b98bf5"
FILES="QUICK_TEST_INSTRUCTIONS.md test-aws-credentials.js test-aws-direct.js FIX_IAM_PERMISSIONS.md"

if ! git log --oneline -1 "$BAD_COMMIT" &>/dev/null; then
  echo "Commit $BAD_COMMIT not in this branch. Are you on master?"
  exit 1
fi

if git status --short $FILES | grep -q .; then
  echo "Committing fixed versions of tracked files..."
  git add $FILES
  git commit -m "Remove AWS secrets from tracked files"
fi

FIX_COMMIT=$(git rev-parse HEAD)
echo "$FIX_COMMIT" > .fix_commit
echo "Saved fix commit $FIX_COMMIT to .fix_commit"
echo ""
echo "Starting rebase. When it stops at the bad commit, run:"
echo "  ./scripts/fix-secrets-apply.sh"
echo ""

# Editor that changes "pick" to "edit" for the bad commit so rebase stops there
export GIT_SEQUENCE_EDITOR="sh -c 'sed -i \"\" \"s/^pick ${BAD_COMMIT}/edit ${BAD_COMMIT}/\" \"\$1\"' _"
git rebase -i "${BAD_COMMIT}^"
