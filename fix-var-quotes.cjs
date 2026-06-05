// Fix all unquoted var(--theme-*) in JSX inline style objects
// In JSX, style={{ background: var(--theme-50) }} is INVALID JS
// It must be style={{ background: 'var(--theme-50)' }}

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
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = walkDir(srcDir);
let totalFixes = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: background: var(--theme-50) → background: 'var(--theme-50)'
  // Match property: var(--anything) that is NOT already quoted
  // Look for patterns like: property: var(--something) followed by , or } or )
  content = content.replace(
    /(\b(?:background|color|border|borderColor|backgroundColor|boxShadow|fill|stroke):\s*)var\((--[\w-]+)\)/g,
    (match, prefix, varName) => {
      return `${prefix}'var(${varName})'`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const fixes = (content.match(/'var\(--/g) || []).length - (original.match(/'var\(--/g) || []).length;
    console.log(`Fixed: ${path.relative(__dirname, filePath)} (${fixes} fixes)`);
    totalFixes += fixes;
  }
}

console.log(`\nDone! Total fixes: ${totalFixes}`);
