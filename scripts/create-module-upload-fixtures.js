const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_ROOT = path.join(ROOT, 'docs', 'test-modules', 'upload-fixtures');
const DIST_ROOT = path.join(ROOT, 'docs', 'test-modules', 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function resetDirectory(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function createFixtures() {
  const hostedNoHtmlDir = path.join(FIXTURE_ROOT, 'hosted-no-html');
  const bundleWithHtmlDir = path.join(FIXTURE_ROOT, 'bundle-with-html');
  const invalidNoHtmlDir = path.join(FIXTURE_ROOT, 'invalid-no-html');

  resetDirectory(FIXTURE_ROOT);
  resetDirectory(DIST_ROOT);

  writeFile(
    path.join(hostedNoHtmlDir, 'bundle.js'),
    "console.log('Mock hosted module bundle loaded');\n"
  );
  writeFile(
    path.join(hostedNoHtmlDir, 'assets', 'config.json'),
    JSON.stringify({ module: 'mock-hosted-no-html', version: '1.0.0' }, null, 2)
  );

  writeFile(
    path.join(bundleWithHtmlDir, 'index.html'),
    [
      '<!doctype html>',
      '<html>',
      '  <head><meta charset="utf-8"><title>Mock Bundle Module</title></head>',
      '  <body>',
      '    <h1>Mock Bundle Module</h1>',
      '    <script src="./main.js"></script>',
      '  </body>',
      '</html>',
      '',
    ].join('\n')
  );
  writeFile(
    path.join(bundleWithHtmlDir, 'main.js'),
    "document.body.setAttribute('data-module-ready', 'true');\n"
  );

  writeFile(
    path.join(invalidNoHtmlDir, 'README.txt'),
    'Intentionally missing HTML entry for negative test coverage.\n'
  );
}

function zipFixture(sourceDirName, outputFileName) {
  const sourceDir = path.join(FIXTURE_ROOT, sourceDirName);
  const outputFile = path.join(DIST_ROOT, outputFileName);
  const escapedOutput = outputFile.replace(/"/g, '\\"');
  execSync(`cd "${sourceDir}" && zip -rq "${escapedOutput}" .`, { stdio: 'inherit' });
}

function main() {
  createFixtures();

  zipFixture('hosted-no-html', 'mock-hosted-no-html.zip');
  zipFixture('bundle-with-html', 'mock-bundle-with-html.zip');
  zipFixture('invalid-no-html', 'mock-invalid-no-html.zip');

  console.log('Created module upload fixtures:');
  console.log(`- ${path.relative(ROOT, path.join(DIST_ROOT, 'mock-hosted-no-html.zip'))}`);
  console.log(`- ${path.relative(ROOT, path.join(DIST_ROOT, 'mock-bundle-with-html.zip'))}`);
  console.log(`- ${path.relative(ROOT, path.join(DIST_ROOT, 'mock-invalid-no-html.zip'))}`);
}

main();
