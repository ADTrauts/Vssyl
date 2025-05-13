#!/usr/bin/env node

const TestRunner = require('./test-runner');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const testDirectory = args[0] || path.join(process.cwd(), 'tests');
  
  try {
    const runner = new TestRunner(testDirectory);
    const results = await runner.runAndReport();
    
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 