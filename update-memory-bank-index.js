// update-memory-bank-index.js
// Usage: node update-memory-bank-index.js
// Scans memory-bank/ for .md files and updates the file index in memory-bank/README.md

const fs = require('fs');
const path = require('path');

const MEMORY_BANK_DIR = path.join(__dirname, 'memory-bank');
const README_PATH = path.join(MEMORY_BANK_DIR, 'README.md');
const SECTION_HEADER = '## Memory Bank File Index (Required Reading)';

function getMarkdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
}

function generateFileList(files) {
  return files.map(f => `- ${f}`).join('\n');
}

function updateReadme(readme, fileList) {
  const sectionRegex = new RegExp(`(${SECTION_HEADER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([\s\S]*?)(?=^## |\n# |\n\Z)`, 'm');
  const newSection = `${SECTION_HEADER}\n${fileList}\n`;
  if (sectionRegex.test(readme)) {
    return readme.replace(sectionRegex, newSection);
  } else {
    return readme.trimEnd() + '\n\n' + newSection;
  }
}

function main() {
  const files = getMarkdownFiles(MEMORY_BANK_DIR);
  const fileList = generateFileList(files);
  let readme = '';
  try {
    readme = fs.readFileSync(README_PATH, 'utf8');
  } catch (e) {
    readme = '# Memory Bank README\n';
  }
  const updated = updateReadme(readme, fileList);
  fs.writeFileSync(README_PATH, updated, 'utf8');
  console.log('Memory Bank file index updated.');
}

main(); 