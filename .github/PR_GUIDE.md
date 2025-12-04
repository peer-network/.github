📘 PR Workflow Guide (for .github documentation)
🔀 Creating a Pull Request (PR)

When creating a PR in any Peer repository:
1. Create a feature branch

Use clear naming:
- username/feat/...
- username/fix/...

2. Commit your changes

Keep commits focused and clean.
Follow the existing commit style if possible.

3. Open a Pull Request

Choose the correct target branch:
- development — normal work
- pre-release — release preparation
- main — urgent hotfixes

4. Fill out the PR template

Include:

- Context
- Implementation summary
- Test notes (if relevant)

🔄 Automatic Branch Update (New Feature)

All Peer repositories now support automatic PR branch updates, powered by a shared reusable GitHub Actions workflow.

How it works

If your PR branch is behind the target branch:

- The workflow detects it
- Attempts a safe merge (git merge --no-commit)
- If no conflicts → PR branch is updated automatically
- If conflicts → you must update the branch manually

What developers see

- Your PR stays automatically up-to-date
- Fewer CI failures related to outdated branches
- No need to click “Update branch” manually unless there is a conflict

⚠️ When auto-update does not run

The automatic update will not run if:

- There is a merge conflict
- Your branch is already up-to-date
- The branch was deleted
- The PR is from a fork without write permissions

✔ Developer recommendations

- Always pull the latest development before creating your branch
- Resolve merge conflicts locally if the auto-update cannot proceed
- Do not force-push after review without communicating
- Use clear PR titles — they appear in:
  CI logs
  Discord alerts
  Release notes

📦 Benefits for the team

- Clean, consistent PR workflow
- Up-to-date branches → more stable CI
- Eliminates manual update steps
- Works across:
  Backend
  Web
  iOS
  Android
  Any future Peer repo using CI