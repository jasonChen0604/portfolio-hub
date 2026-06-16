---
name: scan-projects
description: Scan all valid software projects (including Docker/docker-compose projects) under a specified directory and output a Markdown list for manual filtering. Triggers when the user says "scan projects", "list my projects", "find all projects", or "scan projects".
---

# Scan Projects Skill

## Goal
Scan all valid software projects under `~/project` (or a user-specified path) and output a Markdown report for manual filtering.

## Definition of a Valid Software Project
A directory is considered a valid project root if any of the following markers exist (file or directory):

```
package.json, Cargo.toml, go.mod, pyproject.toml, requirements.txt, setup.py,
Makefile, pom.xml, build.gradle, CMakeLists.txt, .git, composer.json, Gemfile,
Dockerfile, dockerfile, docker-compose.yml, docker-compose.yaml, compose.yml, compose.yaml
```

## Execution Steps

### Step 1: Confirm scan root directory
- Default: `~/project`
- If the user specifies a path (e.g. `/Users/jason/work`), use that instead
- Verify the directory exists with `ls`

### Step 2: Execute scan (recursive, max 4 levels)
Same logic as `collect_projects()` in `init-all.sh`:
- If the current directory matches any marker → treat as project root, **do not recurse further**
- If no match → continue scanning subdirectories, max depth of 4
- Skip the following subdirectory names: `node_modules`, `.git`, `.venv`, `__pycache__`, `dist`, `build`, `packages`

Use the following bash script:

```bash
BASE_DIR="$HOME/project"
MAX_DEPTH=4
MARKERS=(
  "package.json" "Cargo.toml" "go.mod" "pyproject.toml" "requirements.txt"
  "setup.py" "Makefile" "pom.xml" "build.gradle" "CMakeLists.txt" ".git"
  "composer.json" "Gemfile" "Dockerfile" "dockerfile"
  "docker-compose.yml" "docker-compose.yaml" "compose.yml" "compose.yaml"
)

is_project_root() {
  local dir="$1"
  for marker in "${MARKERS[@]}"; do
    [[ -e "$dir/$marker" ]] && return 0
  done
  return 1
}

collect_projects() {
  local dir="$1"
  local depth="$2"
  [[ "$depth" -gt "$MAX_DEPTH" ]] && return

  if is_project_root "$dir"; then
    echo "$dir"
    return
  fi

  while IFS= read -r subdir; do
    collect_projects "$subdir" $(( depth + 1 ))
  done < <(find "$dir" -mindepth 1 -maxdepth 1 -type d \
    ! -name "node_modules" ! -name ".git" ! -name ".venv" \
    ! -name "__pycache__" ! -name "dist" ! -name "build" ! -name "packages")
}

collect_projects "$BASE_DIR" 0
```

### Step 3: Collect additional metadata
For each valid project, gather:
- **Type tags** based on matched markers (multi-select):
  - Node.js (`package.json`)
  - Python (`requirements.txt` / `pyproject.toml` / `setup.py`)
  - Docker (`Dockerfile` / `dockerfile`)
  - Docker Compose (`docker-compose.yml` / `docker-compose.yaml` / `compose.yml` / `compose.yaml`)
  - Go (`go.mod`), Rust (`Cargo.toml`), Java (`pom.xml` / `build.gradle`)
  - C/C++ (`CMakeLists.txt`), PHP (`composer.json`), Ruby (`Gemfile`)
  - Git (`.git`)
- **Description**: read `description` from `package.json`, or first non-heading line of `README.md` (max 80 chars)
- **Last commit**: `git -C <dir> log -1 --format="%ar" 2>/dev/null` (show `—` for non-Git projects)
- **CLAUDE.md**: check if `<dir>/CLAUDE.md` exists — show ✅ if yes, ❌ if no
- **Version**: if CLAUDE.md exists, read `skill_version` from frontmatter (e.g. `"2.0"`); show `—` if missing or field not present

### Step 3.5: Preserve existing "Active" column values
Before outputting, read the existing `projects-list.md` (if it exists) and parse the "Active" column value for each row (path → active value mapping):
- If the path exists in the current file → keep the existing active value (✅ or ❌)
- If the path is new (not in the existing file) → default to ✅

### Step 4: Output Markdown file
Output to `projects-list.md` in the **current working directory** (where Claude Code was launched).
Use `pwd` to get the current directory; output path is `<current directory>/projects-list.md`.

Format:

```markdown
# Project List
> Scan path: ~/project
> Scanned at: YYYY-MM-DD
> Found N valid projects

---

## Projects

| # | Active | Project Name | Path | Type | Last Commit | CLAUDE.md | Version | Description |
|---|--------|-------------|------|------|-------------|-----------|---------|-------------|
| 1 | ✅ | project-name | ~/project/project-name | Node.js, Docker | 3 days ago | ✅ | 2.0 | Short description |
| 2 | ❌ | another-project | ~/project/another-project | Python | 1 week ago | ❌ | — | Short description |

---

## Usage
1. Set the "Active" column to ❌ to mark projects you don't want to track
2. Run `/scan-projects` to re-scan — **existing "Active" values are preserved**, new projects default to ✅
```

### Step 5: Report results
- Tell the user the output path (full path)
- Briefly summarize the scan results (total projects, most common types)
- Remind the user they can manually remove rows they don't need

## Notes
- A directory that matches a marker is treated as a project root — do not recurse into it (avoids duplicate listing of submodules)
- Max scan depth is 4 levels from the root
- `projects-list.md` is written to the current working directory; each scan **overwrites** the content but **preserves** existing "Active" column values per path
- New projects (paths not in the existing file) default to ✅ for "Active"
- If the root is not `~/project`, remember the user-specified path
