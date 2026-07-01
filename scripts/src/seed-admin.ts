import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  console.error("Set it with: $env:DATABASE_URL = 'postgresql://...'");
  process.exit(1);
}

const ADMIN_EMAIL = "narendrareddy83677@gmail.com";
const ADMIN_NAME = "Admin";
const ADMIN_PASSWORD = "Admin@123";

async function seedAdmin() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    // Check if admin already exists
    const existing = await pool.query(
      "SELECT id FROM admins WHERE email = $1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`Admin with email ${ADMIN_EMAIL} already exists (id: ${existing.rows[0].id}). Skipping.`);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Insert admin
    const result = await pool.query(
      "INSERT INTO admins (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [ADMIN_EMAIL, ADMIN_NAME, passwordHash]
    );

    console.log(`✅ Admin user created successfully!`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (err) {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
