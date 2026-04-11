// Supabase client — gracefully falls back to null when env vars are not set.
// The app uses Prisma/SQLite as the primary DB; supabase is optional.

let supabase = null;

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialised.');
  } else {
    console.log('ℹ️  Supabase env vars not set — using Prisma/SQLite only.');
  }
} catch (e) {
  console.warn('⚠️  Supabase init failed:', e.message);
}

module.exports = supabase;
