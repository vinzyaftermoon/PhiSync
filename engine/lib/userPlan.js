// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — User Plan System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("./database/global/userPlan.json");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VALID_PLANS = ["free", "basic", "premium", "vip"];
const PAID_PLANS = ["basic", "premium", "vip"];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FILE I/O
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  try {
    ensureDir(DATA_PATH);
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, "[]", "utf8");
      return [];
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[USERPLAN] Gagal baca data:", e.message);
    return [];
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[USERPLAN] Gagal tulis data:", e.message);
    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeJid(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

/**
 * Parse durasi: 1d, 7d, 1m, 3m, 1y
 * @returns {number} milliseconds
 */
export function parseDuration(str) {
  const s = String(str || "").toLowerCase().trim();
  const m = s.match(/^(\d+)\s*(d|m|y|h)$/);
  if (!m) return 0;

  const num = parseInt(m[1]);
  const unit = m[2];

  const DAY = 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;

  switch (unit) {
    case "h": return num * HOUR;
    case "d": return num * DAY;
    case "m": return num * 30 * DAY;   // 1 bulan = 30 hari
    case "y": return num * 365 * DAY;
    default: return 0;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUTO EXPIRED CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Cek & update status expired semua user
 * Dipanggil tiap ada command
 */
export function checkExpired() {
  const data = readData();
  const now = Date.now();
  let changed = false;

  for (const user of data) {
    if (user.status !== "active") continue;
    if (!user.tanggalExpired) continue;

    const expTime = new Date(user.tanggalExpired).getTime();
    if (isNaN(expTime)) continue;

    if (now >= expTime) {
      user.status = "expired";
      changed = true;
      console.log(`[USERPLAN] ⏰ Expired: ${user.nomor}`);
    }
  }

  if (changed) writeData(data);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Ambil data plan user
 * @returns {object|null}
 */
export function getUserPlan(jid) {
  const target = normalizeJid(jid);
  if (!target) return null;

  const data = readData();
  return data.find((u) => u.nomor === target) || null;
}

/**
 * Ambil level plan user (free kalau nggak ada / expired)
 * @returns {string} free | basic | premium | vip
 */
export function getPlanLevel(jid) {
  const user = getUserPlan(jid);
  if (!user) return "free";
  if (user.status !== "active") return "free";
  return user.plan || "free";
}

/**
 * Cek apakah plan user aktif
 */
export function isPlanActive(jid) {
  const user = getUserPlan(jid);
  if (!user) return false;
  if (user.status !== "active") return false;

  if (user.tanggalExpired) {
    const expTime = new Date(user.tanggalExpired).getTime();
    if (!isNaN(expTime) && Date.now() >= expTime) return false;
  }

  return true;
}

/**
 * Ambil sisa waktu plan (ms)
 */
export function getPlanRemaining(jid) {
  const user = getUserPlan(jid);
  if (!user || user.status !== "active") return 0;
  if (!user.tanggalExpired) return 0;

  const expTime = new Date(user.tanggalExpired).getTime();
  if (isNaN(expTime)) return 0;

  return Math.max(0, expTime - Date.now());
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SET / UPDATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Set plan user
 * @param {string} jid
 * @param {string} plan - free|basic|premium|vip
 * @param {string} duration - 1d, 1m, 1y, dst (opsional, kalau nggak ada = permanent)
 * @param {string} addedBy - JID owner
 */
export function setUserPlan(jid, plan, duration = null, addedBy = null) {
  const target = normalizeJid(jid);
  if (!target) return null;

  const planName = String(plan || "free").toLowerCase();
  if (!VALID_PLANS.includes(planName)) return null;

  const data = readData();
  const now = new Date();
  const existing = data.find((u) => u.nomor === target);

  // Hitung expired
  let expIso = null;
  if (duration) {
    const ms = parseDuration(duration);
    if (ms > 0) {
      expIso = new Date(now.getTime() + ms).toISOString();
    }
  }

  if (existing) {
    existing.plan = planName;
    existing.tanggalMulai = now.toISOString();
    existing.tanggalExpired = expIso;
    existing.status = "active";
    existing.addedBy = addedBy || existing.addedBy || null;
  } else {
    data.push({
      nomor: target,
      plan: planName,
      tanggalMulai: now.toISOString(),
      tanggalExpired: expIso,
      status: "active",
      addedBy: addedBy || null
    });
  }

  writeData(data);
  return data.find((u) => u.nomor === target);
}

/**
 * Tambah waktu plan (extend)
 */
export function addPlanTime(jid, duration) {
  const target = normalizeJid(jid);
  if (!target) return null;

  const data = readData();
  const user = data.find((u) => u.nomor === target);
  if (!user) return null;

  const ms = parseDuration(duration);
  if (ms <= 0) return null;

  const now = Date.now();
  const base = user.tanggalExpired
    ? Math.max(new Date(user.tanggalExpired).getTime(), now)
    : now;

  user.tanggalExpired = new Date(base + ms).toISOString();
  user.status = "active";

  writeData(data);
  return user;
}

/**
 * Hapus plan user (kembali ke free)
 */
export function removeUserPlan(jid) {
  const target = normalizeJid(jid);
  if (!target) return false;

  const data = readData();
  const filtered = data.filter((u) => u.nomor !== target);

  if (filtered.length === data.length) return false;

  writeData(filtered);
  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function listByPlan(plan = null) {
  const data = readData();
  if (!plan) return data;
  return data.filter((u) => u.plan === plan);
}

export function listActive() {
  const data = readData();
  return data.filter((u) => u.status === "active");
}

export function listExpired() {
  const data = readData();
  return data.filter((u) => u.status === "expired");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT DEFAULT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  parseDuration,
  checkExpired,
  getUserPlan,
  getPlanLevel,
  isPlanActive,
  getPlanRemaining,
  setUserPlan,
  addPlanTime,
  removeUserPlan,
  listByPlan,
  listActive,
  listExpired
};