import { setSupabaseClient } from '../supabase';
import * as propertyService from '../modules/properties/property.service';

async function run() {
  console.log('Starting property-image integration test...');

  const inserts: Record<string, any[]> = { properties: [], photos: [] };

  const mockSupabase: any = {
    from(table: string) {
      return {
        insert: (payload: any) => ({ select: () => ({ single: async () => ({ data: payload[0], error: null }) }) }),
        select: (cols?: any) => ({
          eq: (_col: string, _val: any) => ({ single: async () => ({ data: [], error: null }) }),
          contains: (_col: string, _val: any) => ({ limit: (_n: number) => ({ single: async () => ({ data: null, error: null }) }) }),
          is: (_col: string, _val: any) => ({ limit: (_n: number) => ({ single: async () => ({ data: null, error: null }) }) }),
        }),
        update: (payload: any) => ({ eq: (_col: string, _val: any) => ({ select: () => ({ single: async () => ({ data: payload, error: null }) }) }) }),
      } as any;
    }
  };

  // Wrap mock to capture inserts
  const capturingSupabase: any = {
    from(table: string) {
      const inner = mockSupabase.from(table);
      const origInsert = inner.insert;
      inner.insert = (payload: any) => {
        inserts[table] = inserts[table] || [];
        inserts[table].push(...payload);
        return origInsert(payload);
      };
      // override select to support eq/contains for photos check
      inner.select = (cols?: any) => ({
        eq: (_col: string, _val: any) => ({ single: async () => ({ data: [], error: null }) }),
        is: (_col: string, _val: any) => ({ limit: (_n: number) => ({ single: async () => ({ data: null, error: null }) }) }),
        contains: (_col: string, _val: any) => ({ limit: (_n: number) => ({ single: async () => ({ data: null, error: null }) }) }),
      });
      inner.update = (payload: any) => ({ eq: (_col: string, _val: any) => ({ select: () => ({ single: async () => ({ data: payload, error: null }) }) }) });
      return inner;
    }
  };

  setSupabaseClient(capturingSupabase as any);

  const body = {
    title: 'Test Property',
    address: '123 Test Lane',
    city: 'Testville',
    price: '1000.00',
    images: ['https://cdn.example.com/prop/1.jpg', 'https://cdn.example.com/prop/2.jpg'],
  };

  const res = await propertyService.createProperty({ body, userId: 'user_abc' });

  if (res.error) {
    console.error('createProperty returned error:', res.error);
    process.exit(1);
  }

  console.log('createProperty result id:', res.data?.id || '(no id returned)');

  // Ensure photos were attempted to be inserted/updated
  if (!inserts.photos || inserts.photos.length === 0) {
    console.error('Expected photos to be associated/inserted, but none were. inserts=', JSON.stringify(inserts, null, 2));
    process.exit(1);
  }

  console.log('Photos associated/inserted count:', inserts.photos.length);
  console.log('Integration test passed.');
}

run().catch(err => { console.error('Test failed:', err); process.exit(1); });
