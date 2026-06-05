const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/modules/products/Products.jsx',
  'src/modules/biometrics/Biometrics.jsx',
  'src/modules/calculations/components/CalculationsToolbar.jsx',
  'src/modules/clinic/ClinicLog.jsx',
  'src/modules/leaves/LeaveRequests.jsx',
  'src/modules/settings/Settings.jsx',
  'src/modules/outlets/Outlets.jsx',
  'src/modules/hrms/Employees.jsx',
];

for (const file of targetFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace var(--theme-50) with var(--page-bg) in the header backgrounds
  // Replace var(--theme-200) with transparent or var(--border)
  // The user explicitly wants it to be the "same color as bg".
  
  content = content.replace(/background: 'var\(--theme-50\)'/g, "background: 'var(--page-bg)'");
  content = content.replace(/borderColor: 'var\(--theme-200\)'/g, "borderColor: 'var(--border)'");
  content = content.replace(/borderBottom: '1px solid var\(--theme-200\)'/g, "borderBottom: '1px solid var(--border)'");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated header in ${file}`);
  }
}
