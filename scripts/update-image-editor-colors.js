const fs = require('fs');
const path = require('path');

function updateColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace blue color classes with purple
  const replacements = [
    // Background colors
    [/bg-blue-(\d+)/g, 'bg-purple-$1'],
    [/from-blue-(\d+)/g, 'from-purple-$1'],
    [/to-blue-(\d+)/g, 'to-purple-$1'],
    [/via-blue-(\d+)/g, 'via-purple-$1'],

    // Text colors
    [/text-blue-(\d+)/g, 'text-purple-$1'],

    // Border colors
    [/border-blue-(\d+)/g, 'border-purple-$1'],
    [/ring-blue-(\d+)/g, 'ring-purple-$1'],

    // Hover states
    [/hover:bg-blue-(\d+)/g, 'hover:bg-purple-$1'],
    [/hover:text-blue-(\d+)/g, 'hover:text-purple-$1'],
    [/hover:border-blue-(\d+)/g, 'hover:border-purple-$1'],

    // Focus states
    [/focus:ring-blue-(\d+)/g, 'focus:ring-purple-$1'],
    [/focus:border-blue-(\d+)/g, 'focus:border-purple-$1'],

    // Disabled states
    [/disabled:bg-blue-(\d+)/g, 'disabled:bg-purple-$1'],
  ];

  for (const [pattern, replacement] of replacements) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
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
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (updateColors(filePath)) {
          changedFiles++;
          console.log(`✓ ${filePath}`);
        }
      }
    }
  }

  walk(dirPath);
  return changedFiles;
}

console.log('🎨 Updating image editor colors from blue to purple...\n');

const changes = processDirectory('src/app/image-editor');
console.log(`\n✅ Updated ${changes} files in image editor`);
