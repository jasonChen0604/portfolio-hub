---
name: get-latest-version
description: Get the latest CLAUDE.md version number from projects-list.md. A utility sub-skill called by other skills — not intended for direct user invocation. Returns a single string (e.g. "2.0") or "none" if all version fields are —.
---

# Get Latest Version Skill

## Goal
Read `projects-list.md` in the current working directory, scan all non-`—` values in the "Version" column, and return the **maximum version number**.

## Execution Steps

### Step 1: Read projects-list.md
Use the Read tool to read `projects-list.md` in the current working directory.
- If the file does not exist, output `none` and stop.

### Step 2: Parse the "Version" column
Extract the "Version" column value from each row in the table:
- Table is Markdown format; version is the 8th column (index 7)
- Skip the header row (contains the word `Version`) and separator rows (contain `---`)
- Skip values that are `—` (em dash), `-` (hyphen), or blank

### Step 3: Compare to find the maximum version
Perform semantic version comparison on all collected version numbers:
- Format is `"X.Y"` — compare major version (X) first, then minor version (Y), both as numbers
- Return the maximum value as the "latest version"

### Step 4: Output result
Output just the version string, e.g.:
```
2.0
```
If all version fields are `—`, output:
```
none
```

## How to call (reference for other skills)
In other skills, describe the call like this:

```
Run the /get-latest-version skill to get the version string for use in downstream filtering logic.
```

## Notes
- This skill is read-only — it does not modify any files
- Version comparison is numeric: `2.0` > `1.9`, and minor versions also compared as numbers
- `—` is an em dash (U+2014) — distinguish from hyphen `-`
