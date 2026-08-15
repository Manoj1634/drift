# Repo guardrails (hackathon submission)

> **Refresh note (2026-08-15):** Contents are a **fresh file snapshot** of `j-ber/cursors` `main` (post-integration). History here is intentionally rewritten with clean commits only — never merge/cherry-pick from `j-ber/cursors`.

This repository was created with a **single clean root commit** so GitHub Contributors does not list Claude or Cursor Agent.

## Do not

- Cherry-pick, merge, or rebase history from `j-ber/cursors` into this repo (that reintroduces `Co-Authored-By: Claude` / `Cursor` trailers).
- Push commits that include `Co-authored-by:` / `Co-Authored-By:` lines for Claude, Anthropic, or Cursor Agent.
- Connect the Claude Code / Anthropic GitHub app to this repo.

## Before every push

```bash
git log -1 --format=%B | rg -i 'co-authored-by.*(claude|anthropic|cursor)' && echo 'STRIP TRAILER BEFORE PUSH' || echo 'ok'
```

If a trailer slipped in and the commit is not pushed yet:

```bash
git commit --amend -m "$(git log -1 --pretty=%B | sed -E '/^Co-[Aa]uthored-[Bb]y:/d')"
```

## Cutover for j-ber (repo owner of the old URL)

1. Accept the admin invite on https://github.com/Manoj1634/drift (or accept the ownership transfer if offered).
2. Optionally transfer this repo to `j-ber/drift` (Settings → General → Transfer).
3. Make https://github.com/j-ber/cursors **private** or delete it so judges cannot open the old Contributors list that still shows Claude.
4. Use **this** repo URL on the hackathon submission form.

## Teammates

Clone fresh — do not keep working from the old `cursors` history for submission work:

```bash
git clone https://github.com/Manoj1634/drift.git
cd drift
```
