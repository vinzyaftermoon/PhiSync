// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Blacklist System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const USER_PATH = path.resolve("./database/global/blacklist.json");
const GROUP_PATH = path.resolve("./database/global/blacklistGroup.json");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FILE I/O
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readFile(p) {
  try {
    ensureDir(p);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, "{}", "utf8");
      return {};
    }
    return JSON.parse(fs.readFileSync(p, "utf8") || "{}");
  } catch (e) {
    console.error("[BLACKLIST] Gagal baca:", e.message);
    return {};
  }
}

function writeFile(p, data) {
  try {
    ensureDir(p);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[BLACKLIST] Gagal tulis:", e.message);
  }
}

function normalizeJid(jid) {
  if (!jid) return "";
  if (String(jid).endsWith("@g.us")) {
    return String(jid).trim();
  }
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  USER BLACKLIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function isBlacklisted(jid) {
  const target = normalizeJid(jid);
  if (!target) return false;
  const data = readFile(USER_PATH);
  return !!data[target];
}

export function getBlacklist(jid) {
  const target = normalizeJid(jid);
  if (!target) return null;
  const data = readFile(USER_PATH);
  return data[target] || null;
}

export function addBlacklist(jid, reason = "-", addedBy = null) {
  const target = normalizeJid(jid);
  if (!target) return false;

  const data = readFile(USER_PATH);
  data[target] = {
    reason,
    addedBy: addedBy || null,
    date: new Date().toISOString()
  };
  writeFile(USER_PATH, data);
  return true;
}

export function removeBlacklist(jid) {
  const target = normalizeJid(jid);
  if (!target) return false;

  const data = readFile(USER_PATH);
  if (!data[target]) return false;

  delete data[target];
  writeFile(USER_PATH, data);
  return true;
}

export function listBlacklist() {
  return readFile(USER_PATH);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GROUP BLACKLIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function isGroupBlacklisted(jid) {
  if (!jid) return false;
  const target = String(jid).trim();
  if (!target.endsWith("@g.us")) return false;
  const data = readFile(GROUP_PATH);
  return !!data[target];
}

export function getGroupBlacklist(jid) {
  if (!jid) return null;
  const target = String(jid).trim();
  const data = readFile(GROUP_PATH);
  return data[target] || null;
}

export function addGroupBlacklist(jid, name = "-", reason = "-", addedBy = null) {
  if (!jid || !String(jid).endsWith("@g.us")) return false;

  const data = readFile(GROUP_PATH);
  data[String(jid)] = {
    name,
    reason,
    addedBy: addedBy || null,
    date: new Date().toISOString()
  };
  writeFile(GROUP_PATH, data);
  return true;
}

export function removeGroupBlacklist(jid) {
  if (!jid) return false;
  const target = String(jid).trim();

  const data = readFile(GROUP_PATH);
  if (!data[target]) return false;

  delete data[target];
  writeFile(GROUP_PATH, data);
  return true;
}

export function listGroupBlacklist() {
  return readFile(GROUP_PATH);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  isBlacklisted,
  getBlacklist,
  addBlacklist,
  removeBlacklist,
  listBlacklist,
  isGroupBlacklisted,
  getGroupBlacklist,
  addGroupBlacklist,
  removeGroupBlacklist,
  listGroupBlacklist
};