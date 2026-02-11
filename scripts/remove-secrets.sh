#!/bin/bash
# Remove AWS secrets from git history

set -e

echo "Removing AWS secrets from git history..."

# Create a filter script to remove secrets
cat > /tmp/remove-secrets-filter.sh << 'EOF'
#!/bin/bash
FILES="QUICK_TEST_INSTRUCTIONS.md test-aws-credentials.js test-aws-direct.js FIX_IAM_PERMISSIONS.md"

for file in $FILES; do
  if [ -f "$file" ]; then
    # Replace any AWS access keys (AKIA...) with placeholder
    sed -i '' 's/AKIA[A-Z0-9]\{16\}/your-access-key-id/g' "$file" || true

    # Replace any AWS secret keys (40 char base64) with placeholder
    sed -i '' 's/AWS_SECRET_ACCESS_KEY=[A-Za-z0-9+/]\{40\}/AWS_SECRET_ACCESS_KEY=your-secret-access-key/g' "$file" || true
    sed -i '' 's/REMOTION_AWS_SECRET_ACCESS_KEY=[A-Za-z0-9+/]\{40\}/REMOTION_AWS_SECRET_ACCESS_KEY=your-secret-access-key/g' "$file" || true

    # Add back to git if modified
    git add "$file" || true
  fi
done
EOF

chmod +x /tmp/remove-secrets-filter.sh

# Run filter-branch to rewrite history
git filter-branch --force --tree-filter '/tmp/remove-secrets-filter.sh' -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Done! Now you can force push: git push origin master --force"
