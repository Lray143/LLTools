const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'modules', 'calculations');
const newDir = path.join(__dirname, 'src', 'modules', 'orders');

if (fs.existsSync(dir)) {
  fs.renameSync(dir, newDir);
  console.log('Renamed folder calculations to orders');
}

function renameFiles(currentPath) {
  if (!fs.existsSync(currentPath)) return;
  const items = fs.readdirSync(currentPath);
  for (const item of items) {
    const fullPath = path.join(currentPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      renameFiles(fullPath);
    } else {
      if (item.includes('Calculations')) {
        const newItem = item.replace('Calculations', 'Orders');
        const newFullPath = path.join(currentPath, newItem);
        fs.renameSync(fullPath, newFullPath);
        console.log(`Renamed file ${item} to ${newItem}`);
      }
    }
  }
}

renameFiles(newDir);
