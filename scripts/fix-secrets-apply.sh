#!/bin/bash
# Step 2: Run this when rebase has stopped at commit 448be67 (after fix-secrets-rebase.sh).

set -e
cd "$(git rev-parse --show-toplevel)"

if [ ! -f .fix_commit ]; then
  echo "Run scripts/fix-secrets-rebase.sh first. No .fix_commit found."
  exit 1
fi

FIX_COMMIT=$(cat .fix_commit)
FILES="QUICK_TEST_INSTRUCTIONS.md test-aws-credentials.js test-aws-direct.js FIX_IAM_PERMISSIONS.md"

echo "Replacing files with content from $FIX_COMMIT..."
for f in $FILES; do
  git show "$FIX_COMMIT:$f" > "$f" 2>/dev/null || true
done
git add $FILES
git commit --amend --no-edit
rm .fix_commit
git rebase --continue
echo "Rebase continued. If it stops again, run this script again. Otherwise run: git push origin master --force"
