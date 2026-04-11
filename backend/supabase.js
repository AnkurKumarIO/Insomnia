const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB calls will fail.');
}

// Service role client — bypasses RLS for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
