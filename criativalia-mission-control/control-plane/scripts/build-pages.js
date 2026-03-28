const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = ['index.html', 'dashboard.html', 'kanban.html', 'timesheet.html', 'agent.html'];

let output = '// Auto-generated pages file\nmodule.exports = {\n';

for (const file of files) {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(file, '.html');
    // Escape backticks and template literals
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${');
    output += `  ${name}: \`${escaped}\`,\n`;
  }
}

output += '};\n';

fs.writeFileSync(path.join(__dirname, 'pages.js'), output);
console.log('✅ pages.js generated successfully');
