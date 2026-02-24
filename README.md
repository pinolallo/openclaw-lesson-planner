# Lesson Planner Skill - Guida rapida

## Installazione

1. Nella cartella della skill:
```bash
cd /path/to/lesson-planner-skill
npm install
```

2. Configura API key:
   - **OpenAI:** `export OPENAI_API_KEY="sk-..."`
   - **OpenRouter** (consigliato per più scelta di modelli): `export OPENROUTER_API_KEY="sk-or-..."`
     Opzionale: `OPENROUTER_REFERER` (default: https://openclaw.ai) e `OPENROUTER_TITLE` (default: OpenClaw Lesson Planner).
   Puoi anche usare un file `.env` con le variabili.

### Override endpoint

Usa `--base-url <url>` per specificare un endpoint API personalizzato (es. per provider compatibili con OpenAI). Quando usi OpenRouter, l'endpoint è automatico.

3. Installa il binario globalmente (opzionale):
```bash
npm link
```
Ora `lesson-planner` sarà disponibile ovunque.

## Utilizzo rapido

```bash
# 1) Progetta un corso (nella directory desiderata)
lesson-planner plan-course \
  --title "Introduzione a Python" \
  --audience "studenti del triennio superiore" \
  --lessons 12 \
  --topics "basi della sintassi, tipi di dati, funzioni, OOP, file" \
  --lang it \
  --output-dir ./lezioni

# 2) Scaffold tutte le lezioni (nella stessa directory di output)
lesson-planner scaffold-course --output-dir ./lezioni

# 3) Genera i contenuti per ogni lezione (una alla volta)
lesson-planner generate-lesson \
  --number 01 \
  --id "intro-python" \
  --title "Introduzione a Python" \
  --lang it \
  --output-dir ./lezioni

# 4) (opzionale) Esporta PDF (tutte le lezioni)
lesson-planner export-pdf --output-dir ./lezioni

# oppure singola lezione
lesson-planner export-pdf --lesson "intro-python" --output-dir ./lezioni --output-dir ./lezioni
```

## Note

- Usa `--output-dir` per specificare la directory di output dei file del corso.
- In alternativa, puoi impostare la variabile d'ambiente `LESSON_PLANNER_CONFIG_DIR`.
- Modello predefinito: `gpt-4o-mini` (OpenAI). Con OpenRouter usa modelli con namespace come `openai/gpt-4o-mini` o `anthropic/claude-3.5-sonnet`.
- Questa skill è indipendente da OpenClaw; puoi usarla anche da riga di comando.

## Integrazione con OpenClaw

 Una volta installata, la skill sarà disponibile come comando OpenClaw se registrata nel manifest delle skill. Consulta la documentazione OpenClaw su come aggiungere skill personalizzate.
