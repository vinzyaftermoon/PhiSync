// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Limit System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

import { getPlanLevel } from "./userPlan.js";

const SETTINGS_PATH = path.resolve("./database/setting/limitSettings.json");
const DATA_PATH = path.resolve("./database/global/limitData.json");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DEFAULT SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_SETTINGS = {
  enabled: true,
  resetHour: 0,
  timezone: "Asia/Makassar",
  limit: {
    free: 20,
    basic: 100,
    premium: 500,
    vip: 9999
  },
  lastReset: 0
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SETTINGS I/O
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readSettings() {
  try {
    ensureDir(SETTINGS_PATH);
    if (!fs.existsSync(SETTINGS_PATH)) {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
      return { ...DEFAULT_SETTINGS };
    }
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw || "{}") };
  } catch (e) {
    console.error("[LIMIT] Gagal baca settings:", e.message);
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(data) {
  try {
    ensureDir(SETTINGS_PATH);
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[LIMIT] Gagal tulis settings:", e.message);
    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DATA I/O
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function readData() {
  try {
    ensureDir(DATA_PATH);
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, "{}", "utf8");
      return {};
    }
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8") || "{}");
  } catch (e) {
    console.error("[LIMIT] Gagal baca data:", e.message);
    return {};
  }
}

function writeData(data) {
  try {
    ensureDir(DATA_PATH);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[LIMIT] Gagal tulis data:", e.message);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RESET HARIAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getTodayWITA() {
  const s = readSettings();
  return new Date().toLocaleDateString("en-CA", {
    timeZone: s.timezone || "Asia/Makassar"
  });
}

function getHourWITA() {
  const s = readSettings();
  return parseInt(
    new Date().toLocaleString("en-US", {
      timeZone: s.timezone || "Asia/Makassar",
      hour: "numeric",
      hour12: false
    })
  );
}

function shouldReset() {
  const s = readSettings();
  const lastReset = s.lastReset || 0;
  if (!lastReset) return true;

  const lastDate = new Date(lastReset * 1000).toLocaleDateString("en-CA", {
    timeZone: s.timezone || "Asia/Makassar"
  });
  const today = getTodayWITA();

  return lastDate !== today && getHourWITA() >= (s.resetHour || 0);
}

export function resetAllLimit() {
  const data = readData();
  const now = Math.floor(Date.now() / 1000);

  for (const jid in data) {
    data[jid].used = 0;
    data[jid].lastReset = now;
  }
  writeData(data);

  const s = readSettings();
  s.lastReset = now;
  writeSettings(s);

  console.log("[LIMIT] ✅ Semua limit di-reset.");
  return true;
}

export function checkAutoReset() {
  const s = readSettings();
  if (!s.enabled) return;
  if (shouldReset()) resetAllLimit();
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LIMIT USER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getMaxLimit(plan = "free") {
  const s = readSettings();
  return s.limit?.[plan] ?? s.limit?.free ?? 20;
}

function getUserData(data, sender) {
  if (!data[sender]) {
    data[sender] = {
      used: 0,
      customLimit: null,
      lastReset: Math.floor(Date.now() / 1000)
    };
  }
  return data[sender];
}

/**
 * Ambil limit user
 * @param {string} sender - JID user
 * @param {string|null} plan - override plan (opsional)
 * @returns {{ used, max, sisa, customLimit, plan }}
 */
export function getLimit(sender, plan = null) {
  const data = readData();
  const user = getUserData(data, sender);

  // Kalau plan nggak dikasih, ambil dari userPlan
  const userPlan = plan || getPlanLevel(sender);

  const max = user.customLimit ?? getMaxLimit(userPlan);

  return {
    used: user.used || 0,
    max,
    sisa: Math.max(0, max - (user.used || 0)),
    customLimit: user.customLimit,
    plan: userPlan
  };
}

export function isLimitEnough(sender, amount = 1, plan = null) {
  const { sisa } = getLimit(sender, plan);
  return sisa >= amount;
}

export function useLimit(sender, amount = 1) {
  const data = readData();
  const user = getUserData(data, sender);
  user.used = (user.used || 0) + amount;
  writeData(data);
  return user.used;
}

export function addLimit(sender, amount = 1) {
  const data = readData();
  const user = getUserData(data, sender);
  user.used = Math.max(0, (user.used || 0) - amount);
  writeData(data);
  return user.used;
}

export function resetLimit(sender) {
  const data = readData();
  const user = getUserData(data, sender);
  user.used = 0;
  user.lastReset = Math.floor(Date.now() / 1000);
  writeData(data);
}

/**
 * Set limit custom user (.setlimit)
 */
export function setUserLimit(sender, jumlah) {
  const data = readData();
  const user = getUserData(data, sender);
  user.customLimit = Number(jumlah);
  writeData(data);
  return user;
}

/**
 * Hapus limit custom user (balik ke plan)
 */
export function removeUserLimit(sender) {
  const data = readData();
  const user = getUserData(data, sender);
  user.customLimit = null;
  writeData(data);
  return user;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SETTING PLAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function setPlanLimit(plan, jumlah) {
  const s = readSettings();
  if (!s.limit) s.limit = {};
  s.limit[plan] = Number(jumlah);
  writeSettings(s);
  return s.limit;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TOGGLE GLOBAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function toggleGlobalLimit(state) {
  const s = readSettings();
  s.enabled = !!state;
  writeSettings(s);
  return s.enabled;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  readSettings,
  writeSettings,
  checkAutoReset,
  resetAllLimit,
  getMaxLimit,
  getLimit,
  isLimitEnough,
  useLimit,
  addLimit,
  resetLimit,
  setUserLimit,
  removeUserLimit,
  setPlanLimit,
  toggleGlobalLimit
};