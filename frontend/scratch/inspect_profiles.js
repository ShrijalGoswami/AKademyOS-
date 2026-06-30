const fs = require("fs");
const path = require("path");

// Manually parse .env.local
const envPath = path.join(__dirname, "../.env.local");
const envConfig = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      // Remove quotes if present
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      envConfig[key] = value;
    }
  }
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

async function inspectProfiles() {
  const url = `${supabaseUrl}/rest/v1/profiles?select=email,role,full_name`;
  try {
    const res = await fetch(url, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Profiles in database:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error fetching profiles:", error);
  }
}

inspectProfiles();
