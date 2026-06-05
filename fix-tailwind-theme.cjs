// Replace bg-[var(--theme-*)] Tailwind classes with neutral ones
// Tables keep their original white/gray look - only page wrappers, headers,
// modals, drawers, cards, and filter bars get the theme treatment.

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
let totalChanges = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace bg-[var(--theme-50)] dark:bg-[var(--theme-50)] with bg-white
  // Replace bg-[var(--theme-50)] with bg-white
  // Replace bg-[var(--theme-100)] dark:bg-[var(--theme-100)] with bg-gray-50
  // Replace hover:bg-[var(--theme-50)] with hover:bg-gray-50
  // Replace hover:bg-[var(--theme-100)] with hover:bg-gray-100

  content = content.replace(/bg-\[var\(--theme-50\)\]\s*dark:bg-\[var\(--theme-50\)\](?:\/\d+)?/g, 'bg-white');
  content = content.replace(/bg-\[var\(--theme-100\)\]\s*dark:bg-\[var\(--theme-100\)\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[var\(--theme-50\)\]/g, 'bg-white');
  content = content.replace(/bg-\[var\(--theme-100\)\]/g, 'bg-gray-50');
  content = content.replace(/bg-\[var\(--theme-200\)\]/g, 'bg-gray-100');
  content = content.replace(/hover:bg-\[var\(--theme-50\)\]\s*dark:bg-\[var\(--theme-50\)\]/g, 'hover:bg-gray-50');
  content = content.replace(/hover:bg-\[var\(--theme-100\)\]\s*dark:bg-\[var\(--theme-100\)\]/g, 'hover:bg-gray-100');
  content = content.replace(/hover:bg-\[var\(--theme-50\)\]/g, 'hover:bg-gray-50');
  content = content.replace(/hover:bg-\[var\(--theme-100\)\]/g, 'hover:bg-gray-100');
  content = content.replace(/focus:bg-\[var\(--theme-50\)\]\s*dark:bg-\[var\(--theme-50\)\]/g, 'focus:bg-gray-50');
  content = content.replace(/focus:bg-\[var\(--theme-50\)\]/g, 'focus:bg-gray-50');

  // Replace bg-[var(--theme-500)] with the semantic accent
  content = content.replace(/bg-\[var\(--theme-500\)\]\s*dark:bg-\[var\(--theme-500\)\]/g, 'bg-[var(--accent-bg)]');
  content = content.replace(/bg-\[var\(--theme-500\)\]/g, 'bg-[var(--accent-bg)]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(__dirname, filePath)}`);
    totalChanges++;
  }
}

console.log(`\nDone! Updated ${totalChanges} files.`);
