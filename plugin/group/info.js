// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Group: Info
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { getGroupSettings } from "../../engine/lib/groupSettings.js";

export default {
  meta: {
    name: "groupInfo",
    command: ["infogc", "listadmin", "linkgc", "totalchat"],
    category: "group",
    section: "ℹ️ GROUP INFO",
    description: "Info grup",
    owner: false,
    premium: false,
    group: true,
    private: false,
    admin: false
  },

  async run(sock, m, { command }) {
    const meta = await sock.groupMetadata(m.chat);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .infogc
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "infogc") {
      const admins = meta.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin"
      );

      return m.reply(
        `ℹ️ *GROUP INFO*\n\n` +
        `╭───〔 📋 INFO 〕\n` +
        `│ ⛬ Nama     : ${meta.subject}\n` +
        `│ ⛬ ID       : ${meta.id}\n` +
        `│ ⛬ Total    : ${meta.participants.length} member\n` +
        `│ ⛬ Admin    : ${admins.length} orang\n` +
        `│ ⛬ Owner    : @${String(meta.owner || "").split("@")[0] || "-"}\n` +
        `│ ⛬ Dibuat   : ${meta.creation ? new Date(meta.creation * 1000).toLocaleDateString("id-ID") : "-"}\n` +
        `╰────────────────\n\n` +
        `*Deskripsi:*\n${meta.desc || "-"}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .listadmin
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "listadmin") {
      const admins = meta.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin"
      );

      let text = `👑 *LIST ADMIN* (${admins.length})\n\n`;
      for (const a of admins) {
        const role = a.admin === "superadmin" ? "👑 Owner" : "🛡️ Admin";
        text += `> ${role} : @${String(a.id).split("@")[0]}\n`;
      }

      return m.reply(text);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .linkgc
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "linkgc") {
      try {
        const code = await sock.groupInviteCode(m.chat);
        return m.reply(`🔗 *LINK GRUP*\n\n> https://chat.whatsapp.com/${code}`);
      } catch (e) {
        return m.reply(`❌ Gagal ambil link: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .totalchat
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "totalchat") {
      const s = getGroupSettings(m.chat);
      return m.reply(
        `💬 *TOTAL CHAT GRUP*\n\n` +
        `> Total chat tercatat: *${s.totalChat || 0}*`
      );
    }
  }
};