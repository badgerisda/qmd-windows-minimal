import { existsSync } from 'node:fs';
import { dirname, isAbsolute, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const question = process.argv.slice(2).join(' ').trim();
if (!question) {
  console.error('Verwendung: npm run search -- "Suchfrage"');
  process.exit(2);
}

const projectRoot = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(projectRoot, 'qmd-data');
const configDir = resolve(dataRoot, 'config');
const cacheRoot = resolve(dataRoot, 'cache');
const configPath = resolve(configDir, 'index.yml');
const dbPath = resolve(cacheRoot, 'qmd', 'index.sqlite');

function isWithin(candidate, root) {
  const value = relative(resolve(root), resolve(candidate));
  return value === '' || (!value.startsWith('..') && !value.includes(':'));
}

function assertProjectLocalPaths() {
  for (const candidate of [configDir, cacheRoot, configPath, dbPath]) {
    if (!isWithin(candidate, dataRoot)) {
      throw new Error('Ein QMD-Laufzeitpfad liegt außerhalb von qmd-data.');
    }
  }
}

function relativeDocumentPath(result) {
  const collection = String(result.collectionName ?? '').replaceAll('\\', '/');
  const displayPath = String(result.displayPath ?? '').replaceAll('\\', '/');
  const normalizedDisplayPath = posix.normalize(displayPath);
  const combined = normalizedDisplayPath === collection || normalizedDisplayPath.startsWith(`${collection}/`)
    ? normalizedDisplayPath
    : posix.normalize(posix.join(collection, normalizedDisplayPath));
  if (
    !collection ||
    !displayPath ||
    isAbsolute(displayPath) ||
    /^[A-Za-z]:/.test(displayPath) ||
    combined === '..' ||
    combined.startsWith('../')
  ) {
    throw new Error('QMD lieferte keinen sicheren relativen Dokumentpfad.');
  }
  return combined;
}

function printResults(label, results) {
  console.log(`\n${label}`);
  if (results.length === 0) {
    console.log('  Keine Treffer.');
    return;
  }
  results.slice(0, 5).forEach((result, index) => {
    const numericScore = Number(result.score);
    const score = Number.isFinite(numericScore)
      ? numericScore !== 0 && Math.abs(numericScore) < 0.0001
        ? numericScore.toExponential(4)
        : numericScore.toFixed(4)
      : 'n/a';
    console.log(`  ${index + 1}. ${result.title || '(ohne Titel)'}`);
    console.log(`     Dokument: ${relativeDocumentPath(result)}`);
    console.log(`     Score: ${score}`);
  });
}

function sanitizeError(error) {
  return String(error?.message ?? error).split(projectRoot).join('.');
}

assertProjectLocalPaths();
process.chdir(projectRoot);

if (!existsSync(configPath)) {
  console.error('Suche fehlgeschlagen: qmd-data/config/index.yml fehlt.');
  process.exit(3);
}
if (!existsSync(dbPath)) {
  console.error('Suche fehlgeschlagen: Der Index fehlt. Bitte zuerst "npm run index" ausführen.');
  process.exit(3);
}

// Diese Zuweisungen müssen vor dem dynamischen QMD-Import erfolgen.
process.env.QMD_CONFIG_DIR = configDir;
process.env.XDG_CACHE_HOME = cacheRoot;

let store;
try {
  const { createStore } = await import('@tobilu/qmd');
  store = await createStore({ dbPath, configPath });

  const lexicalResults = await store.searchLex(question, { limit: 5 });
  const vectorResults = await store.searchVector(question, { limit: 5 });

  console.log(`Frage: ${question}`);
  printResults('BM25 mit searchLex()', lexicalResults);
  printResults('Vektorsuche mit searchVector()', vectorResults);
} catch (error) {
  console.error(`Suche fehlgeschlagen: ${sanitizeError(error)}`);
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
