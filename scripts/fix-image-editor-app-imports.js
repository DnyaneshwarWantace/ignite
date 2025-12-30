const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Replace imports from @/ to @/editor-lib/image/
  let newContent = content
    .replace(/@\/components\//g, '@/editor-lib/image/components/')
    .replace(/@\/lib\//g, '@/editor-lib/image/lib/')
    .replace(/@\/hooks\//g, '@/editor-lib/image/hooks/')
    .replace(/@\/types\//g, '@/editor-lib/image/types/')
    .replace(/@\/providers\//g, '@/editor-lib/image/providers/')
    .replace(/@\/config\//g, '@/editor-lib/image/config/');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

function processDirectory(dirPath) {
  let changedFiles = 0;

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (fixImportsInFile(filePath)) {
          changedFiles++;
        }
      }
    }
  }

  walk(dirPath);
  return changedFiles;
}

console.log('🔧 Fixing import paths in image editor app...\n');

const changes = processDirectory('src/app/image-editor');
console.log(`✅ Updated ${changes} files in image editor app`);
