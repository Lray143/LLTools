const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let filesToCheck = [];
walkDir('./src', (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    filesToCheck.push(filePath);
  }
});

let replacements = 0;
filesToCheck.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Specific UI string change for Table tab
  content = content.replace(/label:\s*'Table'/g, "label: 'Add orders'");
  
  // Replace calculations to orders
  content = content.replace(/calculations/g, 'orders');
  content = content.replace(/Calculations/g, 'Orders');
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    replacements++;
    console.log('Modified: ' + file);
  }
});

console.log('Total files modified: ' + replacements);
