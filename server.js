try { process.loadEnvFile(); } catch (e) { /* no .env file (e.g. on a host that sets variables itself) */ }

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const USE_SUPABASE = process.env.USE_SUPABASE === "true";
const BUCKET = "materials";
const rootDir = __dirname;
const DATA_DIR = path.join(rootDir, "data");
const MATERIALS_DIR = path.join(rootDir, "materials");
const MATERIALS_FILE = path.join(DATA_DIR, "materials.json");
const QUESTIONS_FILE = path.join(DATA_DIR, "questions.json");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");

function ensureLocalStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(MATERIALS_DIR, { recursive: true });
}

function loadLocalJson(filePath, fallback) {
  ensureLocalStorage();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function saveLocalJson(filePath, value) {
  ensureLocalStorage();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function getLocalMaterials() {
  return loadLocalJson(MATERIALS_FILE, []);
}

function saveLocalMaterials(rows) {
  saveLocalJson(MATERIALS_FILE, rows);
}

function getLocalQuestions() {
  return loadLocalJson(QUESTIONS_FILE, []);
}

function saveLocalQuestions(rows) {
  saveLocalJson(QUESTIONS_FILE, rows);
}

function getLocalAdmin() {
  return loadLocalJson(ADMIN_FILE, { passwordHash: null });
}

function saveLocalAdmin(adminObject) {
  saveLocalJson(ADMIN_FILE, adminObject);
}

const supabase = USE_SUPABASE && SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

if (!supabase) {
  console.warn("Supabase disabled. Running in local-file mode.");
}

const app = express();
const PORT = process.env.PORT || 3000;

const MATERIAL_COLUMNS = "id,title,description,level,semester,course,file";
const QUESTION_COLUMNS = "id,title,description,level,semester,file";

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(error);
    res.status(500).json({ message: "Something went wrong on the server. Please try again." });
  });

async function getAdminPasswordHash() {
  if (!supabase) {
    return getLocalAdmin().passwordHash || null;
  }

  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("password_hash")
      .eq("id", "main")
      .maybeSingle();
    if (error) throw error;
    return data ? data.password_hash : null;
  } catch (error) {
    console.warn("Supabase admin lookup failed; using local admin fallback.");
    return getLocalAdmin().passwordHash || null;
  }
}

async function saveUploadedFile(fileData, fileName) {
  if (!fileData || !fileName) return null;

  const match = String(fileData).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const safeFileName = path.basename(String(fileName)).replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!safeFileName) return null;

  const storagePath = `${Date.now()}-${safeFileName}`;

  if (!supabase) {
    const outputPath = path.join(MATERIALS_DIR, storagePath);
    fs.writeFileSync(outputPath, Buffer.from(match[2], "base64"));
    return `materials/${storagePath}`;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(match[2], "base64"), { contentType: match[1], upsert: false });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  } catch (error) {
    console.warn("Supabase upload failed; saving locally instead.");
    const outputPath = path.join(MATERIALS_DIR, storagePath);
    fs.writeFileSync(outputPath, Buffer.from(match[2], "base64"));
    return `materials/${storagePath}`;
  }
}

async function removeStoredFile(fileUrl) {
  const url = String(fileUrl || "");

  if (!supabase) {
    if (url.startsWith("materials/")) {
      const filePath = path.resolve(rootDir, url);
      const folder = path.resolve(rootDir, "materials");
      if (filePath.startsWith(`${folder}${path.sep}`)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // file already gone, or the host doesn't allow file changes
        }
      }
    }
    return;
  }

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);

  if (index !== -1) {
    const name = decodeURIComponent(url.slice(index + marker.length));
    await supabase.storage.from(BUCKET).remove([name]);
    return;
  }

  if (url.startsWith("materials/")) {
    const folder = path.resolve(rootDir, "materials");
    const filePath = path.resolve(rootDir, url);
    if (filePath.startsWith(`${folder}${path.sep}`)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        // file already gone, or the host doesn't allow file changes
      }
    }
  }
}

app.use(express.json({ limit: "50mb" }));

app.use((req, res, next) => {
  if (/^(\/server\.js|\/migrate\.js|\/package(-lock)?\.json|\/data|\/node_modules|\/\.env|\/\.git)/i.test(req.path)) {
    return res.status(404).end();
  }
  return next();
});

app.use(express.static(rootDir));

const requireAdmin = wrap(async (req, res, next) => {
  const passwordHash = await getAdminPasswordHash();
  const remoteAddress = req.socket.remoteAddress;
  const isLocalOwner =
    remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1";
  const hasValidPassword =
    passwordHash && hashPassword(req.get("X-Admin-Password") || "") === passwordHash;

  if (!isLocalOwner && !hasValidPassword) {
    return res.status(401).json({ message: "Admin access is required." });
  }
  return next();
});

app.get("/api/admin/status", wrap(async (req, res) => {
  res.json({ configured: Boolean(await getAdminPasswordHash()) });
}));

app.post("/api/admin/setup", wrap(async (req, res) => {
  if (await getAdminPasswordHash()) {
    return res.status(409).json({ message: "Admin password is already configured." });
  }

  const password = String(req.body?.password || "");
  if (password.length < 6) {
    return res.status(400).json({ message: "Use an admin password with at least 6 characters." });
  }

  if (!supabase) {
    saveLocalAdmin({ passwordHash: hashPassword(password) });
    return res.status(201).json({ authenticated: true });
  }

  try {
    const { error } = await supabase
      .from("admin_settings")
      .insert({ id: "main", password_hash: hashPassword(password) });
    if (error) throw error;
    return res.status(201).json({ authenticated: true });
  } catch (error) {
    console.warn("Supabase setup failed; saving local admin password instead.");
    saveLocalAdmin({ passwordHash: hashPassword(password) });
    return res.status(201).json({ authenticated: true });
  }
}));

app.post("/api/admin/check", requireAdmin, (req, res) => {
  res.json({ authenticated: true });
});

app.get("/api/materials", wrap(async (req, res) => {
  if (!supabase) {
    return res.json(getLocalMaterials());
  }

  try {
    const { data, error } = await supabase
      .from("materials")
      .select(MATERIAL_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.warn("Supabase materials fetch failed; using local data.");
    return res.json(getLocalMaterials());
  }
}));

app.post("/api/materials", requireAdmin, wrap(async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const uploadedFile = await saveUploadedFile(body.fileData, body.fileName);
  const file = uploadedFile || String(body.file || "").trim();
  const level = String(body.level || "200").trim();
  const semester = String(body.semester || "first").trim();
  const course = String(body.course || "EEE101").trim().toUpperCase();

  if (!title || !description || !file || !course) {
    return res.status(400).json({ message: "Please provide title, description, file, and course." });
  }

  if (!supabase) {
    const saved = { id: body.id || generateId("material"), title, description, level, semester, course, file };
    const rows = getLocalMaterials();
    rows.unshift(saved);
    saveLocalMaterials(rows);
    return res.status(201).json(saved);
  }

  try {
    const { data, error } = await supabase
      .from("materials")
      .insert({ id: body.id || generateId("material"), title, description, level, semester, course, file })
      .select(MATERIAL_COLUMNS)
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    const saved = { id: body.id || generateId("material"), title, description, level, semester, course, file };
    const rows = getLocalMaterials();
    rows.unshift(saved);
    saveLocalMaterials(rows);
    return res.status(201).json(saved);
  }
}));

app.put("/api/materials/:id", requireAdmin, wrap(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  if (!supabase) {
    const rows = getLocalMaterials();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Material not found." });
    }

    const current = rows[index];
    const uploadedFile = await saveUploadedFile(body.fileData, body.fileName);
    const updated = {
      ...current,
      title: String(body.title || current.title || "").trim(),
      description: String(body.description || current.description || "").trim(),
      level: String(body.level || current.level || "").trim(),
      semester: String(body.semester || current.semester || "").trim(),
      course: String(body.course || current.course || "").trim().toUpperCase(),
      file: uploadedFile || String(body.file || current.file || "").trim()
    };

    rows[index] = updated;
    saveLocalMaterials(rows);
    if (uploadedFile) await removeStoredFile(current.file);
    return res.json(updated);
  }

  try {
    const { data: current, error: findError } = await supabase
      .from("materials")
      .select(MATERIAL_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (findError) throw findError;
    if (!current) {
      return res.status(404).json({ message: "Material not found." });
    }

    const uploadedFile = await saveUploadedFile(body.fileData, body.fileName);
    const updates = {
      title: String(body.title || current.title || "").trim(),
      description: String(body.description || current.description || "").trim(),
      level: String(body.level || current.level || "").trim(),
      semester: String(body.semester || current.semester || "").trim(),
      course: String(body.course || current.course || "").trim().toUpperCase(),
      file: uploadedFile || String(body.file || current.file || "").trim()
    };

    const { data, error } = await supabase
      .from("materials")
      .update(updates)
      .eq("id", id)
      .select(MATERIAL_COLUMNS)
      .single();
    if (error) throw error;

    if (uploadedFile) await removeStoredFile(current.file);
    return res.json(data);
  } catch (error) {
    const rows = getLocalMaterials();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Material not found." });
    }
    const current = rows[index];
    const uploadedFile = await saveUploadedFile(body.fileData, body.fileName);
    const updated = {
      ...current,
      title: String(body.title || current.title || "").trim(),
      description: String(body.description || current.description || "").trim(),
      level: String(body.level || current.level || "").trim(),
      semester: String(body.semester || current.semester || "").trim(),
      course: String(body.course || current.course || "").trim().toUpperCase(),
      file: uploadedFile || String(body.file || current.file || "").trim()
    };
    rows[index] = updated;
    saveLocalMaterials(rows);
    if (uploadedFile) await removeStoredFile(current.file);
    return res.json(updated);
  }
}));

app.delete("/api/materials/:id", wrap(async (req, res) => {
  const { id } = req.params;

  if (!supabase) {
    const rows = getLocalMaterials();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Material not found." });
    }

    const [removed] = rows.splice(index, 1);
    saveLocalMaterials(rows);
    await removeStoredFile(removed.file);
    return res.json({ message: "Material deleted successfully.", deleted: removed });
  }

  try {
    const { data: removed, error: findError } = await supabase
      .from("materials")
      .select(MATERIAL_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (findError) throw findError;
    if (!removed) {
      return res.status(404).json({ message: "Material not found." });
    }

    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) throw error;

    await removeStoredFile(removed.file);
    return res.json({ message: "Material deleted successfully.", deleted: removed });
  } catch (error) {
    const rows = getLocalMaterials();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Material not found." });
    }
    const [removed] = rows.splice(index, 1);
    saveLocalMaterials(rows);
    await removeStoredFile(removed.file);
    return res.json({ message: "Material deleted successfully.", deleted: removed });
  }
}));

app.get("/api/questions", wrap(async (req, res) => {
  if (!supabase) {
    return res.json(getLocalQuestions());
  }

  try {
    const { data, error } = await supabase
      .from("questions")
      .select(QUESTION_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.warn("Supabase questions fetch failed; using local data.");
    return res.json(getLocalQuestions());
  }
}));

app.post("/api/questions", requireAdmin, wrap(async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const uploadedFile = await saveUploadedFile(body.fileData, body.fileName);
  const file = uploadedFile || String(body.file || "").trim();
  const level = String(body.level || "200").trim();
  const semester = String(body.semester || "first").trim();

  if (!title || !description || !file) {
    return res.status(400).json({ message: "Please provide title, description, and file." });
  }

  if (!supabase) {
    const saved = { id: body.id || generateId("question"), title, description, level, semester, file };
    const rows = getLocalQuestions();
    rows.unshift(saved);
    saveLocalQuestions(rows);
    return res.status(201).json(saved);
  }

  try {
    const { data, error } = await supabase
      .from("questions")
      .insert({ id: generateId("question"), title, description, level, semester, file })
      .select(QUESTION_COLUMNS)
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    const saved = { id: body.id || generateId("question"), title, description, level, semester, file };
    const rows = getLocalQuestions();
    rows.unshift(saved);
    saveLocalQuestions(rows);
    return res.status(201).json(saved);
  }
}));

app.delete("/api/questions/:id", wrap(async (req, res) => {
  const { id } = req.params;

  if (!supabase) {
    const rows = getLocalQuestions();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Question not found." });
    }
    const [removed] = rows.splice(index, 1);
    saveLocalQuestions(rows);
    await removeStoredFile(removed.file);
    return res.json({ message: "Question deleted successfully.", deleted: removed });
  }

  try {
    const { data: removed, error: findError } = await supabase
      .from("questions")
      .select(QUESTION_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (findError) throw findError;
    if (!removed) {
      return res.status(404).json({ message: "Question not found." });
    }

    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw error;

    await removeStoredFile(removed.file);
    return res.json({ message: "Question deleted successfully.", deleted: removed });
  } catch (error) {
    const rows = getLocalQuestions();
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Question not found." });
    }
    const [removed] = rows.splice(index, 1);
    saveLocalQuestions(rows);
    await removeStoredFile(removed.file);
    return res.json({ message: "Question deleted successfully.", deleted: removed });
  }
}));

app.use((req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EEE Hub backend listening on port ${PORT}`);
  });
}

module.exports = app;