// scripts/rehash-passwords.js
// Run once with: node scripts/rehash-passwords.js
// Detects plaintext passwords in system_users and re-hashes them with bcrypt.

import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const SALT_ROUNDS = 10; // Must match what your auth controller uses

async function rehashPasswords() {
  const client = await pool.connect();

  try {
    console.log("🔍 Fetching all users from system_users...");
    const { rows: users } = await client.query(
      "SELECT system_users_id, email, password FROM system_users"
    );

    console.log(`Found ${users.length} user(s).\n`);

    let alreadyHashed = 0;
    let rehashed = 0;
    let failed = 0;

    for (const user of users) {
      const isAlreadyHashed = user.password.startsWith("$2a$") ||
                              user.password.startsWith("$2b$");

      if (isAlreadyHashed) {
        console.log(`⏭️  Skipping ${user.email} — already bcrypt hashed.`);
        alreadyHashed++;
        continue;
      }

      try {
        // Password is plaintext — hash it now
        const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);

        await client.query(
          "UPDATE system_users SET password = $1 WHERE system_users_id = $2",
          [hashed, user.system_users_id]
        );

        console.log(`✅ Re-hashed: ${user.email}`);
        rehashed++;
      } catch (err) {
        console.error(`❌ Failed for ${user.email}:`, err.message);
        failed++;
      }
    }

    console.log("\n── Summary ──────────────────────────────");
    console.log(`✅ Re-hashed:       ${rehashed}`);
    console.log(`⏭️  Already hashed: ${alreadyHashed}`);
    console.log(`❌ Failed:          ${failed}`);
    console.log("─────────────────────────────────────────");

    if (rehashed > 0) {
      console.log("\n✔ Done. Try logging in again — passwords should now work.");
    } else if (alreadyHashed === users.length) {
      console.log("\n⚠ All passwords were already hashed.");
      console.log("  If login is still failing, the stored hash was truncated");
      console.log("  by the old VARCHAR(50) column BEFORE you ran the ALTER TABLE.");
      console.log("  In that case, you need to set new passwords manually (see below).\n");
      console.log("  Run this SQL in Supabase to manually reset a password:");
      console.log("  (replace the email and new password as needed)\n");
      console.log(`  -- In Supabase SQL Editor:`);
      console.log(`  UPDATE system_users`);
      console.log(`  SET password = '<run bcrypt.hash() in Node and paste result here>'`);
      console.log(`  WHERE email = 'user@example.com';\n`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

rehashPasswords();