// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Group: Cek ID Grup
//  .cekidgc <link> / .cekidgc (di grup)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import settings from "../../settings.js";

export default {
  meta: {
    name: "cekidgc",
    command: ["cekidgc", "idgc"],
    category: "group",
    section: "⚔️ TOOLS GROUP",
    description: "Cek ID grup dari link",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {
    // ── Kalau di grup & nggak ada argumen ──
    if (!args.length && m.isGroup) {
      const meta = await sock.groupMetadata(m.chat).catch(() => null);

      return m.reply(
        `📋 *INFO GRUP*\n\n` +
        `╭───〔 📌 DETAIL 〕\n` +
        `│ ⛬ Nama   : ${meta?.subject || "-"}\n` +
        `│ ⛬ ID     : ${m.chat}\n` +
        `│ ⛬ Member : ${meta?.participants?.length || "-"}\n` +
        `│ ⛬ Admin  : ${meta?.participants?.filter((p) => p.admin).length || "-"}\n` +
        `╰────────────────\n\n` +
        `_Ketik .cekidgc <link> buat cek dari link_`
      );
    }

    // ── Kalau ada argumen ──
    const input = args.join(" ").trim();

    if (!input) {
      return m.reply(
        `❌ *Format salah!*\n\n` +
        `*Cara pakai:*\n` +
        `> .cekidgc <link>\n` +
        `> .cekidgc (di grup)\n\n` +
        `*Contoh:*\n` +
        `> .cekidgc https://chat.whatsapp.com/xxxxx`
      );
    }

    // ── Extract kode dari link ──
    const match = input.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);

    if (!match) {
      return m.reply(
        `❌ *Link grup nggak valid!*\n\n` +
        `> Pastikan link formatnya:\n` +
        `> https://chat.whatsapp.com/xxxxx`
      );
    }

    const code = match[1];

    // ── Ambil info grup ──
    try {
      const info = await sock.groupGetInviteInfo(code);

      return m.reply(
        `📋 *INFO GRUP DARI LINK*\n\n` +
        `╭───〔 📌 DETAIL 〕\n` +
        `│ ⛬ Nama   : ${info.subject || "-"}\n` +
        `│ ⛬ ID     : ${info.id || "-"}\n` +
        `│ ⛬ Member : ${info.size || "-"}\n` +
        `│ ⛬ Owner  : ${info.owner ? "@" + String(info.owner).split("@")[0] : "-"}\n` +
        `│ ⛬ Dibuat : ${info.creation ? new Date(info.creation * 1000).toLocaleDateString("id-ID") : "-"}\n` +
        `╰────────────────\n\n` +
        `╭───〔 🔗 LINK 〕\n` +
        `│ ⛬ ${input}\n` +
        `╰────────────────\n\n` +
        `_Copy ID grup: ${info.id}_`
      );
    } catch (e) {
      return m.reply(
        `❌ *Gagal ambil info grup!*\n\n` +
        `> ${e.message}\n\n` +
        `_Kemungkinan: link expired / bot bukan member_`
      );
    }
  }
};