// Quick API smoke test for the ERP platform
const BASE = 'http://localhost:4000/api/v1';

async function run() {
  const results = [];

  // 1. Health check
  try {
    const health = await fetch(`${BASE}/health`);
    const healthData = await health.json();
    results.push(['GET /health', health.status, JSON.stringify(healthData)]);
  } catch (e) {
    results.push(['GET /health', 'ERROR', e.message]);
  }

  // 2. Login as SuperAdmin
  let token = '';
  let userId = '';
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@erp.com', password: 'SuperAdmin@123' }),
    });
    const data = await res.json();
    if (res.ok) {
      token = data.data?.accessToken || data.accessToken || '';
      userId = data.data?.user?.id || '';
    }
    results.push(['POST /auth/login', res.status, res.ok ? 'LOGIN_OK token=' + token.slice(0, 20) + '...' : JSON.stringify(data)]);
  } catch (e) {
    results.push(['POST /auth/login', 'ERROR', e.message]);
  }

  // 3. List institutions
  let institutionId = '';
  try {
    const res = await fetch(`${BASE}/institutions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      const items = data.data?.items || data.items || data.data || [];
      institutionId = items[0]?.id || '';
      results.push(['GET /institutions', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0) + ' firstId=' + institutionId]);
    } else {
      results.push(['GET /institutions', res.status, JSON.stringify(data)]);
    }
  } catch (e) {
    results.push(['GET /institutions', 'ERROR', e.message]);
  }

  // 4. List academic years
  let academicYearId = '';
  if (institutionId) {
    try {
      const res = await fetch(`${BASE}/institutions/${institutionId}/academic-years`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const items = data.data?.items || data.items || data.data || [];
        academicYearId = items[0]?.id || '';
        results.push(['GET /academic-years', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0)]);
      } else {
        results.push(['GET /academic-years', res.status, JSON.stringify(data)]);
      }
    } catch (e) {
      results.push(['GET /academic-years', 'ERROR', e.message]);
    }
  }

  // 5. List departments
  let departmentId = '';
  if (institutionId) {
    try {
      const qs = academicYearId ? `?academicYearId=${academicYearId}` : '';
      const res = await fetch(`${BASE}/institutions/${institutionId}/departments${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const items = data.data?.items || data.items || data.data || [];
        departmentId = items[0]?.id || '';
        results.push(['GET /departments', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0)]);
      } else {
        results.push(['GET /departments', res.status, JSON.stringify(data)]);
      }
    } catch (e) {
      results.push(['GET /departments', 'ERROR', e.message]);
    }
  }

  // 6. List classes
  let classId = '';
  if (institutionId) {
    try {
      const qs = [];
      if (academicYearId) qs.push(`academicYearId=${academicYearId}`);
      if (departmentId) qs.push(`departmentId=${departmentId}`);
      const res = await fetch(`${BASE}/institutions/${institutionId}/classes${qs.length ? '?' + qs.join('&') : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const items = data.data?.items || data.items || data.data || [];
        classId = items[0]?.id || '';
        results.push(['GET /classes', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0)]);
      } else {
        results.push(['GET /classes', res.status, JSON.stringify(data)]);
      }
    } catch (e) {
      results.push(['GET /classes', 'ERROR', e.message]);
    }
  }

  // 7. List students
  let studentId = '';
  if (institutionId) {
    try {
      const res = await fetch(`${BASE}/institutions/${institutionId}/students?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const items = data.data?.items || data.items || data.data || [];
        studentId = items[0]?.id || '';
        results.push(['GET /students', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0)]);
      } else {
        results.push(['GET /students', res.status, JSON.stringify(data)]);
      }
    } catch (e) {
      results.push(['GET /students', 'ERROR', e.message]);
    }
  }

  // 8. SuperAdmin dashboard
  try {
    const res = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    results.push(['GET /admin/dashboard', res.status, res.ok ? 'OK' : (await res.text()).slice(0, 120)]);
  } catch (e) {
    results.push(['GET /admin/dashboard', 'ERROR', e.message]);
  }

  // 9. Admin dashboard
  if (institutionId) {
    try {
      const res = await fetch(`${BASE}/institutions/${institutionId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      results.push(['GET /dashboard', res.status, res.ok ? 'OK' : (await res.text()).slice(0, 120)]);
    } catch (e) {
      results.push(['GET /dashboard', 'ERROR', e.message]);
    }
  }

  // 10. Notifications
  try {
    const res = await fetch(`${BASE}/notifications?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    results.push(['GET /notifications', res.status, res.ok ? 'OK' : (await res.text()).slice(0, 120)]);
  } catch (e) {
    results.push(['GET /notifications', 'ERROR', e.message]);
  }

  console.log('========================================');
  console.log('  ERP API SMOKE TEST RESULTS');
  console.log('========================================');
  for (const [endpoint, status, detail] of results) {
    const ok = status === 200 || status === 201;
    console.log(`${ok ? '✅' : '❌'} ${endpoint.padEnd(28)} ${status}  ${detail}`);
  }
  console.log('========================================');
  console.log('Collected IDs:');
  console.log('  institutionId:', institutionId || '(none)');
  console.log('  academicYearId:', academicYearId || '(none)');
  console.log('  departmentId:', departmentId || '(none)');
  console.log('  classId:', classId || '(none)');
  console.log('  studentId:', studentId || '(none)');
}

run().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

