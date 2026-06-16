---
name: batch-init-claude-md
description: Batch-initialize CLAUDE.md for valid projects in projects-list.md that are missing CLAUDE.md or have an outdated version. Triggers when the user says "batch init", "batch initialize", "update CLAUDE.md", or "initialize unfinished projects".
---

# Batch Init Claude MD Skill

## Goal
Find valid projects in `projects-list.md` that need CLAUDE.md initialized or updated, run `init-claude-md` skill **in parallel** (max 3 per batch), and update `projects-list.md` after each batch completes.

## Execution Steps

### Step 1: Get the latest version number
Run the `/get-latest-version` skill to get the version string to use as the "latest version" baseline.
- Return format is a string (e.g. `"2.0"`)
- If `none` is returned, all projects with CLAUDE.md are treated as "outdated"

### Step 2: Filter candidate projects
From the table in `projects-list.md`, filter rows that satisfy all of the following:
1. "Active" column is ✅ (skip ❌)
2. Matches at least one of:
   - "CLAUDE.md" column is ❌ (not yet initialized)
   - "CLAUDE.md" column is ✅ but "Version" column is not the latest (including `—`)

Sort by table order, take the first **N** (default N=5; user can specify in prompt, e.g. "batch init 3").

### Step 3: Run init-claude-md in parallel (max 3 per batch)
Split candidate projects into batches of max **3**, run within each batch in **parallel**, batches run **sequentially**:

```bash
cd <project path> && claude --dangerously-skip-permissions -p "/init-claude-md"
```

- `<project path>` is the "Path" column value from the table; expand `~/` to `/Users/jason/`
- Use `--dangerously-skip-permissions` to skip folder trust confirmation so the skill runs unattended
- Issue all 3 commands in the same batch simultaneously via Bash tool with `run_in_background: true`, then wait for all to complete
- After each batch finishes, read each project's `CLAUDE.md` frontmatter to get `skill_version`, then proceed to the next batch

### Step 4: Update projects-list.md
After each batch completes, immediately update the corresponding rows in `projects-list.md`:
- "CLAUDE.md" column → ✅
- "Version" column → `skill_version` value read from CLAUDE.md (use `—` if frontmatter field is missing)
- "Description" column → `one_line_description` value from CLAUDE.md frontmatter (keep original if missing)

Update method: Edit `projects-list.md` directly, match rows by the "Path" column, replace the row.

### Step 5: Report results
After all batches complete, output a summary:
```
✅ Batch init complete
- Projects processed: N
- Success: M
- Failed: K (list names)
- projects-list.md updated
```

## Notes
- **Parallelism**: max 3 projects per batch run simultaneously; batches are sequential
- Expand `~/` in paths to the full absolute path (`/Users/jason/`)
- `--dangerously-skip-permissions` ensures no manual folder trust confirmation needed
- If a project fails (non-zero exit code), record the failure and continue with remaining projects — do not abort the entire batch
- Version comparison: `2.0` > `1.0` — use numeric comparison, not string comparison
- Show the candidate list to the user for confirmation before starting execution
