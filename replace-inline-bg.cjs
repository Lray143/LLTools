// replace-inline-bg.cjs
const fs = require('fs');
const path = require('path');

const root = path.join('c:', 'Users', 'Lawrence', 'OneDrive', 'Desktop', 'Double L', 'LLTools', 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  // Replace Tailwind hex bg classes like bg-[#fcfcfc]
  content = content.replace(/bg-\[#[0-9a-fA-F]{6}\]/g, 'bg-[var(--theme-50)]');
  // Replace inline style background hex strings
  content = content.replace(/background:\s*['"]#([0-9a-fA-F]{6})['"]/g, 'background: var(--theme-50)');
  // Replace style attribute with background color hex in JSX objects
  content = content.replace(/backgroundColor:\s*['"]#([0-9a-fA-F]{6})['"]/g, 'backgroundColor: "var(--theme-50)"');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.tsx')) {
      replaceInFile(full);
    }
  }
}

walk(root);
console.log('Inline background replacement complete.');
