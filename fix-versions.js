const fs = require('fs');
const path = require('path');

// Correct versions
const CORRECT_VERSIONS = {
  '@prisma/client': '^5.10.0',
  'prisma': '^5.10.0',
  'next': '14.1.0',
  'eslint-config-next': '14.1.0',
  'eslint': '^8.56.0',
  '@typescript-eslint/eslint-plugin': '^7.0.0',
  '@typescript-eslint/parser': '^7.0.0'
};

// Files to update
const PACKAGE_FILES = [
  'package.json',
  'web/package.json',
  'server/package.json'
];

function updatePackageJson(filePath) {
  console.log(`\nUpdating ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(content);
    let updated = false;

    // Update dependencies
    if (packageJson.dependencies) {
      for (const [pkg, version] of Object.entries(CORRECT_VERSIONS)) {
        if (packageJson.dependencies[pkg] && packageJson.dependencies[pkg] !== version) {
          console.log(`  Updating ${pkg} from ${packageJson.dependencies[pkg]} to ${version}`);
          packageJson.dependencies[pkg] = version;
          updated = true;
        }
      }
    }

    // Update devDependencies
    if (packageJson.devDependencies) {
      for (const [pkg, version] of Object.entries(CORRECT_VERSIONS)) {
        if (packageJson.devDependencies[pkg] && packageJson.devDependencies[pkg] !== version) {
          console.log(`  Updating ${pkg} from ${packageJson.devDependencies[pkg]} to ${version}`);
          packageJson.devDependencies[pkg] = version;
          updated = true;
        }
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`  ✓ Updated ${filePath}`);
    } else {
      console.log(`  ✓ No updates needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`  ✗ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting package version updates...');

PACKAGE_FILES.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updatePackageJson(filePath);
  } else {
    console.log(`\nSkipping ${filePath} - file not found`);
  }
});

console.log('\nVersion update complete!');
console.log('\nNext steps:');
console.log('1. Run "npm install" to update node_modules');
console.log('2. Run "npm run generate" to regenerate Prisma client');
console.log('3. Run "npm run lint" to check for any remaining issues'); 