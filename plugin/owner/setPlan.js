// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Set Plan
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  setUserPlan,
  removeUserPlan,
  getUserPlan,
  getPlanRemaining,
  parseDuration
} from "../../engine/lib/userPlan.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseTarget(m, raw) {
  if (!raw) return null;

  // 1. Dari reply
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) return quoted;

  // 2. Dari mention
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];

  // 3. Dari nomor
  const clean = String(raw).replace(/[^0-9]/g, "");
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "-";

  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.join(" ") || "-";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "setplan",
    command: ["setplan", "delplan", "checkplan"],
    category: "owner",
    section: "👥 USER CONTROL",
    description: "Manage plan user",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {

    // ━━━ .setplan ━━━
    if (command === "setplan") {
      const target = parseTarget(m, args[0]);
      const plan = String(args[1] || "").toLowerCase();
      const duration = args[2] || null;

      if (!target || !plan) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `*Cara pakai:*\n` +
          `> .setplan @tag premium 1m\n` +
          `> .setplan 628xxx vip 30d\n` +
          `> .setplan (reply) basic 7d\n\n` +
          `*Plan:* free, basic, premium, vip\n` +
          `*Time:* 1d, 7d, 1m, 3m, 1y\n` +
          `*Kosongin time* = permanent`
        );
      }

      const validPlans = ["free", "basic", "premium", "vip"];
      if (!validPlans.includes(plan)) {
        return m.reply(
          `❌ Plan *${plan}* tidak valid!\n\n` +
          `Plan tersedia: *free*, *basic*, *premium*, *vip*`
        );
      }

      // Cek format durasi
      if (duration && parseDuration(duration) <= 0) {
        return m.reply(
          `❌ Format time *${duration}* tidak valid!\n\n` +
          `Contoh: *1d*, *7d*, *1m*, *3m*, *1y*`
        );
      }

      const result = setUserPlan(target, plan, duration, m.sender);

      if (!result) {
        return m.reply(`❌ Gagal set plan.`);
      }

      const expText = result.tanggalExpired
        ? new Date(result.tanggalExpired).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
        : "Permanent";

      return m.reply(
        `✅ *Plan berhasil diset!*\n\n` +
        `> Target    : @${target.split("@")[0]}\n` +
        `> Plan      : *${plan.toUpperCase()}*\n` +
        `> Durasi    : *${duration || "Permanent"}*\n` +
        `> Expired   : *${expText}*`
      );
    }

    // ━━━ .delplan ━━━
    if (command === "delplan") {
      const target = parseTarget(m, args[0]);

      if (!target) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `*Cara pakai:*\n` +
          `> .delplan @tag\n` +
          `> .delplan 628xxx\n` +
          `> .delplan (reply)`
        );
      }

      const ok = removeUserPlan(target);

      if (!ok) {
        return m.reply(`❌ User *${target.split("@")[0]}* nggak punya plan.`);
      }

      return m.reply(`✅ Plan *${target.split("@")[0]}* dihapus.`);
    }

    // ━━━ .checkplan ━━━
    if (command === "checkplan") {
      const target = parseTarget(m, args[0]) || m.sender;
      const user = getUserPlan(target);

      if (!user) {
        return m.reply(
          `📊 *Plan Info*\n\n` +
          `> User  : @${target.split("@")[0]}\n` +
          `> Plan  : *FREE* (default)\n` +
          `> Status: -`
        );
      }

      const remaining = getPlanRemaining(target);

      return m.reply(
        `📊 *Plan Info*\n\n` +
        `> User     : @${target.split("@")[0]}\n` +
        `> Plan     : *${String(user.plan).toUpperCase()}*\n` +
        `> Status   : *${user.status}*\n` +
        `> Mulai    : ${user.tanggalMulai || "-"}\n` +
        `> Expired  : ${user.tanggalExpired || "Permanent"}\n` +
        `> Sisa     : *${formatDuration(remaining)}*\n` +
        `> Added by : ${user.addedBy ? "@" + user.addedBy.split("@")[0] : "-"}`
      );
    }
  }
};