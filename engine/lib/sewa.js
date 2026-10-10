// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Sewa System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const SEWA_PATH = path.resolve("./database/global/sewa.json");
const COUNTER_PATH = path.resolve("./database/global/counter.json");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FILE I/O
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readSewa() {
  try {
    ensureDir(SEWA_PATH);
    if (!fs.existsSync(SEWA_PATH)) {
      fs.writeFileSync(SEWA_PATH, "[]", "utf8");
      return [];
    }
    const parsed = JSON.parse(fs.readFileSync(SEWA_PATH, "utf8") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[SEWA] Gagal baca:", e.message);
    return [];
  }
}

function writeSewa(data) {
  try {
    ensureDir(SEWA_PATH);
    fs.writeFileSync(SEWA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[SEWA] Gagal tulis:", e.message);
  }
}

function readCounter() {
  try {
    ensureDir(COUNTER_PATH);
    if (!fs.existsSync(COUNTER_PATH)) {
      const init = {
        id: { deposit: 0, sewa: 0 },
        total: { user: 0, grup: 0, sewa: 0, transaksi: 0 }
      };
      fs.writeFileSync(COUNTER_PATH, JSON.stringify(init, null, 2), "utf8");
      return init;
    }
    return JSON.parse(fs.readFileSync(COUNTER_PATH, "utf8") || "{}");
  } catch (e) {
    console.error("[SEWA] Gagal baca counter:", e.message);
    return { id: { deposit: 0, sewa: 0 }, total: { user: 0, grup: 0, sewa: 0, transaksi: 0 } };
  }
}

function writeCounter(data) {
  try {
    ensureDir(COUNTER_PATH);
    fs.writeFileSync(COUNTER_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[SEWA] Gagal tulis counter:", e.message);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeJid(jid) {
  if (!jid) return "";
  if (String(jid).endsWith("@g.us")) return String(jid).trim();
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

function generateId() {
  const counter = readCounter();
  const nextNum = (counter.id?.sewa || 0) + 1;

  counter.id = counter.id || { deposit: 0, sewa: 0 };
  counter.id.sewa = nextNum;
  writeCounter(counter);

  return `SEWA-${String(nextNum).padStart(4, "0")}`;
}

/**
 * Parse durasi: 1m, 3m, 6m, 1y
 */
export function parseDuration(str) {
  const s = String(str || "").toLowerCase().trim();
  const m = s.match(/^(\d+)\s*(d|m|y)$/);
  if (!m) return 0;

  const num = parseInt(m[1]);
  const unit = m[2];
  const DAY = 24 * 60 * 60 * 1000;

  switch (unit) {
    case "d": return num * DAY;
    case "m": return num * 30 * DAY;
    case "y": return num * 365 * DAY;
    default: return 0;
  }
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      timeZone: "Asia/Makassar",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "-";
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUTO EXPIRED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function checkSewaExpired() {
  const data = readSewa();
  const now = Date.now();
  let changed = false;

  for (const s of data) {
    if (s.status !== "active") continue;
    if (!s.tanggalExpired) continue;

    const exp = new Date(s.tanggalExpired).getTime();
    if (isNaN(exp)) continue;

    if (now >= exp) {
      s.status = "expired";
      changed = true;
      console.log(`[SEWA] ⏰ Expired: ${s.id} (${s.idGrup})`);
    }
  }

  if (changed) writeSewa(data);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Cek status sewa grup
 * @returns {object|null} entry sewa atau null
 */
export function getSewa(idGrup) {
  const target = normalizeJid(idGrup);
  if (!target) return null;

  const data = readSewa();
  return data.find((s) => s.idGrup === target) || null;
}

/**
 * Cek apakah grup boleh pakai bot
 * @returns {{ allowed: boolean, status: string, entry: object|null }}
 */
export function checkSewa(idGrup) {
  const entry = getSewa(idGrup);

  if (!entry) {
    return { allowed: false, status: "not_registered", entry: null };
  }

  if (entry.status === "active") {
    // Cek expired
    if (entry.tanggalExpired) {
      const exp = new Date(entry.tanggalExpired).getTime();
      if (!isNaN(exp) && Date.now() >= exp) {
        return { allowed: false, status: "expired", entry };
      }
    }
    return { allowed: true, status: "active", entry };
  }

  // expired, banned, suspend, blacklist → read-only
  return { allowed: false, status: entry.status, entry };
}

/**
 * Cek apakah grup read-only (diam tapi masih di grup)
 */
export function isReadOnly(idGrup) {
  const result = checkSewa(idGrup);
  if (result.allowed) return false;
  if (result.status === "not_registered") return false;
  return true;
}

/**
 * Get sewa by ID (SEWA-0001)
 */
export function getSewaById(id) {
  const data = readSewa();
  const target = String(id || "").toUpperCase().trim();
  return data.find((s) => String(s.id).toUpperCase() === target) || null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SET / UPDATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Tambah sewa baru
 */
export function addSewa({ idGrup, nomor, durasi, harga = "Rp 0", addedBy = null }) {
  const targetGrup = normalizeJid(idGrup);
  const targetNomor = normalizeJid(nomor);

  if (!targetGrup || !targetNomor) return { error: "invalid_target" };

  const ms = parseDuration(durasi);
  if (ms <= 0) return { error: "invalid_duration" };

  const data = readSewa();

  // Cek duplikat
  if (data.some((s) => s.idGrup === targetGrup)) {
    return { error: "duplicate" };
  }

  const now = new Date();
  const expired = new Date(now.getTime() + ms);

  const entry = {
    id: generateId(),
    idGrup: targetGrup,
    nomor: targetNomor,
    tanggalMulai: now.toISOString(),
    tanggalExpired: expired.toISOString(),
    status: "active",
    addedBy: addedBy || null,
    harga,
    durasi
  };

  data.push(entry);
  writeSewa(data);

  // Update total counter
  const counter = readCounter();
  counter.total = counter.total || {};
  counter.total.sewa = (counter.total.sewa || 0) + 1;
  counter.total.grup = (counter.total.grup || 0) + 1;
  writeCounter(counter);

  return entry;
}

/**
 * Extend sewa
 */
export function extendSewa(idOrGrup, durasi) {
  const ms = parseDuration(durasi);
  if (ms <= 0) return { error: "invalid_duration" };

  const data = readSewa();
  const target = String(idOrGrup || "").toUpperCase().trim();

  let entry = data.find((s) => String(s.id).toUpperCase() === target);
  if (!entry) {
    entry = data.find((s) => s.idGrup === normalizeJid(idOrGrup));
  }
  if (!entry) return { error: "not_found" };

  const now = Date.now();
  const base = entry.tanggalExpired
    ? Math.max(new Date(entry.tanggalExpired).getTime(), now)
    : now;

  entry.tanggalExpired = new Date(base + ms).toISOString();
  entry.status = "active";
  entry.durasi = durasi;

  writeSewa(data);
  return entry;
}

/**
 * Ubah status sewa
 */
export function setSewaStatus(idOrGrup, status) {
  const valid = ["active", "expired", "banned", "suspend", "blacklist"];
  if (!valid.includes(status)) return { error: "invalid_status" };

  const data = readSewa();
  const target = String(idOrGrup || "").toUpperCase().trim();

  let entry = data.find((s) => String(s.id).toUpperCase() === target);
  if (!entry) {
    entry = data.find((s) => s.idGrup === normalizeJid(idOrGrup));
  }
  if (!entry) return { error: "not_found" };

  entry.status = status;
  writeSewa(data);
  return entry;
}

/**
 * Hapus sewa
 */
export function removeSewa(idOrGrup) {
  const data = readSewa();
  const target = String(idOrGrup || "").toUpperCase().trim();

  const filtered = data.filter((s) => {
    if (String(s.id).toUpperCase() === target) return false;
    if (s.idGrup === normalizeJid(idOrGrup)) return false;
    return true;
  });

  if (filtered.length === data.length) return false;
  writeSewa(filtered);
  return true;
}

/**
 * List semua sewa
 */
export function listSewa() {
  return readSewa();
}

export { formatDate };

export default {
  parseDuration,
  checkSewaExpired,
  getSewa,
  checkSewa,
  isReadOnly,
  getSewaById,
  addSewa,
  extendSewa,
  setSewaStatus,
  removeSewa,
  listSewa,
  formatDate
};