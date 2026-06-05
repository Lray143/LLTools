// replace-bg.cjs
const fs = require('fs');
const path = require('path');

const root = path.join('c:', 'Users', 'Lawrence', 'OneDrive', 'Desktop', 'Double L', 'LLTools', 'src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;
      // Replace Tailwind class with hardcoded hex bg e.g., bg-[#fcfcfc]
      content = content.replace(/bg-\[#[0-9a-fA-F]{6}\]/g, 'bg-[var(--theme-50)]');
      // Replace plain bg-white, bg-gray-... with theme variables (light version)
      const surfaceMap = {
        'bg-white': 'bg-[var(--theme-50)]',
        'bg-gray-50': 'bg-[var(--theme-50)]',
        'bg-gray-100': 'bg-[var(--theme-100)]',
        'bg-gray-200': 'bg-[var(--theme-200)]',
        'bg-gray-300': 'bg-[var(--theme-300)]',
        'bg-gray-400': 'bg-[var(--theme-400)]',
        'bg-gray-500': 'bg-[var(--theme-500)]',
        'bg-gray-600': 'bg-[var(--theme-600)]',
        'bg-gray-700': 'bg-[var(--theme-700)]',
        'bg-gray-800': 'bg-[var(--theme-800)]',
        'bg-gray-900': 'bg-[var(--theme-900)]',
      };
      for (const [oldCls, newCls] of Object.entries(surfaceMap)) {
        const regex = new RegExp(`\\b${oldCls}\\b`, 'g');
        content = content.replace(regex, `${newCls} dark:${newCls}`);
      }
      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Updated', full);
      }
    }
  }
}

walk(root);
console.log('Background replacement complete.');
