const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/modules/products/Products.jsx',
  'src/modules/biometrics/Biometrics.jsx',
  'src/modules/calculations/Calculations.jsx',
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

  // We are looking for the header div, which usually has:
  // padding: '... 32px', borderBottom: '...', background: 'var(--page-bg)'
  // or className="... border-b" style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}

  // Let's replace the header's background specifically.
  // In Products.jsx: style={{ background: 'var(--page-bg)', borderColor: 'var(--border)' }}
  // We want to change the FIRST instance of this (which is the header) to use --theme-50.
  // Let's use a regex that matches the header div.
  
  if (file.includes('Products.jsx')) {
    content = content.replace(
      /style=\{\{ background: 'var\(--page-bg\)', borderColor: 'var\(--border\)' \}\}/,
      "style={{ background: 'var(--theme-50)', borderColor: 'var(--theme-200)' }}"
    );
  }
  else if (file.includes('Biometrics.jsx')) {
    content = content.replace(
      /style=\{\{ background: 'var\(--page-bg\)', borderColor: 'var\(--border\)' \}\}/,
      "style={{ background: 'var(--theme-50)', borderColor: 'var(--theme-200)' }}"
    );
  }
  else if (file.includes('Calculations.jsx')) {
    // Calculations header is inside components/CalculationsToolbar.jsx, let's update that instead.
  }
  else if (file.includes('Outlets.jsx')) {
    content = content.replace(
      /className="flex items-center justify-between .*? border-b border-gray-200"/,
      `className="flex items-center justify-between pl-8 pr-[calc(2rem+15px)] py-4 border-b" style={{ background: 'var(--theme-50)', borderColor: 'var(--theme-200)' }}`
    );
  }
  else if (file.includes('Employees.jsx')) {
    content = content.replace(
      /className="flex items-center justify-between .*? border-b border-gray-200"/,
      `className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--theme-50)', borderColor: 'var(--theme-200)' }}`
    );
  }
  else if (file.includes('ClinicLog.jsx')) {
    content = content.replace(
      /className="flex items-center justify-between .*? border-b border-gray-200"/,
      `className="flex items-center justify-between px-8 py-4 border-b" style={{ background: 'var(--theme-50)', borderColor: 'var(--theme-200)' }}`
    );
  }
  else if (file.includes('LeaveRequests.jsx')) {
    content = content.replace(
      /padding: '18px 32px', background: 'var\(--page-bg\)',\s*borderBottom: '1px solid var\(--border\)'/,
      "padding: '18px 32px', background: 'var(--theme-50)',\n        borderBottom: '1px solid var(--theme-200)'"
    );
  }
  else if (file.includes('Settings.jsx')) {
    content = content.replace(
      /paddingBottom: '16px',\s*background: 'var\(--page-bg\)',\s*borderBottom: '1px solid var\(--border\)'/,
      "paddingBottom: '16px',\n        background: 'var(--theme-50)',\n        borderBottom: '1px solid var(--theme-200)'"
    );
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated header in ${file}`);
  }
}
