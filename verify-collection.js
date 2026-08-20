// Verifies the Thunder Client collection requests actually work against the live backend.
const http = require('http');

const BASE = 'http://localhost:4000';
const API = BASE + '/api/v1';

const results = [];
let token = '';

function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch (e) { /* not json */ }
          resolve({ status: res.statusCode, data: parsed, raw: data });
        });
      }
    );
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function log(name, status, extra = '') {
  const ok = status >= 200 && status < 300;
  results.push({ name, status, ok });
  console.log(`${ok ? '✅' : '❌'} ${name} -> ${status} ${extra}`);
}

async function main() {
  // 1. Health (no prefix)
  let r = await request('GET', BASE + '/health');
  log('GET /health', r.status);

  // 2. Root (no prefix)
  r = await request('GET', BASE + '/');
  log('GET / (root)', r.status);

  // 3. Login Super Admin
  r = await request('POST', API + '/auth/login', {
    email: 'superadmin@erp.com',
    password: 'SuperAdmin@123',
  });
  if (r.status === 200 || r.status === 201) {
    const data = r.data && r.data.data ? r.data.data : r.data;
    token = data.accessToken || (data.user && data.user.accessToken) || '';
    log('POST /auth/login', r.status, token ? '(token captured)' : '(NO TOKEN)');
  } else {
    log('POST /auth/login', r.status);
  }

  if (!token) {
    console.log('\nFATAL: Could not get auth token. Aborting.');
    printSummary();
    return;
  }

  // 4. List institutions -> capture institutionId
  r = await request('GET', API + '/institutions');
  let institutionId = '';
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    institutionId = r.data.data[0].id;
    log('GET /institutions', r.status, `(count=${r.data.data.length}, id=${institutionId})`);
  } else {
    log('GET /institutions', r.status);
  }

  // 5. Academic years -> capture academicYearId
  let academicYearId = '';
  r = await request('GET', API + `/institutions/${institutionId}/academic-years`);
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    academicYearId = r.data.data[0].id;
    log('GET /academic-years', r.status, `(count=${r.data.data.length})`);
  } else {
    log('GET /academic-years', r.status);
  }

  // 6. Departments -> capture departmentId
  let departmentId = '';
  r = await request('GET', API + `/institutions/${institutionId}/departments?academicYearId=${academicYearId}`);
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    departmentId = r.data.data[0].id;
    log('GET /departments', r.status, `(count=${r.data.data.length})`);
  } else {
    log('GET /departments', r.status);
  }

  // 7. Classes (no filter)
  let classId = '';
  r = await request('GET', API + `/institutions/${institutionId}/classes`);
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    classId = r.data.data[0].id;
    log('GET /classes', r.status, `(count=${r.data.data.length})`);
  } else {
    log('GET /classes', r.status);
  }

  // 8. Sections -> capture sectionId
  let sectionId = '';
  r = await request('GET', API + `/institutions/${institutionId}/sections?classId=${classId}`);
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    sectionId = r.data.data[0].id;
    log('GET /sections', r.status, `(count=${r.data.data.length})`);
  } else {
    log('GET /sections', r.status);
  }

  // 9. Subjects -> capture subjectId
  let subjectId = '';
  r = await request('GET', API + `/institutions/${institutionId}/subjects?academicYearId=${academicYearId}&departmentId=${departmentId}&classId=${classId}`);
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    subjectId = r.data.data[0].id;
    log('GET /subjects', r.status, `(count=${r.data.data.length})`);
  } else {
    log('GET /subjects', r.status);
  }

  // 10. Students -> capture studentId
  let studentId = '';
  r = await request('GET', API + `/institutions/${institutionId}/students`);
  if (r.status === 200 && r.data && r.data.data && r.data.data.length) {
    studentId = r.data.data[0].id;
    log('GET /students', r.status, `(count=${r.data.data.length})`);
  } else {
    log('GET /students', r.status);
  }

  // 11. Staff
  r = await request('GET', API + `/institutions/${institutionId}/staff`);
  log('GET /staff', r.status, r.status === 200 ? `(count=${((r.data||{}).data||[]).length})` : '');

  // 12. Results
  r = await request('GET', API + `/institutions/${institutionId}/results`);
  log('GET /results', r.status);

  // 13. Fees structures
  r = await request('GET', API + `/institutions/${institutionId}/fees/structures`);
  log('GET /fees/structures', r.status);

  // 14. Fees payments
  r = await request('GET', API + `/institutions/${institutionId}/fees/payments`);
  log('GET /fees/payments', r.status);

  // 15. Dashboards
  r = await request('GET', API + '/admin/dashboard');
  log('GET /admin/dashboard', r.status);
  r = await request('GET', API + `/institutions/${institutionId}/dashboard`);
  log('GET /dashboard', r.status);

  // 16. Users
  r = await request('GET', API + '/users');
  log('GET /users', r.status);
  r = await request('GET', API + '/users/me');
  log('GET /users/me', r.status);

  // 17. Notifications
  r = await request('GET', API + '/notifications');
  log('GET /notifications', r.status);
  r = await request('GET', API + '/notifications/unread-count');
  log('GET /notifications/unread-count', r.status);

  // 18. Library
  r = await request('GET', API + `/institutions/${institutionId}/library/books`);
  log('GET /library/books', r.status);

  // 19. Hostel
  r = await request('GET', API + `/institutions/${institutionId}/hostel/rooms`);
  log('GET /hostel/rooms', r.status);
  r = await request('GET', API + `/institutions/${institutionId}/hostel/allocations`);
  log('GET /hostel/allocations', r.status);

  // 20. Transport
  r = await request('GET', API + `/institutions/${institutionId}/transport/routes`);
  log('GET /transport/routes', r.status);
  r = await request('GET', API + `/institutions/${institutionId}/transport/passes`);
  log('GET /transport/passes', r.status);

  // 21. Placement
  r = await request('GET', API + `/institutions/${institutionId}/placement/drives`);
  log('GET /placement/drives', r.status);
  r = await request('GET', API + `/institutions/${institutionId}/placement/applications`);
  log('GET /placement/applications', r.status);

  // 22. Institution by slug (public)
  r = await request('GET', API + '/institutions/slug/demo-university');
  log('GET /institutions/slug/demo-university', r.status);

  printSummary({ institutionId, academicYearId, departmentId, classId, sectionId, subjectId, studentId });
}

function printSummary(ids) {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('\n================ SUMMARY ================');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${results.length}`);
  if (ids) {
    console.log('\nCaptured IDs (paste into Thunder env):');
    for (const [k, v] of Object.entries(ids)) {
      if (v) console.log(`  ${k} = ${v}`);
    }
  }
  if (failed > 0) {
    console.log('\nFailed requests:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ❌ ${r.name} -> ${r.status}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Verification script error:', e.message);
  printSummary();
});

