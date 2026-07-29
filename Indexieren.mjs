import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const knowledgeRoot = resolve(projectRoot, 'beispielwissen');
const dataRoot = resolve(projectRoot, 'qmd-data');
const configDir = resolve(dataRoot, 'config');
const cacheRoot = resolve(dataRoot, 'cache');
const dbDir = resolve(cacheRoot, 'qmd');
const configPath = resolve(configDir, 'index.yml');
const dbPath = resolve(dbDir, 'index.sqlite');

function isWithin(candidate, root) {
  const value = relative(resolve(root), resolve(candidate));
  return value === '' || (!value.startsWith('..') && !value.includes(':'));
}

function assertProjectLocalPaths() {
  for (const candidate of [knowledgeRoot, dataRoot]) {
    if (!isWithin(candidate, projectRoot)) {
      throw new Error('Ein Projektpfad liegt außerhalb des Minimalprojekts.');
    }
  }
  for (const candidate of [configDir, cacheRoot, dbDir, configPath, dbPath]) {
    if (!isWithin(candidate, dataRoot)) {
      throw new Error('Ein QMD-Laufzeitpfad liegt außerhalb von qmd-data.');
    }
  }
}

function sanitizeError(error) {
  return String(error?.message ?? error).split(projectRoot).join('.');
}

assertProjectLocalPaths();
process.chdir(projectRoot);
await mkdir(knowledgeRoot, { recursive: true });
await mkdir(configDir, { recursive: true });
await mkdir(dbDir, { recursive: true });

if (!existsSync(configPath)) {
  throw new Error('Die QMD-Konfiguration qmd-data/config/index.yml fehlt.');
}

// Diese Zuweisungen müssen vor dem dynamischen QMD-Import erfolgen.
process.env.QMD_CONFIG_DIR = configDir;
process.env.XDG_CACHE_HOME = cacheRoot;

let store;
try {
  const { createStore } = await import('@tobilu/qmd');
  store = await createStore({ dbPath, configPath });

  console.log('Indexiere die erfundenen Markdown-Dokumente ...');
  const updateResult = await store.update({
    collections: ['beispielwissen'],
    onProgress: ({ file, current, total }) => {
      console.log(`  ${current}/${total}: ${String(file).replaceAll('\\', '/')}`);
    },
  });

  console.log('Erzeuge nur fehlende Embeddings ...');
  const embedResult = await store.embed({
    force: false,
    collection: 'beispielwissen',
    onProgress: ({ chunksEmbedded, totalChunks }) => {
      console.log(`  Embeddings: ${chunksEmbedded}/${totalChunks}`);
    },
  });

  const status = await store.getStatus();
  console.log('Indexierung abgeschlossen.');
  console.log(`  Neu indexiert: ${updateResult.indexed}`);
  console.log(`  Aktualisiert: ${updateResult.updated}`);
  console.log(`  Unverändert: ${updateResult.unchanged}`);
  console.log(`  Eingebettete Chunks: ${embedResult.chunksEmbedded}`);
  console.log(`  Dokumente im Index: ${status.totalDocuments}`);
  console.log(`  Ausstehende Embeddings: ${status.needsEmbedding}`);
} catch (error) {
  console.error(`Indexierung fehlgeschlagen: ${sanitizeError(error)}`);
  process.exitCode = 1;
} finally {
  if (store) {
    try {
      await store.close();
    } catch (error) {
      console.error(`QMD-Store konnte nicht geschlossen werden: ${sanitizeError(error)}`);
      process.exitCode = 1;
    }
  }
}
