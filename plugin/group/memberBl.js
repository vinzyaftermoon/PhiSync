// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Group: Member Blacklist
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  addMemberBlacklist,
  removeMemberBlacklist,
  listMemberBlacklist,
  getMemberBlacklist
} from "../../engine/lib/blacklistMember.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeJid(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

function parseTarget(m, raw) {
  // Reply
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) return quoted;

  // Mention
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];

  // Nomor
  if (!raw) return null;
  const clean = String(raw).replace(/[^0-9]/g, "");
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "memberBl",
    command: ["bl", "unbl", "listbl"],
    category: "group",
    section: "🚫 GROUP BLACKLIST",
    description: "Blacklist member dari grup",
    owner: false,
    premium: false,
    group: true,
    private: false,
    admin: true
  },

  async run(sock, m, { args, command }) {
    const idGrup = m.chat;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .bl @user <alasan?>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "bl") {
      const target = parseTarget(m, args[0]);
      const alasan = args.slice(1).join(" ") || "Sok asik";

      if (!target) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `> .bl @tag\n` +
          `> .bl @tag alasan\n` +
          `> .bl (reply)\n\n` +
          `Contoh: *.bl @user sok asik*`
        );
      }

      // Cegah blacklist owner bot
      const ownerList = (await import("../../settings.js")).default.owner || [];
      const targetNum = String(target).split("@")[0].replace(/[^0-9]/g, "");

      if (ownerList.map((o) => String(o).replace(/[^0-9]/g, "")).includes(targetNum)) {
        return m.reply(`❌ Nggak bisa blacklist owner bot! 😹`);
      }

      // Cegah blacklist diri sendiri
      if (normalizeJid(target) === normalizeJid(m.sender)) {
        return m.reply(`❌ Nggak bisa blacklist diri sendiri cung! 🤡`);
      }

      addMemberBlacklist(idGrup, target, alasan, m.sender);

      return m.reply(
        `✅ *Member di-blacklist!*\n\n` +
        `> Target : @${target.split("@")[0]}\n` +
        `> Grup   : ${idGrup.split("@")[0]}\n` +
        `> Alasan : ${alasan}\n\n` +
        `_Member ini nggak bisa pakai bot di grup ini_ 😹`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .unbl @user
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "unbl") {
      const target = parseTarget(m, args[0]);

      if (!target) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `> .unbl @tag\n` +
          `> .unbl (reply)`
        );
      }

      const ok = removeMemberBlacklist(idGrup, target);
      if (!ok) {
        return m.reply(`❌ Member *${target.split("@")[0]}* nggak ada di blacklist grup ini.`);
      }

      return m.reply(
        `✅ *Member di-unblacklist!*\n\n` +
        `> Target : @${target.split("@")[0]}\n` +
        `> Grup   : ${idGrup.split("@")[0]}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .listbl
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "listbl") {
      const data = listMemberBlacklist(idGrup);
      const entries = Object.entries(data);

      if (!entries.length) {
        return m.reply(`📋 *Belum ada member di-blacklist di grup ini.*`);
      }

      let text = `🚫 *BLACKLIST MEMBER GRUP*\n\n`;

      for (const [jid, info] of entries) {
        text +=
          `╭───〔 @${jid.split("@")[0]} 〕\n` +
          `│ ⛬ Alasan : ${info.reason || "-"}\n` +
          `│ ⛬ By     : ${info.addedBy ? "@" + info.addedBy.split("@")[0] : "-"}\n` +
          `│ ⛬ Date   : ${info.date ? new Date(info.date).toLocaleDateString("id-ID", { timeZone: "Asia/Makassar" }) : "-"}\n` +
          `╰────────────────\n\n`;
      }

      return m.reply(text);
    }
  }
};