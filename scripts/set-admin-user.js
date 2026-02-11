/**
 * Set admin user: prembkalwale@gmail.com with name "Dnyaneshwar" and password.
 * Run: node scripts/set-admin-user.js
 * Uses .env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { createClient } = require("@supabase/supabase-js");
const { hashSync } = require("bcryptjs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = "prembkalwale@gmail.com";
const ADMIN_NAME = "Dnyaneshwar";
const ADMIN_PASSWORD = "Kd@869877";

async function main() {
  const passwordHash = hashSync(ADMIN_PASSWORD, 10);

  const { data: existing, error: findErr } = await supabase
    .from("users")
    .select("id, name, is_admin, password_hash")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (findErr) {
    console.error("❌ Error finding user:", findErr.message);
    process.exit(1);
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        name: ADMIN_NAME,
        is_admin: true,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("email", ADMIN_EMAIL);

    if (updateErr) {
      console.error("❌ Error updating user:", updateErr.message);
      process.exit(1);
    }
    console.log("✅ Admin user updated:", ADMIN_EMAIL, "| name:", ADMIN_NAME, "| is_admin: true");
  } else {
    const { error: insertErr } = await supabase.from("users").insert({
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      is_admin: true,
      password_hash: passwordHash,
    });

    if (insertErr) {
      console.error("❌ Error creating user:", insertErr.message);
      process.exit(1);
    }
    console.log("✅ Admin user created:", ADMIN_EMAIL, "| name:", ADMIN_NAME, "| is_admin: true");
  }

  console.log("\nYou can sign in at /admin/login with:");
  console.log("  Email:", ADMIN_EMAIL);
  console.log("  Password:", ADMIN_PASSWORD);
}

main();
