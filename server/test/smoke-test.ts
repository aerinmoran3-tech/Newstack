import { setSupabaseClient } from '../supabase';
import { registerImageKitRoutes } from '../routes/imagekit';
import { registerAdminRoutes } from '../routes/admin';

// Minimal express mocks for handler invocation
function makeReq(user: any = null, params: any = {}, body: any = {}) {
  return {
    user,
    params,
    body,
  } as any;
}

function makeRes() {
  const res: any = {};
  res._status = 200;
  res._payload = null;
  res.status = function (code: number) { res._status = code; return res; };
  res.json = function (payload: any) { res._payload = payload; return res; };
  return res;
}

async function run() {
  console.log('Starting smoke tests...');

  // Inject a mock Supabase client
  const mockSupabase: any = {
    from: (table: string) => {
      return {
        select: (cols?: any) => ({
          eq: (col: string, val: any) => ({
            single: async () => {
              if (table === 'users') return { data: { id: val, role: 'renter' }, error: null };
              return { data: [], error: null };
            }
          }),
          single: async () => ({ data: [], error: null }),
        }),
        update: (payload: any) => ({
          eq: (_col: string, _val: any) => ({
            select: () => ({ single: async () => ({ data: { id: 'user_1', ...payload }, error: null } ) })
          })
        }),
        insert: (payload: any) => ({ select: () => ({ single: async () => ({ data: payload[0], error: null }) }) }),
      };
    }
  };

  setSupabaseClient(mockSupabase as any);

  // Import handlers via register functions to obtain exported handlers
  const imgExports: any = registerImageKitRoutes({} as any) || {};
  const adminExports: any = registerAdminRoutes({} as any) || {};

  // Test ImageKit token handler
  const imgReq = makeReq({ id: 'u1', role: 'admin' }, {}, {});
  const imgRes = makeRes();
  await imgExports.handleUploadToken(imgReq, imgRes);
  console.log('/api/imagekit/upload-token ->', imgRes._status, JSON.stringify(imgRes._payload));

  // Test admin role-change handler success path
  const adminReq = makeReq({ id: 'admin1', role: 'admin' }, { id: 'user_1' }, { role: 'agent' });
  const adminRes = makeRes();
  await adminExports.handleUpdateUserRole(adminReq, adminRes);
  console.log('/api/admin/users/:id/role ->', adminRes._status, JSON.stringify(adminRes._payload));

  // Test admin role-change invalid role
  const badReq = makeReq({ id: 'admin1', role: 'admin' }, { id: 'user_1' }, { role: 'not_a_role' });
  const badRes = makeRes();
  await adminExports.handleUpdateUserRole(badReq, badRes);
  console.log('/api/admin/users/:id/role invalid ->', badRes._status, JSON.stringify(badRes._payload));

  console.log('Smoke tests completed.');
}

run().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
