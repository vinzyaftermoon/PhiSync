// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Limit Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  readSettings,
  writeSettings,
  resetAllLimit,
  setUserLimit,
  removeUserLimit,
  setPlanLimit,
  toggleGlobalLimit,
  getLimit,
  getMaxLimit
} from "../../engine/lib/limit.js";

import {
  getUserPlan,
  getPlanLevel,
  getPlanRemaining
} from "../../engine/lib/userPlan.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseTarget(m, raw) {
  // 1. Reply
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) return quoted;

  // 2. Mention
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];

  // 3. Nomor
  if (!raw) return null;
  const clean = String(raw).replace(/[^0-9]/g, "");
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "-";
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);

  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || !parts.length) parts.push(`${s}s`);
  return parts.join(" ");
}

function progressBar(used, max) {
  if (max <= 0) return "▱▱▱▱▱▱▱▱▱▱";
  const percent = Math.min(100, Math.floor((used / max) * 100));
  const full = Math.floor(percent / 10);
  const empty = 10 - full;
  return "▰".repeat(full) + "▱".repeat(empty);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "limitSettings",
    command: ["setlimit", "setplanlimit", "resetall", "global-limit", "ceklimit"],
    category: "owner",
    section: "⚙️ GLOBAL CONTROL",
    description: "Manage limit user",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setlimit <tag/nomor/reply> <jumlah>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setlimit") {
      const target = parseTarget(m, args[0]);
      const jumlah = Number(args[1]);

      if (!target || isNaN(jumlah)) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `*Cara pakai:*\n` +
          `> .setlimit @tag 50\n` +
          `> .setlimit 628xxx 50\n` +
          `> .setlimit (reply) 50\n\n` +
          `Gunakan *0* untuk hapus custom limit.`
        );
      }

      if (jumlah === 0) {
        removeUserLimit(target);
        return m.reply(`✅ Custom limit *${target.split("@")[0]}* dihapus.`);
      }

      setUserLimit(target, jumlah);
      return m.reply(
        `✅ Custom limit diset!\n\n` +
        `> Target : @${target.split("@")[0]}\n` +
        `> Limit  : *${jumlah}*`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setplanlimit <plan> <jumlah>
    //  .setplanlimit <tag/nomor/reply> <jumlah>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setplanlimit") {
      const rawTarget = String(args[0] || "").toLowerCase();
      const jumlah = Number(args[1]);

      if (!rawTarget || isNaN(jumlah)) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `*Cara pakai:*\n` +
          `> .setplanlimit free 20\n` +
          `> .setplanlimit premium 1000\n` +
          `> .setplanlimit @tag 50\n\n` +
          `Plan tersedia: *free*, *basic*, *premium*, *vip*`
        );
      }

      const plans = ["free", "basic", "premium", "vip"];
      if (plans.includes(rawTarget)) {
        setPlanLimit(rawTarget, jumlah);
        return m.reply(
          `✅ Limit plan *${rawTarget}* diubah!\n\n` +
          `> Limit baru : *${jumlah}*`
        );
      }

      const target = parseTarget(m, args[0]);
      if (!target) {
        return m.reply(
          `❌ Plan *${rawTarget}* tidak dikenal.\n\n` +
          `Plan tersedia: *free*, *basic*, *premium*, *vip*`
        );
      }

      setUserLimit(target, jumlah);
      return m.reply(
        `✅ Custom limit diset!\n\n` +
        `> Target : @${target.split("@")[0]}\n` +
        `> Limit  : *${jumlah}*`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .resetall
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "resetall") {
      resetAllLimit();
      return m.reply(`✅ Semua limit user berhasil di-reset.`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .global-limit --on / --off
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "global-limit") {
      const flag = String(args[0] || "").toLowerCase();

      if (flag === "--on" || flag === "on") {
        toggleGlobalLimit(true);
        return m.reply(`✅ Sistem limit *AKTIF*.`);
      }
      if (flag === "--off" || flag === "off") {
        toggleGlobalLimit(false);
        return m.reply(`✅ Sistem limit *NONAKTIF*.`);
      }

      const s = readSettings();
      return m.reply(
        `⚙️ *Status Limit Global*\n\n` +
        `> Status : *${s.enabled ? "AKTIF ✅" : "NONAKTIF ❌"}*\n` +
        `> Reset  : *${s.resetHour}:00 ${s.timezone}*\n\n` +
        `*Cara pakai:*\n` +
        `> .global-limit --on\n` +
        `> .global-limit --off`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .ceklimit <tag/nomor/reply>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "ceklimit") {
      const target = parseTarget(m, args[0]) || m.sender;

      if (!target) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `*Cara pakai:*\n` +
          `> .ceklimit @tag\n` +
          `> .ceklimit 628xxx\n` +
          `> .ceklimit (reply)\n` +
          `> .ceklimit (tanpa argumen = cek diri sendiri)`
        );
      }

      // ── Ambil data limit ──
      const limit = getLimit(target);
      const plan = getPlanLevel(target);
      const planData = getUserPlan(target);
      const maxPlan = getMaxLimit(plan);

      // ── Info plan ──
      let planInfo = "";
      if (planData) {
        const remaining = getPlanRemaining(target);
        const expText = planData.tanggalExpired
          ? new Date(planData.tanggalExpired).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
          : "Permanent";

        planInfo =
          `╭───〔 📋 PLAN INFO 〕\n` +
          `│ ⛬ Plan     : *${String(planData.plan).toUpperCase()}*\n` +
          `│ ⛬ Status   : *${planData.status}*\n` +
          `│ ⛬ Mulai    : ${planData.tanggalMulai ? new Date(planData.tanggalMulai).toLocaleDateString("id-ID", { timeZone: "Asia/Makassar" }) : "-"}\n` +
          `│ ⛬ Expired  : ${expText}\n` +
          `│ ⛬ Sisa     : *${formatDuration(remaining)}*\n` +
          `╰────────────────\n\n`;
      } else {
        planInfo =
          `╭───〔 📋 PLAN INFO 〕\n` +
          `│ ⛬ Plan     : *FREE* (default)\n` +
          `│ ⛬ Status   : -\n` +
          `╰────────────────\n\n`;
      }

      // ── Info limit ──
      const customText = limit.customLimit !== null
        ? `\n> ⚠️ *Custom limit aktif:* ${limit.customLimit}`
        : "";

      const percentText = limit.max > 0
        ? `${Math.floor((limit.used / limit.max) * 100)}%`
        : "0%";

      return m.reply(
        `📊 *LIMIT INFO*\n\n` +
        `> User : @${target.split("@")[0]}\n\n` +
        planInfo +
        `╭───〔 💠 LIMIT 〕\n` +
        `│ ⛬ Plan limit : *${maxPlan}*\n` +
        `│ ⛬ Terpakai   : *${limit.used}*\n` +
        `│ ⛬ Sisa       : *${limit.sisa}*\n` +
        `│ ⛬ Max        : *${limit.max}*${customText}\n` +
        `╰────────────────\n\n` +
        `  [ ${progressBar(limit.used, limit.max)} ] ${percentText}\n\n` +
        `> ⏰ Reset harian: *00:00 WITA*`
      );
    }
  }
};