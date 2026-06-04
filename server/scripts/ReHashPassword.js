// Run once with: node scripts/ReHashPassword.js
// Detects plaintext passwords in system_users and re-hashes them with bcrypt.

import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const SALT_ROUNDS = 10; 

async function rehashPasswords() {
  const client = await pool.connect();

  try {
    console.log("Fetching all users from system_users...");
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
        console.log(`Skipping ${user.email} — already bcrypt hashed.`);
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

        console.log(`Re-hashed: ${user.email}`);
        rehashed++;
      } catch (err) {
        console.error(`Failed for ${user.email}:`, err.message);
        failed++;
      }
    }

    console.log("\n── Summary ──────────────────────────────");
    console.log(`Re-hashed:       ${rehashed}`);
    console.log(`Already hashed: ${alreadyHashed}`);
    console.log(`Failed:          ${failed}`);
    console.log("─────────────────────────────────────────");

    if (rehashed > 0) {
      console.log("\n✔ Done. Try logging in again — passwords should now work.");
    } 
  } finally {
    client.release();
    await pool.end();
  }
}

rehashPasswords();