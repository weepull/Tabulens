// Refreshes the committed copies of the demo datasets in public/examples/ from
// the repo's /examples. The web app deploys to Vercel on its own, where the repo
// root is not served, so the files have to live (and be committed) inside web/.
// examples/kaggle is deliberately left out: it is large and not wired to a button.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = ['loans_train.csv', 'loans_test.csv', 'study_clean.csv'];

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(web, '..', 'examples');
const dest = join(web, 'public', 'examples');

// public/examples/ is committed, so a Vercel build that only uploads web/ still
// has the files. Here ../examples is missing; keep the committed copies, but
// fail the build if they are missing too, rather than deploy buttons that 404.
if (!existsSync(src)) {
  const missing = FILES.filter((name) => !existsSync(join(dest, name)));
  if (missing.length > 0) {
    console.error(`sync-examples: ${src} not found and public/examples/ is missing ${missing.join(', ')}`);
    process.exit(1);
  }
  console.warn(`sync-examples: ${src} not found, using the committed copies in public/examples/`);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const name of FILES) copyFileSync(join(src, name), join(dest, name));
console.log(`sync-examples: copied ${FILES.length} files to public/examples/`);
