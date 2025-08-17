import { build } from 'esbuild';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rmSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Clean dist directory
try {
  rmSync(join(__dirname, 'dist'), { recursive: true, force: true });
} catch {
  // Directory might not exist
}

// Create dist directory
mkdirSync(join(__dirname, 'dist'), { recursive: true });

// Find all TypeScript files
const entryPoints = glob.sync('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'],
});

console.log(`Building ${entryPoints.length} files...`);

try {
  await build({
    entryPoints,
    outdir: 'dist',
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    sourcemap: false,
    minify: false,
    bundle: false,
    outExtension: { '.js': '.js' },
    allowOverwrite: true,
    logLevel: 'info',
  });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
