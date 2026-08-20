const BASE = 'http://localhost:4000';

async function run() {
  // Health without prefix
  try {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    console.log('GET /health (no prefix):', res.status, JSON.stringify(data));
  } catch (e) {
    console.log('GET /health ERROR:', e.message);
  }

  // Root without prefix
  try {
    const res = await fetch(`${BASE}/`);
    const data = await res.json();
    console.log('GET / (no prefix):', res.status, JSON.stringify(data));
  } catch (e) {
    console.log('GET / ERROR:', e.message);
  }

  // Login
  const login = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@erp.com', password: 'SuperAdmin@123' }),
  });
  const loginData = await login.json();
  const token = loginData.data?.accessToken || loginData.accessToken;
  console.log('Login:', login.status, 'token:', token ? 'OK' : 'FAIL');

  const institutionId = 'cms0jp6ng0001uue1l954jpg1';
  const academicYearId = 'cms0jp6od0003uue170h99e4u';
  const departmentId = 'cms0jp6vx000duue1jdpkh9y6';

  // Classes without filters
  let res = await fetch(`${BASE}/api/v1/institutions/${institutionId}/classes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let data = await res.json();
  let items = data.data?.items || data.items || data.data || [];
  console.log('GET /classes (no filters):', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0), JSON.stringify(data).slice(0, 300));

  // Classes with academicYearId only
  res = await fetch(`${BASE}/api/v1/institutions/${institutionId}/classes?academicYearId=${academicYearId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  items = data.data?.items || data.items || data.data || [];
  console.log('GET /classes?academicYearId:', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0));

  // Classes with both
  res = await fetch(`${BASE}/api/v1/institutions/${institutionId}/classes?academicYearId=${academicYearId}&departmentId=${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  items = data.data?.items || data.items || data.data || [];
  console.log('GET /classes?academicYearId&departmentId:', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0), JSON.stringify(data).slice(0, 300));

  // Sections
  res = await fetch(`${BASE}/api/v1/institutions/${institutionId}/sections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  items = data.data?.items || data.items || data.data || [];
  console.log('GET /sections:', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0));

  // Subjects
  res = await fetch(`${BASE}/api/v1/institutions/${institutionId}/subjects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  items = data.data?.items || data.items || data.data || [];
  console.log('GET /subjects:', res.status, 'COUNT=' + (Array.isArray(items) ? items.length : 0));
}

run().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

