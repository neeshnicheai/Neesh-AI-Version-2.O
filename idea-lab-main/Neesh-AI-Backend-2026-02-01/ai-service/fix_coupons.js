const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.svtpjdaxikucgpflbeln:Supabase@123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB.");

    const res = await client.query('UPDATE coupon_codes SET code = UPPER(TRIM(code));');
    console.log(`Updated ${res.rowCount} rows in coupon_codes.`);
    
    // Deduplicate coupons keeping the most recently created
    // Deduplicate coupons keeping one random id per code
    const dupsRes = await client.query(`
      DELETE FROM coupon_codes
      WHERE id NOT IN (
        SELECT (array_agg(id))[1]
        FROM coupon_codes
        GROUP BY code
      );
    `);
    console.log(`Deleted ${dupsRes.rowCount} duplicate rows.`);

    // Let's verify what's currently in the DB
    const selectRes = await client.query('SELECT id, code, name, active FROM coupon_codes;');
    console.table(selectRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
