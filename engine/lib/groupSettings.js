// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Group Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("./database/global/groupSettings.json");

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
    console.error("[GRP-SET] Gagal baca:", e.message);
    return {};
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[GRP-SET] Gagal tulis:", e.message);
  }
}

function normalizeGroup(jid) {
  if (!jid) return "";
  return String(jid).endsWith("@g.us") ? String(jid).trim() : "";
}

const DEFAULT_SETTINGS = {
  welcome: false,
  leave: false,
  antiLink: false,
  antiToxic: false,
  welcomeText: "👋 Selamat datang @user di @group!",
  leaveText: "👋 Selamat tinggal @user...",
  openTime: null,
  closeTime: null,
  totalChat: 0
};

export function getGroupSettings(idGrup) {
  const g = normalizeGroup(idGrup);
  if (!g) return { ...DEFAULT_SETTINGS };

  const data = readData();
  return { ...DEFAULT_SETTINGS, ...(data[g] || {}) };
}

export function updateGroupSettings(idGrup, updates = {}) {
  const g = normalizeGroup(idGrup);
  if (!g) return null;

  const data = readData();
  data[g] = { ...DEFAULT_SETTINGS, ...(data[g] || {}), ...updates };
  writeData(data);
  return data[g];
}

export function incrementChat(idGrup) {
  const g = normalizeGroup(idGrup);
  if (!g) return 0;

  const data = readData();
  if (!data[g]) data[g] = { ...DEFAULT_SETTINGS };
  data[g].totalChat = (data[g].totalChat || 0) + 1;
  writeData(data);
  return data[g].totalChat;
}

export function getAllGroups() {
  return readData();
}

export { DEFAULT_SETTINGS };

export default {
  getGroupSettings,
  updateGroupSettings,
  incrementChat,
  getAllGroups,
  DEFAULT_SETTINGS
};