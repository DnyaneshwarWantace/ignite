# Fix push blocked by GitHub (secrets in history)

GitHub blocked the push because commit `448be67` introduced AWS keys. You must **rewrite that commit** so the secrets are removed from history, then force-push.

## Option A: Scripts (recommended)

1. **Run the rebase script** (commits current fixes if needed, then starts rebase):
   ```bash
   chmod +x scripts/fix-secrets-rebase.sh scripts/fix-secrets-apply.sh
   ./scripts/fix-secrets-rebase.sh
   ```

2. **When rebase stops**, run:
   ```bash
   ./scripts/fix-secrets-apply.sh
   ```
   If rebase stops again (e.g. conflicts), run `./scripts/fix-secrets-apply.sh` again until it finishes.

3. **Force-push**:
   ```bash
   git push origin master --force
   ```

4. **Rotate the exposed AWS keys** in IAM and update `.env` and any deployed env.

---

## Option B: Manual steps

1. Commit the fixed files, save fix commit hash, start rebase, change first line to `edit`, save and close.
2. When rebase stops: `git show $FIX_COMMIT:QUICK_TEST_INSTRUCTIONS.md > QUICK_TEST_INSTRUCTIONS.md` (and same for test-aws-credentials.js, test-aws-direct.js, FIX_IAM_PERMISSIONS.md), then `git add` those four files, `git commit --amend --no-edit`, `git rebase --continue`.
3. Force-push: `git push origin master --force`.
4. Rotate AWS keys.
