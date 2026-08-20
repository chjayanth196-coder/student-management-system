const fs = require('fs');
const p = 'thunder-collection_erp-api.json';
let s = fs.readFileSync(p, 'utf8');

// Update health endpoints to use baseUrlNoPrefix (they are excluded from /api/v1 prefix)
s = s.split('{{baseUrl}}/health').join('{{baseUrlNoPrefix}}/health');
s = s.split('"url": "{{baseUrl}}/"').join('"url": "{{baseUrlNoPrefix}}/"');

fs.writeFileSync(p, s);
// Validate
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
let count = 0;
c.folders.forEach(f => count += f.requests ? f.requests.length : 0);
console.log('Done. Health URLs updated. Total requests:', count);
const healthReqs = c.folders
  .filter(f => f.name === 'Health & Root')
  .flatMap(f => f.requests)
  .map(r => r.name + ': ' + r.url);
healthReqs.forEach(x => console.log('  ', x));
