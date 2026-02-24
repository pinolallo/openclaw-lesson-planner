# Lesson Planner Skill - Quick Guide

This skill for OpenClaw is a simplified version of https://github.com/saniales/ai-lesson-planner by Alessandro Sanino that offers extended features like course competitive analysis, but requires GitHub Actions and therefore Copilot. This version allows the use of different models and OpenRouter keys.

## Installation

1. In the skill folder:
```bash
cd /path/to/lesson-planner-skill
npm install
```

2. Configure API key:
   - **OpenAI:** `export OPENAI_API_KEY="sk-..."`
   - **OpenRouter** (recommended for more model choices): `export OPENROUTER_API_KEY="sk-or-..."`
     Optional: `OPENROUTER_REFERER` (default: https://openclaw.ai) and `OPENROUTER_TITLE` (default: OpenClaw Lesson Planner).
   You can also use a `.env` file with these variables.

### Override endpoint

Use `--base-url <url>` to specify a custom API endpoint (e.g., for providers compatible with OpenAI). When using OpenRouter, the endpoint is automatic.

3. Install the binary globally (optional):
```bash
npm link
```
Now `lesson-planner` will be available everywhere.

## Quick usage

```bash
# 1) Plan a course (in the desired directory)
lesson-planner plan-course \
  --title "Introduction to Python" \
  --audience "high school seniors" \
  --lessons 12 \
  --topics "basic syntax, data types, functions, OOP, files" \
  --lang it \
  --output-dir ./lessons

# 2) Scaffold all lessons (in the same output directory)
lesson-planner scaffold-course --output-dir ./lessons

# 3) Generate content for each lesson (one at a time)
lesson-planner generate-lesson \
  --number 01 \
  --id "intro-python" \
  --title "Introduction to Python" \
  --lang it \
  --output-dir ./lessons

# 4) (optional) Export PDF (all lessons)
lesson-planner export-pdf --output-dir ./lessons

# or single lesson
lesson-planner export-pdf --lesson "intro-python" --output-dir ./lessons
```

## Notes

- Use `--output-dir` to specify the output directory for course files.
- Alternatively, you can set the `LESSON_PLANNER_CONFIG_DIR` environment variable.
- Model selection: automatic per command.
  - `plan-course`: high-quality reasoning (OpenAI: `gpt-4o`, OpenRouter: `anthropic/claude-3.5-sonnet`)
  - `generate-lesson`: fast and cost-effective (OpenAI: `gpt-4o-mini`, OpenRouter: `stepfun/step-3.5-flash:free`)
  Override with `--model` when needed.
- This skill is independent of OpenClaw; you can also use it from the command line.

## Integration with OpenClaw

Once installed, the skill will be available as an OpenClaw command if registered in the skill manifest. Consult the OpenClaw documentation on how to add custom skills.
