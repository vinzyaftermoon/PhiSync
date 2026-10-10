// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Group: Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { updateGroupSettings } from "../../engine/lib/groupSettings.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "groupManagement",
    command: [
      "promote", "demote", "kick", "add", "resetlink",
      "open", "close", "closetime", "opentime",
      "setname", "setdeskgc", "setppgc",
      "setwelcome", "setleave"
    ],
    category: "group",
    section: "👥 GROUP MANAGEMENT",
    description: "Manage grup (admin)",
    owner: false,
    premium: false,
    group: true,
    private: false,
    admin: true,
    botAdmin: true
  },

  async run(sock, m, { args, command }) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .promote @user
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "promote") {
      const target = parseTarget(m, args[0]);
      if (!target) return m.reply("❌ Format: *.promote @user*");

      try {
        await sock.groupParticipantsUpdate(m.chat, [target], "promote");
        return m.reply(`✅ Berhasil promote *@${target.split("@")[0]}* jadi admin!`);
      } catch (e) {
        return m.reply(`❌ Gagal promote: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .demote @user
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "demote") {
      const target = parseTarget(m, args[0]);
      if (!target) return m.reply("❌ Format: *.demote @user*");

      try {
        await sock.groupParticipantsUpdate(m.chat, [target], "demote");
        return m.reply(`✅ Berhasil demote *@${target.split("@")[0]}* jadi member!`);
      } catch (e) {
        return m.reply(`❌ Gagal demote: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .kick @user
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "kick") {
      const target = parseTarget(m, args[0]);
      if (!target) return m.reply("❌ Format: *.kick @user*");

      try {
        await sock.groupParticipantsUpdate(m.chat, [target], "remove");
        return m.reply(`✅ Berhasil kick *@${target.split("@")[0]}*!`);
      } catch (e) {
        return m.reply(`❌ Gagal kick: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .add <nomor>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "add") {
      const target = parseTarget(m, args[0]);
      if (!target) return m.reply("❌ Format: *.add 628xxx*");

      try {
        await sock.groupParticipantsUpdate(m.chat, [target], "add");
        return m.reply(`✅ Berhasil add *@${target.split("@")[0]}*!`);
      } catch (e) {
        return m.reply(`❌ Gagal add: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .resetlink
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "resetlink") {
      try {
        await sock.groupRevokeInvite(m.chat);
        const code = await sock.groupInviteCode(m.chat);
        return m.reply(
          `✅ *Link grup di-reset!*\n\n` +
          `> https://chat.whatsapp.com/${code}`
        );
      } catch (e) {
        return m.reply(`❌ Gagal reset link: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .open / .close
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "open") {
      try {
        await sock.groupSettingUpdate(m.chat, "not_announcement");
        return m.reply(`🔓 *Grup dibuka!*\n\nSemua member bisa chat.`);
      } catch (e) {
        return m.reply(`❌ Gagal buka grup: ${e.message}`);
      }
    }

    if (command === "close") {
      try {
        await sock.groupSettingUpdate(m.chat, "announcement");
        return m.reply(`🔒 *Grup ditutup!*\n\nCuma admin yang bisa chat.`);
      } catch (e) {
        return m.reply(`❌ Gagal tutup grup: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .closetime / .opentime HH:MM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "closetime") {
      const time = String(args[0] || "").trim();
      if (!/^\d{1,2}:\d{2}$/.test(time)) {
        return m.reply(`❌ Format: *.closetime 22:00*`);
      }
      updateGroupSettings(m.chat, { closeTime: time });
      return m.reply(`✅ *Waktu tutup diset!*\n\n> Grup ditutup tiap: *${time} WIB*`);
    }

    if (command === "opentime") {
      const time = String(args[0] || "").trim();
      if (!/^\d{1,2}:\d{2}$/.test(time)) {
        return m.reply(`❌ Format: *.opentime 06:00*`);
      }
      updateGroupSettings(m.chat, { openTime: time });
      return m.reply(`✅ *Waktu buka diset!*\n\n> Grup dibuka tiap: *${time} WIB*`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setname <nama>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setname") {
      const nama = args.join(" ").trim();
      if (!nama) return m.reply("❌ Format: *.setname Nama Baru*");

      try {
        await sock.groupUpdateSubject(m.chat, nama);
        return m.reply(`✅ Nama grup diubah jadi: *${nama}*`);
      } catch (e) {
        return m.reply(`❌ Gagal ubah nama: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setdeskgc <deskripsi>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setdeskgc") {
      const desk = args.join(" ").trim();
      if (!desk) return m.reply("❌ Format: *.setdeskgc Deskripsi baru*");

      try {
        await sock.groupUpdateDescription(m.chat, desk);
        return m.reply(`✅ Deskripsi grup diubah!`);
      } catch (e) {
        return m.reply(`❌ Gagal ubah deskripsi: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setppgc <image>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setppgc") {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMsg = quoted?.imageMessage || m.message?.imageMessage;

      if (!imageMsg) {
        return m.reply(`❌ Kirim/reply gambar dengan caption *.setppgc*`);
      }

      try {
        const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");
        const stream = await downloadContentFromMessage(imageMsg, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.updateProfilePicture(m.chat, buffer);
        return m.reply(`✅ Foto grup berhasil diubah!`);
      } catch (e) {
        return m.reply(`❌ Gagal ubah foto: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setwelcome <text>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setwelcome") {
      const text = args.join(" ").trim();
      if (!text) {
        return m.reply(
          `❌ Format: *.setwelcome <text>*\n\n` +
          `*Variabel:*\n` +
          `> @user = mention member baru\n` +
          `> @group = nama grup\n\n` +
          `Contoh:\n` +
          `> .setwelcome 👋 Selamat datang @user di @group!`
        );
      }
      updateGroupSettings(m.chat, { welcomeText: text });
      return m.reply(`✅ Welcome text diset!\n\n> ${text}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setleave <text>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setleave") {
      const text = args.join(" ").trim();
      if (!text) {
        return m.reply(
          `❌ Format: *.setleave <text>*\n\n` +
          `*Variabel:* @user, @group\n\n` +
          `Contoh:\n` +
          `> .setleave 👋 Selamat tinggal @user...`
        );
      }
      updateGroupSettings(m.chat, { leaveText: text });
      return m.reply(`✅ Leave text diset!\n\n> ${text}`);
    }
  }
};