#!/usr/bin/env node

/**
 * Lesson Planner Skill for OpenClaw
 * Entry point per i comandi: plan-course, generate-lesson, scaffold-course, export-pdf
 */

const { program } = require('commander');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Helper: calcola i percorsi in base a options
function getConfigPaths(options) {
  const base = options.outputDir
    ? path.resolve(options.outputDir)
    : (process.env.LESSON_PLANNER_CONFIG_DIR || process.cwd());
  return {
    base,
    lessonsDir: path.join(base, 'lessons'),
    configFile: path.join(base, '.lesson-config.json'),
    artifactsBase: path.join(base, '.lesson/artifacts')
  };
}

// Helper: crea client OpenAI compatibile con OpenRouter
function createOpenAIClient(options) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('API key non trovata. Imposta OPENROUTER_API_KEY o OPENAI_API_KEY.');
  }
  let baseURL = options.baseUrl;
  if (!baseURL) {
    baseURL = process.env.OPENROUTER_API_KEY
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';
  }
  const headers = {};
  // Aggiungi header specifici per OpenRouter se stiamo usando il loro endpoint
  if (baseURL.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER || 'https://openclaw.ai';
    headers['X-Title'] = process.env.OPENROUTER_TITLE || 'OpenClaw Lesson Planner';
  }
  return new OpenAI({ apiKey, baseURL, headers });
}

// Utility: assicura directory esistenti
function ensureDirs(paths) {
  if (!fs.existsSync(paths.lessonsDir)) {
    fs.mkdirSync(paths.lessonsDir, { recursive: true });
  }
  const artifactsDirs = [
    path.join(paths.artifactsBase, 'highlights'),
    path.join(paths.artifactsBase, 'discourse'),
    path.join(paths.artifactsBase, 'slides')
  ];
  artifactsDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

// Parser JSON robusto
function parseJsonResponse(content) {
  let trimmed = content.trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) throw new Error('Nessun JSON nella risposta');
  let jsonStr = trimmed.slice(firstBrace, lastBrace + 1);
  jsonStr = jsonStr.replaceAll('```json', '').replaceAll('```', '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('JSON malformato: ' + e.message + '\nContenuto: ' + jsonStr.substring(0, 200) + '...');
  }
}

// Comando: plan-course
async function planCourse(options) {
  console.log(`\n📚 Pianificazione corso: ${options.title}\n`);
  const paths = getConfigPaths(options);
  ensureDirs(paths);

  const prompt = `
Sei un instructional designer esperto. Crea un outline dettagliato per un corso.

Dati utente:
- Titolo: ${options.title}
- Destinatari: ${options.audience}
- Numero lezioni: ${options.lessons}
- Argomenti/Temi: ${options.topics}
- Durata per lezione: ${options.duration || 'non specificata'}
- Lingua: ${options.lang || 'it'}

IMPORTANTE: Restituisci ESCLUSIVAMENTE un oggetto JSON valido. Niente testo prima, niente dopo. Niente markdown. Niente commenti.

Struttura JSON richiesta:

{
  "course": {
    "title": "${options.title}",
    "audience": "${options.audience}",
    "totalLessons": ${options.lessons},
    "durationPerLesson": "${options.duration || ''}",
    "language": "${options.lang || 'it'}",
    "description": "breve descrizione del corso (2-3 righe)"
  },
  "lessons": [
    {
      "number": "01",
      "id": "lezione-1-slug",
      "title": "Titolo della lezione",
      "module": "Modulo di appartenenza (es: Fondamenti)",
      "status": "planned"
    }
    // ... fino a N lezioni
  ]
}

Regole:
- Crea progressione logica: fondamenti -> pratica -> applicazione -> consolidamento
- Gli ID devono essere slug minuscoli con trattini
- I titoli devono essere chiari e concisi
- Non usare commenti JSON (//)
- Non aggiungere nulla oltre il JSON.
`;

  try {
    const client = createOpenAIClient(options);
    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const data = parseJsonResponse(response.choices[0].message.content);

    // Scrivi configurazione
    fs.writeFileSync(paths.configFile, JSON.stringify(data, null, 2));
    console.log('✓ Configurazione corso salvata in .lesson-config.json');

    // Scrivi lessons/README.md
    const readme = `# ${data.course.title}\n\n${data.course.description}\n\n## Programma\n\n| # | ID | Titolo | Modulo | Stato |\n|---|----|--------|--------|-------|\n`;
    const rows = data.lessons.map(l => `| ${l.number} | \`${l.id}\` | ${l.title} | ${l.module} | ${l.status} |`).join('\n');
    const fullReadme = readme + rows + '\n';
    fs.writeFileSync(path.join(paths.lessonsDir, 'README.md'), fullReadme);
    console.log('✓ Indice lezioni creato in lessons/README.md\n');

    console.log('Prossimi passi:');
    console.log('  1) Scaffold completo: lesson-planner scaffold-course');
    console.log('  2) Oppure scaffolding per singola lezione:');
    data.lessons.forEach(l => {
      console.log(`     ./scripts/generate-lesson.sh ${l.number} ${l.id} "${l.title}"`);
    });
    console.log('\n');

  } catch (err) {
    console.error('❌ Errore:', err.message);
    process.exit(1);
  }
}

// Comando: generate-lesson
async function generateLesson(options) {
  console.log(`\n📝 Generazione lezione: ${options.title} (${options.number}/${options.id})\n`);
  const paths = getConfigPaths(options);
  ensureDirs(paths);

  // Leggi contesto corso se disponibile
  let courseContext = '';
  let courseLang = options.lang || 'it';
  if (fs.existsSync(paths.configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(paths.configFile, 'utf-8'));
      const c = config.course;
      courseContext = `
Contesto del corso:
- Titolo: ${c.title}
- Pubblico: ${c.audience}
- Descrizione: ${c.description}
- Lingua: ${c.language}
`;
      courseLang = c.language;
    } catch (e) {
      console.warn('⚠️  Impossibile leggere .lesson-config.json, proseguo senza contesto.');
    }
  } else {
    console.warn('⚠️  Nessuna configurazione corso trovata. Creane una con `plan-course` prima di generare lezioni.');
  }

  const lessonDir = path.join(paths.lessonsDir, `lesson-${options.number}-${options.id}`);
  if (!fs.existsSync(lessonDir)) {
    fs.mkdirSync(lessonDir, { recursive: true });
  }

  const prompt = `
Sei un esperto di didattica e curriculum design.

${courseContext}

Crea contenuti per una singola lezione.

Dati lezione:
- Titolo: ${options.title}
- Numero: ${options.number}
- ID: ${options.id}

Restituisci ESCLUSIVAMENTE un oggetto JSON con:

{
  "highlights": [
    "punto chiave 1",
    "punto chiave 2",
    "..."
  ],
  "discourse": "Testo completo della lezione, strutturato in paragrafi. Spiega concetti, fornisci esempi, transizioni fluide.",
  "slides": [
    { "title": "Titolo slide 1", "content": "Contenuto in markdown (MARP), eventualmente con note per il docente" },
    ...
  ]
}

Requisiti:
- Highlights: 5-7 punti massimi, bullet-type
- Discourse: circa 1000-1500 parole, adatto a ${options.audience || 'studenti'}
- Slides: circa 10-15 slide, formato MARKDOWN (MARP). Prima slide: titolo e info lezione.
- Se la lingua specificata è '${courseLang}', genera in quella lingua.
- Solo JSON, niente annotazioni.
`;

  try {
    const client = createOpenAIClient(options);
    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const data = parseJsonResponse(response.choices[0].message.content);

    // Scrivi artefatti
    fs.writeFileSync(path.join(paths.artifactsBase, 'highlights', `lesson-${options.number}-${options.id}.md`), `# Highlights\n\n${data.highlights.map(h => `- ${h}`).join('\n')}`);
    fs.writeFileSync(path.join(paths.artifactsBase, 'discourse', `lesson-${options.number}-${options.id}.md`), `# ${options.title}\n\n${data.discourse}`);
    fs.writeFileSync(path.join(paths.artifactsBase, 'slides', `lesson-${options.number}-${options.id}.md`), `<!--\n  Lezione: ${options.title}\n  ID: ${options.id}\n  Numero: ${options.number}\n-->\n\n---\n# ${options.title}\n\n---\n\n${data.slides.map(s => `## ${s.title}\n\n${s.content}\n`).join('\n---\n\n')}`);

    console.log('✓ Artefatti generati in .lesson/artifacts/');
    console.log(`  - highlights/lesson-${options.number}-${options.id}.md`);
    console.log(`  - discourse/lesson-${options.number}-${options.id}.md`);
    console.log(`  - slides/lesson-${options.number}-${options.id}.md`);
    console.log('\n');

  } catch (err) {
    console.error('❌ Errore:', err.message);
    process.exit(1);
  }
}

// Comando: scaffold-course
function scaffoldCourse(options) {
  console.log('\n🔨 Scaffolding corso completo...\n');
  const paths = getConfigPaths(options);
  if (!fs.existsSync(paths.configFile)) {
    console.error('❌ File .lesson-config.json non trovato. Esegui plan-course prima.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(paths.configFile, 'utf-8'));
  config.lessons.forEach(lesson => {
    const lessonDir = path.join(paths.lessonsDir, `lesson-${lesson.number}-${lesson.id}`);
    if (fs.existsSync(lessonDir) && !options.force) {
      console.log(`⏭️  ${lessonDir} esiste già. Usa --force per sovrascrivere.`);
      return;
    }
    fs.mkdirSync(lessonDir, { recursive: true });
    // Creiamo un file README base nella lezione
    fs.writeFileSync(path.join(lessonDir, 'README.md'), `# ${lesson.title}\n\nContenuti da generare con generate-lesson.\n`);
    console.log(`✓Creato: ${lessonDir}`);
  });
  console.log('\nScaffolding completato.\n');
}

// Comando: export-pdf
function exportPdf(options) {
  console.log('\n🖨️  Esportazione PDF (richiede MARP)...\n');
  const paths = getConfigPaths(options);
  const slidesDir = path.join(paths.artifactsBase, 'slides');
  if (!fs.existsSync(slidesDir)) {
    console.error('❌ Nessuna slide trovata in .lesson/artifacts/slides');
    process.exit(1);
  }

  // Leggi tutti i file .md
  const allFiles = fs.readdirSync(slidesDir).filter(f => f.endsWith('.md'));
  let files = allFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // ordina numericamente

  // Se specificata una singola lezione (parziale ID), filtra
  if (options.lesson) {
    const match = allFiles.find(f => f.includes(options.lesson));
    if (!match) {
      console.error(`❌ Nessuna slide trovata per la lezione: ${options.lesson}`);
      process.exit(1);
    }
    files = [match];
  }

  if (files.length === 0) {
    console.error('❌ Nessun file markdown trovato');
    process.exit(1);
  }

  // Combina i markdown in un unico contenuto, separando con --- per MARP
  const combined = files.map(f => {
    const content = fs.readFileSync(path.join(slidesDir, f), 'utf-8');
    return content.trim();
  }).join('\n---\n');

  // Scrivi file temporaneo combinato
  const combinedFile = path.join(paths.base, 'SLIDES-combined.md');
  fs.writeFileSync(combinedFile, combined);

  // Determina nome output: se una singola lezione, usa il nome della lezione; altrimenti SLIDES.pdf
  const outputPdfName = files.length === 1
    ? files[0].replace(/\.md$/, '.pdf')
    : 'SLIDES.pdf';
  const outputPdf = path.join(paths.base, outputPdfName);

  // Converti con marp
  const { execSync } = require('child_process');
  try {
    execSync(`marp ${combinedFile} -o ${outputPdf}`, { stdio: 'inherit' });
    console.log(`✓ PDF generato: ${outputPdfName} (da ${files.length} file)`);
    // Pulizia file temporaneo
    fs.unlinkSync(combinedFile);
  } catch (e) {
    console.error('❌ Errore durante esportazione MARP. Assicurati che marp sia installato.');
    process.exit(1);
  }
}

// CLI
program
  .name('lesson-planner')
  .description('Skill per pianificare corsi e generare lezioni per OpenClaw')
  .version('0.1.0')
  .option('--base-url <url>', 'Custom API base URL (default: OpenAI o OpenRouter in base alla env)');

program.command('plan-course')
  .requiredOption('--title <string>', 'Titolo del corso')
  .requiredOption('--audience <string>', 'Destinatari del corso')
  .requiredOption('--lessons <number>', 'Numero di lezioni')
  .option('--topics <string>', 'Argomenti principali, separati da virgola')
  .option('--duration <string>', 'Durata per lezione (es: 90 min)')
  .option('--lang <string>', 'Lingua (it, en)', 'it')
  .option('--model <string>', 'Modello AI (OpenAI o OpenRouter con namespace)', 'gpt-4o-mini')
  .option('--output-dir <string>', 'Directory di output per i file del corso (default: CWD)')
  .action(planCourse);

program.command('generate-lesson')
  .requiredOption('--number <string>', 'Numero lezione (es: 01)')
  .requiredOption('--id <string>', 'ID slug della lezione (es: intro-python)')
  .requiredOption('--title <string>', 'Titolo della lezione')
  .option('--lang <string>', 'Lingua (it, en)', 'it')
  .option('--model <string>', 'Modello AI (OpenAI o OpenRouter con namespace)', 'gpt-4o-mini')
  .option('--output-dir <string>', 'Directory di output per i file del corso (default: CWD)')
  .action(generateLesson);

program.command('scaffold-course')
  .option('--force', 'Forza sovrascrittura delle lezioni esistenti')
  .option('--output-dir <string>', 'Directory di output per i file del corso (default: CWD)')
  .action(scaffoldCourse);

program.command('export-pdf')
  .option('--lesson <string>', 'Percorso lezione specifica (opzionale)')
  .option('--output-dir <string>', 'Directory di output per i file del corso (default: CWD)')
  .action(exportPdf);

program.parse();
