// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Blacklist
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  addBlacklist,
  removeBlacklist,
  listBlacklist,
  addGroupBlacklist,
  removeGroupBlacklist,
  listGroupBlacklist
} from "../../engine/lib/blacklist.js";

function normalizeJid(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

function parseTarget(m, raw) {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) return quoted;

  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];

  if (!raw) return null;
  const clean = String(raw).replace(/[^0-9]/g, "");
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}

export default {
  meta: {
    name: "blacklistManager",
    command: ["blacklist", "unblacklist", "listblacklist", "addbl", "delbl", "listbl"],
    category: "owner",
    section: "🚫 BLACKLIST",
    description: "Manage blacklist user & grup",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .blacklist @user
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "blacklist") {
      const target = parseTarget(m, args[0]);

      if (!target) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `*Cara pakai:*\n` +
          `> .blacklist @tag\n` +
          `> .blacklist 628xxx\n` +
          `> .blacklist (reply)\n\n` +
          `Tambahan reason (opsional):\n` +
          `> .blacklist @tag sok asik`
        );
      }

      const reason = args.slice(1).join(" ") || "Sok asik";
      addBlacklist(target, reason, m.sender);

      return m.reply(
        `✅ *User di-blacklist!*\n\n` +
        `> Target : @${target.split("@")[0]}\n` +
        `> Reason : ${reason}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .unblacklist @user
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "unblacklist") {
      const target = parseTarget(m, args[0]);

      if (!target) {
        return m.reply(
          `❌ Format salah!\n\n> .unblacklist @tag\n> .unblacklist 628xxx\n> .unblacklist (reply)`
        );
      }

      const ok = removeBlacklist(target);
      if (!ok) {
        return m.reply(`❌ User *${target.split("@")[0]}* nggak ada di blacklist.`);
      }

      return m.reply(`✅ *User di-unblacklist!*\n\n> Target : @${target.split("@")[0]}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .listblacklist
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "listblacklist") {
      const data = listBlacklist();
      const entries = Object.entries(data);

      if (!entries.length) {
        return m.reply(`📋 *Belum ada user di-blacklist.*`);
      }

      let text = `🚫 *LIST BLACKLIST USER*\n\n`;
      for (const [jid, info] of entries) {
        text +=
          `╭───〔 ${jid.split("@")[0]} 〕\n` +
          `│ ⛬ Reason : ${info.reason || "-"}\n` +
          `│ ⛬ By     : ${info.addedBy ? "@" + info.addedBy.split("@")[0] : "-"}\n` +
          `│ ⛬ Date   : ${info.date ? new Date(info.date).toLocaleDateString("id-ID", { timeZone: "Asia/Makassar" }) : "-"}\n` +
          `╰────────────────\n\n`;
      }

      return m.reply(text);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .addbl — blacklist GRUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "addbl") {
      if (!m.isGroup) {
        return m.reply(
          `❌ Command ini cuma bisa di grup!\n\n` +
          `> Masuk ke grup → ketik .addbl`
        );
      }

      let groupMeta = null;
      try {
        groupMeta = await sock.groupMetadata(m.chat);
      } catch {}

      const groupName = groupMeta?.subject || "Grup Tidak Dikenal";
      const groupId = m.chat;
      const reason = args.join(" ") || "Sok asik";

      addGroupBlacklist(groupId, groupName, reason, m.sender);

      return m.reply(
        `✅ *Grup di-blacklist!*\n\n` +
        `> Nama   : ${groupName}\n` +
        `> ID     : ${groupId}\n` +
        `> Reason : ${reason}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .delbl — unblacklist GRUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "delbl") {
      const raw = String(args[0] || "").trim();

      // Ambil dari ID atau dari grup sekarang
      let groupId = raw;
      if (!groupId && m.isGroup) groupId = m.chat;
      if (!groupId || !groupId.endsWith("@g.us")) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `*Cara pakai:*\n` +
          `> .delbl (di grup)\n` +
          `> .delbl 123xxx@g.us`
        );
      }

      const ok = removeGroupBlacklist(groupId);
      if (!ok) {
        return m.reply(`❌ Grup *${groupId}* nggak ada di blacklist.`);
      }

      return m.reply(`✅ *Grup di-unblacklist!*\n\n> ID : ${groupId}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .listbl — list blacklist grup
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "listbl") {
      const data = listGroupBlacklist();
      const entries = Object.entries(data);

      if (!entries.length) {
        return m.reply(`📋 *Belum ada grup di-blacklist.*`);
      }

      let text = `🚫 *LIST BLACKLIST GROUP*\n\n`;
      for (const [jid, info] of entries) {
        text +=
          `╭───〔 ${info.name || "Grup"} 〕\n` +
          `│ ⛬ ID     : ${jid}\n` +
          `│ ⛬ Reason : ${info.reason || "-"}\n` +
          `│ ⛬ By     : ${info.addedBy ? "@" + info.addedBy.split("@")[0] : "-"}\n` +
          `│ ⛬ Date   : ${info.date ? new Date(info.date).toLocaleDateString("id-ID", { timeZone: "Asia/Makassar" }) : "-"}\n` +
          `╰────────────────\n\n`;
      }

      return m.reply(text);
    }
  }
};