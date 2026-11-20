/**
 * Leonida Trophy Guide — entry program.
 *
 * Hands the guide in: copies app/ and screenshots/ from this repository into
 * the output directory and writes dossier.json there, built with buildDossier
 * from vendor/makefun-frontend.ts. The output directory is /output in the
 * grader, or $MAKEFUN_OUTPUT_DIR anywhere else. Node 22, standard library
 * only. The run is deterministic: the same repository always writes the
 * same bytes, so the grader's two runs agree.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

/** The repository this program runs from: the directory holding main.ts. */
const REPO_ROOT = dirname(fileURLToPath(import.meta.url));

/** Where the entry goes: /output in the grader, $MAKEFUN_OUTPUT_DIR outside it. */
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

/** The gate's caps, as RULES.txt states them: the dossier's text, the
 *  screenshots, and the app tree must all fit inside these. */
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000
};

/** Copy a whole directory tree, file by file, bytes unchanged. */
function copyTree(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true, dereference: false });
}

/** Require a directory to exist in the repository, or stop with a clear error. */
function requireDir(path: string, label: string): void {
  if (!existsSync(path)) {
    throw new Error('main.ts: ' + label + ' is missing from the repository at ' + path);
  }
}

function main(): void {
  const appDir = join(REPO_ROOT, 'app');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  requireDir(appDir, 'app/');
  requireDir(shotsDir, 'screenshots/');
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTree(appDir, join(OUTPUT_DIR, 'app'));
  copyTree(shotsDir, join(OUTPUT_DIR, 'screenshots'));
  const dossier = buildDossier(REPO_ROOT, DOSSIER_CAPS);
  const dossierPath = join(OUTPUT_DIR, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  console.log('main.ts: wrote ' + dossier.length + ' dossier bytes to ' + dossierPath);
}

try {
  main();
} catch (error) {
  console.error('main.ts: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
