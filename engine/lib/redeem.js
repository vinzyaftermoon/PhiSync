// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Redeem System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("./database/global/redeemCodes.json");

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
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[REDEEM] Gagal baca:", e.message);
    return [];
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[REDEEM] Gagal tulis:", e.message);
  }
}

function normalizeJid(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

export function parseDuration(str) {
  const s = String(str || "").toLowerCase().trim();
  if (s === "-" || !s) return 0;

  const m = s.match(/^(\d+)\s*(h|d)$/);
  if (!m) return 0;

  const num = parseInt(m[1]);
  const unit = m[2];
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  return unit === "h" ? num * HOUR : num * DAY;
}

/**
 * Cari kode redeem
 */
export function findCode(code) {
  const data = readData();
  const target = String(code || "").toUpperCase().trim();
  return data.find((c) => String(c.code).toUpperCase() === target) || null;
}

/**
 * Cek kode valid & bisa dipakai user
 */
export function checkRedeem(code, jid) {
  const target = normalizeJid(jid);
  const entry = findCode(code);

  if (!entry) return { ok: false, reason: "not_found" };
  if (!target) return { ok: false, reason: "invalid_user" };

  // Cek expired
  if (entry.expired) {
    const exp = new Date(entry.expired).getTime();
    if (!isNaN(exp) && Date.now() >= exp) {
      return { ok: false, reason: "expired" };
    }
  }

  // Cek udah pernah pakai
  if (Array.isArray(entry.usedBy) && entry.usedBy.includes(target)) {
    return { ok: false, reason: "used" };
  }

  return { ok: true, entry };
}

/**
 * Pakai kode redeem
 */
export function useRedeem(code, jid) {
  const target = normalizeJid(jid);
  const data = readData();
  const targetCode = String(code || "").toUpperCase().trim();

  const entry = data.find((c) => String(c.code).toUpperCase() === targetCode);
  if (!entry) return null;

  if (!Array.isArray(entry.usedBy)) entry.usedBy = [];
  if (!entry.usedBy.includes(target)) entry.usedBy.push(target);

  writeData(data);
  return entry;
}

/**
 * Bikin kode baru
 */
export function createCode({ code, reward, amount, time, createdBy }) {
  const data = readData();
  const targetCode = String(code || "").toUpperCase().trim();

  if (!targetCode) return null;
  if (data.some((c) => String(c.code).toUpperCase() === targetCode)) {
    return { error: "duplicate" };
  }

  const validRewards = ["limit", "saldo"];
  const rewardLower = String(reward || "").toLowerCase();
  if (!validRewards.includes(rewardLower)) {
    return { error: "invalid_reward" };
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return { error: "invalid_amount" };
  }

  let expired = null;
  if (time && time !== "-") {
    const ms = parseDuration(time);
    if (ms <= 0) return { error: "invalid_time" };
    expired = new Date(Date.now() + ms).toISOString();
  }

  const entry = {
    code: targetCode,
    reward: rewardLower,
    amount: amt,
    time: time || "-",
    usedBy: [],
    expired,
    createdBy: createdBy || null,
    createdAt: new Date().toISOString()
  };

  data.push(entry);
  writeData(data);
  return entry;
}

/**
 * Hapus kode
 */
export function deleteCode(code) {
  const data = readData();
  const targetCode = String(code || "").toUpperCase().trim();
  const filtered = data.filter((c) => String(c.code).toUpperCase() !== targetCode);

  if (filtered.length === data.length) return false;
  writeData(filtered);
  return true;
}

/**
 * List semua kode
 */
export function listCodes() {
  return readData();
}

export default {
  parseDuration,
  findCode,
  checkRedeem,
  useRedeem,
  createCode,
  deleteCode,
  listCodes
};