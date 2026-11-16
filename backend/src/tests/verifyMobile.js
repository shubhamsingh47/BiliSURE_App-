const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(full, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      fileList.push(full);
    }
  }
  return fileList;
}

const targetDir = path.resolve(__dirname, '../../../mobile/src');
const files = walk(targetDir);
console.log(`Checking ${files.length} mobile TypeScript source files in ${targetDir}...`);

let hasError = false;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.length === 0) {
    console.error(`Empty file: ${file}`);
    hasError = true;
  }
}

if (!hasError) {
  console.log(`All ${files.length} mobile TypeScript files verified successfully!`);
} else {
  process.exit(1);
}
