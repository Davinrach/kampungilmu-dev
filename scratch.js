const fs = require('fs');
const content = fs.readFileSync('API_DOCUMENTATION (2).md', 'utf8');
const lines = content.split('\n');
const endpoints = lines.filter(line => line.includes('### `') && line.includes('/admin'));
console.log(endpoints.join('\n'));
