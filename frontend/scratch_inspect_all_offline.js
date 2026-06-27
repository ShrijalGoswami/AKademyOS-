const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value.replace(/\\n/g, '\n');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

async function fetchFromSupabase(table, queryParams = '') {
  const url = `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
  const response = await fetch(url, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${table}: ${response.statusText} - ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  try {
    console.log('=== ALL OFFLINE TEST SCORES ===');
    const offline = await fetchFromSupabase('offline_test_scores');
    console.log(`Total offline test score rows: ${offline.length}`);
    
    const users = [...new Set(offline.map(x => x.user_email))];
    console.log('Users in offline_test_scores:', users);
    
    users.forEach(email => {
      console.log(`\n--- ${email} ---`);
      const userScores = offline.filter(x => x.user_email === email);
      const weeks = [...new Set(userScores.map(x => x.week_number))];
      weeks.forEach(w => {
        const weekScores = userScores.filter(x => x.week_number === w);
        const sumScore = weekScores.reduce((acc, x) => acc + parseFloat(x.score), 0);
        const sumMax = weekScores.reduce((acc, x) => acc + parseFloat(x.max_score), 0);
        console.log(`  Week ${w}: ${sumScore}/${sumMax} (${weekScores.length} tests)`);
        weekScores.forEach(t => {
          console.log(`    • ${t.subject} - ${t.topic}: ${t.score}/${t.max_score}`);
        });
      });
    });
  } catch (err) {
    console.error(err);
  }
}

main();
