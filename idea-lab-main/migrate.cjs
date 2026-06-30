const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.svtpjdaxikucgpflbeln:Supabase@123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'FREE';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_branding_text TEXT;
    EXCEPTION WHEN duplicate_column THEN
      NULL;
    END $$;
  `);
  console.log('Migration complete');
  await client.end();
}

run();
