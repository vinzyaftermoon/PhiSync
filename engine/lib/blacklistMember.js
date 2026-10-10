// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Blacklist Member (per Grup)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("./database/global/blacklistMember.json");

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
    console.error("[BL-MEMBER] Gagal baca:", e.message);
    return {};
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[BL-MEMBER] Gagal tulis:", e.message);
  }
}

function normalizeUser(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

function normalizeGroup(jid) {
  if (!jid) return "";
  return String(jid).endsWith("@g.us") ? String(jid).trim() : "";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Cek apakah member di-blacklist di grup
 */
export function isMemberBlacklisted(idGrup, jid) {
  const g = normalizeGroup(idGrup);
  const u = normalizeUser(jid);
  if (!g || !u) return false;

  const data = readData();
  return !!(data[g] && data[g][u]);
}

export function getMemberBlacklist(idGrup, jid) {
  const g = normalizeGroup(idGrup);
  const u = normalizeUser(jid);
  if (!g || !u) return null;

  const data = readData();
  return (data[g] && data[g][u]) || null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ADD / REMOVE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function addMemberBlacklist(idGrup, jid, reason = "-", addedBy = null) {
  const g = normalizeGroup(idGrup);
  const u = normalizeUser(jid);
  if (!g || !u) return false;

  const data = readData();
  if (!data[g]) data[g] = {};

  data[g][u] = {
    reason,
    addedBy: addedBy || null,
    date: new Date().toISOString()
  };

  writeData(data);
  return true;
}

export function removeMemberBlacklist(idGrup, jid) {
  const g = normalizeGroup(idGrup);
  const u = normalizeUser(jid);
  if (!g || !u) return false;

  const data = readData();
  if (!data[g] || !data[g][u]) return false;

  delete data[g][u];

  // Kalau grup kosong, hapus grup
  if (Object.keys(data[g]).length === 0) {
    delete data[g];
  }

  writeData(data);
  return true;
}

export function listMemberBlacklist(idGrup) {
  const g = normalizeGroup(idGrup);
  if (!g) return {};

  const data = readData();
  return data[g] || {};
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  isMemberBlacklisted,
  getMemberBlacklist,
  addMemberBlacklist,
  removeMemberBlacklist,
  listMemberBlacklist
};