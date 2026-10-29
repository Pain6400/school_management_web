const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboard)/school/finance/page.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 1737; i < 1920; i++) {
  if (lines[i].includes('}') && lines[i].trim() === ')}') {
    console.log(i + 1, lines[i]);
  }
}
