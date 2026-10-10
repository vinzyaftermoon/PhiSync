// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Claim System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("./database/global/claimData.json");

const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 hari
const CLAIM_AMOUNT = 10;

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  try {
    ensureDir(DATA_PATH);
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, "{}", "utf8");
      return {};
    }
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8") || "{}");
  } catch (e) {
    console.error("[CLAIM] Gagal baca:", e.message);
    return {};
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[CLAIM] Gagal tulis:", e.message);
  }
}

function normalizeJid(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

/**
 * Cek cooldown claim
 * @returns {{ canClaim: boolean, remaining: number, lastClaim: number, totalClaim: number }}
 */
export function checkClaim(jid) {
  const target = normalizeJid(jid);
  if (!target) return { canClaim: false, remaining: 0, lastClaim: 0, totalClaim: 0 };

  const data = readData();
  const user = data[target] || { lastClaim: 0, totalClaim: 0 };

  const now = Date.now();
  const elapsed = now - (user.lastClaim || 0);
  const remaining = Math.max(0, COOLDOWN_MS - elapsed);

  return {
    canClaim: remaining <= 0,
    remaining,
    lastClaim: user.lastClaim || 0,
    totalClaim: user.totalClaim || 0
  };
}

/**
 * Proses claim — update lastClaim
 */
export function doClaim(jid) {
  const target = normalizeJid(jid);
  if (!target) return false;

  const data = readData();
  const user = data[target] || { lastClaim: 0, totalClaim: 0 };

  user.lastClaim = Date.now();
  user.totalClaim = (user.totalClaim || 0) + 1;

  data[target] = user;
  writeData(data);
  return true;
}

export function getClaimData(jid) {
  const target = normalizeJid(jid);
  if (!target) return null;
  const data = readData();
  return data[target] || null;
}

export { COOLDOWN_MS, CLAIM_AMOUNT };

export default {
  checkClaim,
  doClaim,
  getClaimData,
  COOLDOWN_MS,
  CLAIM_AMOUNT
};