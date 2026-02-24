---
name: lesson-planner
description: Plan courses and generate interactive lessons with outline, content, and slides support. Inspired by ai-lesson-planner, optimized for OpenClaw.
homepage: https://github.com/pinolallo/openclaw-lesson-planner
metadata:
  {
    "openclaw":
      {
        "emoji": "📚",
        "requires": { "node": ">=18", "bins": ["node"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "file:./",
              "bins": ["lesson-planner"],
              "label": "Install lesson-planner (npm)",
            },
          ],
      },
  }
---

# Lesson Planner

Skill to create structured courses and generate teaching materials directly from OpenClaw.

## When to use (trigger)

Use immediately when the user asks:

- "plan a course on..."
- "create a lesson plan for..."
- "generate teaching material for..."
- "I want to prepare a lesson on..."

## Commands

### `plan-course`

Generates the complete course outline, with logical progression, metadata, and lesson scaffolding.

```bash
lesson-planner plan-course --title "Introduction to Python" --audience "high school seniors" --lessons 12 --topics "basics, data, functions, objects" --output-dir ./lessons
```

Output (in `--output-dir`):
- `lessons/README.md` — course index
- `.lesson-config.json` — course configuration
- Prompt for single lesson

### `generate-lesson`

Generates content for a specific lesson (discourse, highlights, slides).

```bash
lesson-planner generate-lesson --number 01 --id "intro-python" --title "Introduction to Python" --output-dir ./lessons
```

Output:
- `.lesson/artifacts/highlights/`
- `.lesson/artifacts/discourse/`
- `.lesson/artifacts/slides/` (Markdown)

### `scaffold-course`

Creates folders for all lessons defined in `.lesson-config.json`.

```bash
lesson-planner scaffold-course [--force] --output-dir ./lessons
```

### `export-pdf`

Exports slides to PDF (requires MARP). Automatically combines all slides in numerical order.

```bash
# All lessons in one PDF
lesson-planner export-pdf --output-dir ./lessons

# Single lesson (PDF named after the lesson)
lesson-planner export-pdf --lesson "lezione-1-introduzione-architettura" --output-dir ./lessons
```

**Note:** `--lesson` accepts part of the lesson ID or filename (e.g., `lezione-1` or `introduzione`). If omitted, combines all lessons into `SLIDES.pdf`.

## Configuration

### Provider and API key

**OpenAI (default):**
- Set `OPENAI_API_KEY` with your key.

**OpenRouter (recommended for more model choices):**
- Set `OPENROUTER_API_KEY`.
- Optional: `OPENROUTER_REFERER` (default: https://openclaw.ai) and `OPENROUTER_TITLE` (default: OpenClaw Lesson Planner).
- Use `--base-url` option to specify different endpoints.
- Models must be namespaced, e.g., `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`.

### Other parameters

- Model: `--model <string>` – specific AI model (OpenAI or OpenRouter with namespace). If omitted, a suitable default is chosen based on the command and provider (see below).
- Language: `--lang it|en` (default: `it`).
- Base URL: `--base-url <url>` to manually override API endpoint (e.g., for OpenAI-compatible providers).
- Output directory: `--output-dir <path>` (default: current directory). Specifies where to save course files.
- Lesson: `--lesson <string>` – export only the specified lesson (optional).

### Automatic model selection

If `--model` is not provided, the skill selects an appropriate model per command:

- `plan-course`: high-quality reasoning (OpenAI: `gpt-4o`, OpenRouter: `anthropic/claude-3.5-sonnet`)
- `generate-lesson`: fast and cost-effective (OpenAI: `gpt-4o-mini`, OpenRouter: `stepfun/step-3.5-flash:free`)

Overriding the default is possible with `--model`.

### Examples

OpenRouter:
```bash
export OPENROUTER_API_KEY="sk-or-..."
lesson-planner plan-course --title "Course on Claude" --audience "developers" --lessons 5 --topics "claude,prompt engineering" --model "anthropic/claude-3.5-sonnet" --lang it
```

## Typical workflow

```bash
# 1) Plan the course
lesson-planner plan-course --title "JavaScript Course" --audience "beginners" --lessons 10 --topics "variables, functions, DOM, events"

# 2) Scaffold the lessons
lesson-planner scaffold-course

# 3) Generate content for each lesson (in chat or batch)
lesson-planner generate-lesson --number 01 --id "js-basics" --title "JavaScript Basics"

# 4) Export PDF (all lessons)
lesson-planner export-pdf --output-dir ./lessons

# or single lesson
lesson-planner export-pdf --lesson "js-basics" --output-dir ./lessons
```

## Integration with OpenClaw

The skill can be invoked from chat with `/lesson-planner <command>` or by sub-agents to automate course creation.

## Notes

- Content is generated via LLM; human review is recommended.
- Slides use MARKDOWN format (MARP-compatible).
- License: MIT (suitable for OpenClaw skills).
