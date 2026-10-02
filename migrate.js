// Run once: node migrate.js
// Copies data/materials.json and data/questions.json into Supabase.
try { process.loadEnvFile(); } catch (e) {}

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

function load(fileName) {
  const filePath = path.join(__dirname, "data", fileName);
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function move(table, rows, columns, prefix) {
  if (!rows.length) {
    console.log(`${table}: nothing to move`);
    return;
  }

  const now = Date.now();
  // First item in the JSON was the newest, so give it the latest timestamp.
  const records = rows.map((row, i) => {
    const record = { created_at: new Date(now - i * 1000).toISOString() };
    for (const column of columns) record[column] = row[column] ?? null;
    if (!record.id) record.id = `${prefix}-${now}-${i}`;
    return record;
  });

  const { error } = await supabase.from(table).upsert(records, { onConflict: "id" });
  if (error) {
    console.error(`${table} failed:`, error.message);
    process.exit(1);
  }
  console.log(`${table}: moved ${records.length} rows`);
}

(async () => {
  await move("materials", load("materials.json"),
    ["id", "title", "description", "level", "semester", "course", "file"], "material");
  await move("questions", load("questions.json"),
    ["id", "title", "description", "level", "semester", "file"], "question");
  console.log("Done.");
})();