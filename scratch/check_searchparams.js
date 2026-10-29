const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboard)/school/finance/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('searchParams') || line.includes('useSearchParams')) {
    console.log(i + 1, line);
  }
});

