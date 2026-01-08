import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ksjfwwwcigvydeozqqvl.supabase.co';
const supabaseKey = 'sb_publishable_rpOzCQQRi08nAQS-dmbGMg_M1RGIX06';

export const supabase = createClient(supabaseUrl, supabaseKey);