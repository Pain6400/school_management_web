const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/Kevin Mejia/.gemini/antigravity/brain/1c9591f6-4383-47d1-a22a-51187f29f72c/.system_generated/steps/1354/output.txt', 'utf8'));
const last = data.normalized_result.steps[data.normalized_result.steps.length - 1];
console.log('Artifacts:', Object.keys(last.artifacts));

