# Versioning Guide

## Automated Version Bumping

This project uses automated version bumping via GitHub Actions. When you push or merge to the `main` branch, the version is automatically incremented based on your commit message.

---

## How It Works

The GitHub Actions workflow (`.github/workflows/version-bump.yml`) analyzes your commit message and determines the type of version bump:

| Commit Type | Version Bump | Example |
|------------|--------------|---------|
| `feat: ...` | **MINOR** (1.0.0 → 1.1.0) | New features |
| `fix: ...` | **PATCH** (1.0.0 → 1.0.1) | Bug fixes |
| `BREAKING CHANGE` or `!:` | **MAJOR** (1.0.0 → 2.0.0) | Breaking changes |
| Other | **PATCH** (default) | Documentation, refactoring, etc. |

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format for automatic version detection:

### Feature (MINOR bump)
```bash
git commit -m "feat: add PDF export for invoices"
git commit -m "feat(expenses): add receipt photo upload"
```

### Bug Fix (PATCH bump)
```bash
git commit -m "fix: resolve date picker crash on Android"
git commit -m "fix(dashboard): correct total income calculation"
```

### Breaking Change (MAJOR bump)
```bash
git commit -m "feat!: redesign invoice schema"
git commit -m "feat: change authentication flow

BREAKING CHANGE: Users must re-login after this update"
```

### Other Changes (PATCH bump)
```bash
git commit -m "docs: update README with new features"
git commit -m "refactor: simplify invoice validation logic"
git commit -m "chore: update dependencies"
```

---

## What Gets Updated

When a version bump occurs, the workflow automatically:

1. ✅ Updates `package.json` version
2. ✅ Updates `app.json` expo.version
3. ✅ Updates `package-lock.json`
4. ✅ Creates a git commit with the new version
5. ✅ Creates a git tag (e.g., `v1.2.0`)
6. ✅ Pushes changes back to `main`
7. ✅ Creates a GitHub Release

---

## Current Version

To check the current version:

```bash
# From package.json
npm version

# From app.json
cat app.json | grep '"version"'
```

---

## Manual Version Bump (If Needed)

If you need to manually bump the version:

```bash
# Bump patch version (1.0.0 → 1.0.1)
npm version patch

# Bump minor version (1.0.0 → 1.1.0)
npm version minor

# Bump major version (1.0.0 → 2.0.0)
npm version major

# Then update app.json to match
# And commit/push
git add .
git commit -m "chore(release): bump version to v1.2.0"
git push origin main
```

---

## Examples

### Scenario 1: Adding a New Feature
```bash
git add .
git commit -m "feat: add mileage tracking with GPS"
git push origin main
# Result: 1.0.0 → 1.1.0
```

### Scenario 2: Fixing a Bug
```bash
git add .
git commit -m "fix: resolve invoice total calculation rounding error"
git push origin main
# Result: 1.1.0 → 1.1.1
```

### Scenario 3: Breaking Change
```bash
git add .
git commit -m "feat!: migrate to new database schema

BREAKING CHANGE: Users must re-sync their data after this update"
git push origin main
# Result: 1.1.1 → 2.0.0
```

### Scenario 4: Regular Commit (No Prefix)
```bash
git add .
git commit -m "Update dashboard styling"
git push origin main
# Result: 2.0.0 → 2.0.1 (defaults to patch)
```

---

## Workflow Triggers

The version bump workflow will **NOT** run for:

- Commits that start with `chore(release):` (to prevent infinite loops)
- Pushes to branches other than `main`
- Pull requests (only when merged to main)

---

## Troubleshooting

### Workflow didn't run
- Check that you pushed to `main` branch
- Check GitHub Actions tab for errors
- Ensure the commit message isn't from the bot itself

### Version didn't update in app.json
- Check the workflow logs in GitHub Actions
- Manually verify app.json has correct format
- Run the workflow again if needed

### Can I skip version bump for a commit?
Yes, include `[skip ci]` in your commit message:
```bash
git commit -m "docs: fix typo [skip ci]"
```

---

## Best Practices

1. **Use conventional commits** for all feature work and bug fixes
2. **Be descriptive** in commit messages to help track changes
3. **Test locally** before pushing to main
4. **Review releases** in GitHub Releases tab after each push
5. **Keep CHANGELOG.md updated** (can be automated later)

---

## Future Enhancements

Potential improvements to the versioning system:

- [ ] Auto-generate CHANGELOG.md from commit messages
- [ ] Trigger EAS Build automatically after version bump
- [ ] Slack/Discord notifications for new releases
- [ ] Semantic release with release notes parsing
- [ ] Version badge in README.md

---

**Current Version**: 1.0.0
**Last Updated**: November 16, 2024
