// One-off cleanup: removes the test holdings/uploads created while verifying
// the Upload feature. Uses the service role key (server-side only) to bypass RLS.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_NAMES = ['HDFC Top 100 Fund', 'Reliance Industries', 'Fixed Deposit', 'Vanguard Total World'];

const { data: deletedHoldings, error: e1 } = await supabase.from('holdings').delete().in('name', TEST_NAMES).select('id');
console.log('Deleted holdings:', deletedHoldings?.length ?? 0, e1 || '');

const { data: deletedUploads, error: e2 } = await supabase.from('uploads').delete().like('filename', 'test-portfolio%').select('id');
console.log('Deleted uploads:', deletedUploads?.length ?? 0, e2 || '');
