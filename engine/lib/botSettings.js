// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Bot Settings (Dynamic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";
import settings from "../../settings.js";

const DATA_PATH = path.resolve("./database/setting/botSettings.json");

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const DEFAULT = {
  sewa: {
    enabled: settings.sewa?.enabled ?? false,
    autoKick: settings.sewa?.autoKick ?? false
  },
  maintenance: {
    enabled: false,
    message: "🛠️ *BOT SEDANG MAINTENANCE*\n\nMohon tunggu ya, owner lagi benerin bot 😹\nNanti balik lagi kok ☝🏻"
  }
};

function readData() {
  try {
    ensureDir(DATA_PATH);
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT, null, 2), "utf8");
      return JSON.parse(JSON.stringify(DEFAULT));
    }
    const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8") || "{}");
    return {
      sewa: { ...DEFAULT.sewa, ...(raw.sewa || {}) },
      maintenance: { ...DEFAULT.maintenance, ...(raw.maintenance || {}) }
    };
  } catch (e) {
    console.error("[BOT-SET] Gagal baca:", e.message);
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[BOT-SET] Gagal tulis:", e.message);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SEWA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getSewaSettings() {
  return readData().sewa;
}

export function setSewaSettings(updates = {}) {
  const data = readData();
  data.sewa = { ...data.sewa, ...updates };
  writeData(data);
  return data.sewa;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAINTENANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getMaintenance() {
  return readData().maintenance;
}

export function setMaintenance(updates = {}) {
  const data = readData();
  data.maintenance = { ...data.maintenance, ...updates };
  writeData(data);
  return data.maintenance;
}

export function isMaintenance() {
  return readData().maintenance.enabled;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  getSewaSettings,
  setSewaSettings,
  getMaintenance,
  setMaintenance,
  isMaintenance
};