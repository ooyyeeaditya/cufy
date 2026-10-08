---
trigger: always
---

# Always Git Commit and Push After Code Changes

Whenever you complete a feature, bug fix, or UI change:
1. Verify the build/tests.
2. Stage all changed and untracked files (`git add .`).
3. Commit with a clear descriptive message (`git commit -m "..."`).
4. Push to remote repository (`git push origin main` or current branch).
5. Confirm the git push status to the user.
