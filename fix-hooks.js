const fs = require('fs');
const path = require('path');

const filePath = path.join('c:/Users/chjay/OneDrive/Desktop/student-management-system/erp-platform/frontend/src/lib', 'hooks.ts');

let content = fs.readFileSync(filePath, 'utf8');

// Fix the useApiGet signature to accept string | null
content = content.replace(
  'export function useApiGet<T>(url: string) {',
  'export function useApiGet<T>(url: string | null) {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('hooks.ts updated OK');

