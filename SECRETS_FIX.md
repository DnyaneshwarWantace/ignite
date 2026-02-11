# Fix push blocked by GitHub (secrets in history)

GitHub blocked the push because commit `448be67` introduced AWS keys into the repo. The tracked files are now fixed (no hardcoded secrets). You must **rewrite that commit** so the secrets are removed from history, then force-push.

## Steps

1. **Commit the current fixes** (the files were already updated to remove secrets):
   ```bash
   git add QUICK_TEST_INSTRUCTIONS.md test-aws-credentials.js test-aws-direct.js FIX_IAM_PERMISSIONS.md
   git commit -m "Remove AWS secrets from tracked files"
   ```

2. **Save the fix commit hash** (you will use it during rebase):
   ```bash
   FIX_COMMIT=$(git rev-parse HEAD)
   ```

3. **Start interactive rebase** to edit the commit that added the secrets:
   ```bash
   git rebase -i 448be6740442a21f87e024723685d31ef2b98bf5^
   ```
   In the editor, change the first line from `pick` to `edit` for commit `448be67`, save and close.

4. **When rebase stops** at that commit, replace the files with the fixed versions from the commit you saved:
   ```bash
   git show $FIX_COMMIT:QUICK_TEST_INSTRUCTIONS.md > QUICK_TEST_INSTRUCTIONS.md
   git show $FIX_COMMIT:test-aws-credentials.js > test-aws-credentials.js
   git show $FIX_COMMIT:test-aws-direct.js > test-aws-direct.js
   git show $FIX_COMMIT:FIX_IAM_PERMISSIONS.md > FIX_IAM_PERMISSIONS.md
   git add QUICK_TEST_INSTRUCTIONS.md test-aws-credentials.js test-aws-direct.js FIX_IAM_PERMISSIONS.md
   git commit --amend --no-edit
   git rebase --continue
   ```
   If the editor opens for later commits, save and close to continue until the rebase finishes.

5. **Force-push** (history was rewritten):
   ```bash
   git push origin master --force
   ```

6. **Rotate the exposed AWS keys** in AWS IAM (create new access key, delete the old one) and update your local `.env` and any deployed env config.

7. Delete this file once done: `rm SECRETS_FIX.md` and commit if you want.
