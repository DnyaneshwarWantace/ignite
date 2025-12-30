const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath, editorType) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Replace imports from @/ to @/editor-lib/{video|image}/
  let newContent = content
    .replace(/@\/components\//g, `@/editor-lib/${editorType}/components/`)
    .replace(/@\/lib\//g, `@/editor-lib/${editorType}/lib/`)
    .replace(/@\/hooks\//g, `@/editor-lib/${editorType}/hooks/`)
    .replace(/@\/utils\//g, `@/editor-lib/${editorType}/utils/`)
    .replace(/@\/store\//g, `@/editor-lib/${editorType}/store/`)
    .replace(/@\/models\//g, `@/editor-lib/${editorType}/models/`)
    .replace(/@\/constants\//g, `@/editor-lib/${editorType}/constants/`)
    .replace(/@\/features\//g, `@/editor-lib/${editorType}/features/`);

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

function processDirectory(dirPath, editorType) {
  let changedFiles = 0;

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (fixImportsInFile(filePath, editorType)) {
          changedFiles++;
        }
      }
    }
  }

  walk(dirPath);
  return changedFiles;
}

console.log('🔧 Fixing import paths in editor libraries...\n');

const videoChanges = processDirectory('src/editor-lib/video', 'video');
console.log(`✓ Updated ${videoChanges} files in video editor`);

const imageChanges = processDirectory('src/editor-lib/image', 'image');
console.log(`✓ Updated ${imageChanges} files in image editor`);

console.log(`\n✅ Total: ${videoChanges + imageChanges} files updated`);
