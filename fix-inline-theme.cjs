const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git') continue;
      results = results.concat(walkDir(full));
    } else if (full.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = walkDir(srcDir);

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // For inline styles and inline strings:
  // We'll replace 'var(--theme-50)' with '#f9fafb' for inner components (light gray hover/card bg)
  // We'll replace "var(--theme-50)" with "#f9fafb" 
  
  // Note: For page wrappers, we should manually check if they still use var(--theme-50), 
  // but looking at grep output, most are inner components like modals, rows, headers.

  content = content.replace(/'var\(--theme-50\)'/g, "'#f9fafb'");
  content = content.replace(/"var\(--theme-50\)"/g, '"#f9fafb"');

  content = content.replace(/'var\(--theme-100\)'/g, "'#f3f4f6'");
  content = content.replace(/"var\(--theme-100\)"/g, '"#f3f4f6"');

  // Same for hover scripts: e.currentTarget.style.background = 'var(--theme-50)' -> '#f9fafb'

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated inline style: ${path.relative(__dirname, filePath)}`);
  }
}
