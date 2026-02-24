---
name: lesson-planner
description: Pianifica corsi e genera lezioni interattive con supporto per outline, contenuti e slide. Ispirato a ai-lesson-planner, ottimizzato per OpenClaw.
homepage: https://github.com/openclaw/lesson-planner-skill
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
              "label": "Installa lesson-planner (npm)",
            },
          ],
      },
  }
---

# Lesson Planner

Skill per creare corsi strutturati e generare materiale didattico direttamente da OpenClaw.

## Quando usarla (trigger)

Usa subito quando l'utente chiede:

- "pianifica un corso su..."
- "crea un lesson plan per..."
- "genera materiale didattico per..."
- "voglio preparare una lezione su..."

## Comandi

### `plan-course`

Genera l'outline completo di un corso, con progressione logica, metadati e scaffolding delle lezioni.

```bash
lesson-planner plan-course --title "Introduzione a Python" --audience "studenti superiori" --lessons 12 --topics "basi, dati, funzioni, oggetti" --output-dir ./lezioni
```

Output (in `--output-dir`):
- `lessons/README.md` — indice del corso
- `.lesson-config.json` — configurazione corso
- Prompt per lezione singola

### `generate-lesson`

Genera contenuti per una lezione specifica (discorso, highlights, slide).

```bash
lesson-planner generate-lesson --number 01 --id "intro-python" --title "Introduzione a Python" --output-dir ./lezioni
```

Output:
- `.lesson/artifacts/highlights/`
- `.lesson/artifacts/discourse/`
- `.lesson/artifacts/slides/` (Markdown)

### `scaffold-course`

Crea le cartelle per tutte le lezioni definite in `.lesson-config.json`.

```bash
lesson-planner scaffold-course [--force] --output-dir ./lezioni
```

### `export-pdf`

Esporta le slide in PDF (richiede MARP). Combina automaticamente tutte le slide in ordine numerico.

```bash
# Tutte le lezioni in unico PDF
lesson-planner export-pdf --output-dir ./lezioni

# Singola lezione (PDF col nome della lezione)
lesson-planner export-pdf --lesson "lezione-1-introduzione-architettura" --output-dir ./lezioni
```

**Nota:** `--lesson` accetta parte dell'ID o del filename della lezione (es: `lezione-1` o `introduzione`). Se omesso, combina tutte le lezioni in `SLIDES.pdf`.

## Configurazione

### Provider e API key

**OpenAI (default):**
- Imposta `OPENAI_API_KEY` con la tua chiave.

**OpenRouter (consigliato per più scelta di modelli):**
- Imposta `OPENROUTER_API_KEY`.
- Opzionale: `OPENROUTER_REFERER` (default: https://openclaw.ai) e `OPENROUTER_TITLE` (default: OpenClaw Lesson Planner).
- Usa l'opzione `--base-url` per specificare endpoint diversi.
- I modelli vanno specificati con namespace, es: `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`.

### Altri parametri

- Modello: `--model <string>` (default: `gpt-4o-mini` per OpenAI; per OpenRouter usa un modello completo come `openai/gpt-4o-mini`).
- Lingua: `--lang it|en` (default: `it`).
- Base URL: `--base-url <url>` per override manuale dell’endpoint API (es. per provider compatibili).
- Directory di output: `--output-dir <path>` (default: directory corrente). Specifica dove salvare i file del corso.
- Lezione: `--lesson <string>` – esporta solo la lezione specificata (opzionale).

### Esempi

OpenRouter:
```bash
export OPENROUTER_API_KEY="sk-or-..."
lesson-planner plan-course --title "Corso su Claude" --audience "sviluppatori" --lessons 5 --topics "claude,prompt engineering" --model "anthropic/claude-3.5-sonnet" --lang it
```

## Workflow tipico

```bash
# 1) Progetta il corso
lesson-planner plan-course --title "Corso di JavaScript" --audience "principianti" --lessons 10 --topics "variabili, funzioni, DOM, eventi"

# 2) Scaffold delle lezioni
lesson-planner scaffold-course

# 3) Genera contenuti per ogni lezione (in chat o批处理)
lesson-planner generate-lesson --number 01 --id "js-basics" --title "Le basi di JavaScript"

# 4) Esporta PDF (tutte le lezioni)
lesson-planner export-pdf --output-dir ./lezioni

# oppure singola lezione
lesson-planner export-pdf --lesson "js-basics" --output-dir ./lezioni
```

## Integrazione con OpenClaw

La skill può essere invocata da chat con `/lesson-planner <comando>` o da sub-agent per automatizzare la creazione di corsi.

## Note

- I contenuti sono generati via LLM; revisione umana consigliata.
- Le slide usano formato MARKDOWN (MARP-compatibile).
- Licenza: MIT (adatta per skill OpenClaw).
