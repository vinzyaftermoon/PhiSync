// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Sewa Manager
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  addSewa,
  extendSewa,
  removeSewa,
  listSewa,
  getSewa,
  getSewaById,
  setSewaStatus,
  formatDate
} from "../../engine/lib/sewa.js";

function normalizeJid(jid) {
  if (!jid) return "";
  if (String(jid).endsWith("@g.us")) return String(jid).trim();
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

function parseMentionOrNumber(m, raw) {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];

  if (!raw) return null;
  const clean = String(raw).replace(/[^0-9]/g, "");
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}

export default {
  meta: {
    name: "sewaManager",
    command: ["addsewa", "delsewa", "listsewa", "ceksewa", "extendsewa", "setstatussewa"],
    category: "owner",
    section: "🏠 SEWA",
    description: "Manage sewa bot",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .addsewa <idGrup> <nomor> <durasi>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "addsewa") {
      let idGrup, nomor, durasi;

      // Kalau di grup & reply → pakai grup sekarang
      if (m.isGroup && args.length >= 2) {
        idGrup = m.chat;
        nomor = parseMentionOrNumber(m, args[0]);
        durasi = args[1];
      } else if (args.length >= 3) {
        idGrup = normalizeJid(args[0]);
        nomor = parseMentionOrNumber(m, args[1]);
        durasi = args[2];
      }

      if (!idGrup || !nomor || !durasi) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `*Cara pakai:*\n` +
          `> .addsewa <idGrup> <nomor> <durasi>\n` +
          `> .addsewa (di grup) @tag <durasi>\n\n` +
          `*Contoh:*\n` +
          `> .addsewa 628xxx@g.us 628xxx 1m\n` +
          `> .addsewa @user 1m (di grup)\n\n` +
          `*Durasi:* 1m, 3m, 6m, 1y`
        );
      }

      const result = addSewa({
        idGrup,
        nomor,
        durasi,
        harga: args[3] || "Rp 0",
        addedBy: m.sender
      });

      if (result?.error) {
        const errMsg = {
          invalid_target: "❌ ID grup atau nomor nggak valid!",
          invalid_duration: "❌ Durasi nggak valid! Contoh: 1m, 3m, 6m, 1y",
          duplicate: "❌ Grup ini udah terdaftar sewa!"
        };
        return m.reply(errMsg[result.error] || "❌ Gagal tambah sewa.");
      }

      return m.reply(
        `✅ *Sewa berhasil ditambahkan!*\n\n` +
        `> ID      : *${result.id}*\n` +
        `> Grup    : ${result.idGrup}\n` +
        `> Nomor   : @${result.nomor.split("@")[0]}\n` +
        `> Durasi  : *${result.durasi}*\n` +
        `> Mulai   : ${formatDate(result.tanggalMulai)}\n` +
        `> Expired : *${formatDate(result.tanggalExpired)}*\n` +
        `> Status  : ✅ active`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .delsewa <id / idGrup>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "delsewa") {
      const target = args[0];
      if (!target) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `> .delsewa <ID>\n` +
          `> .delsewa <idGrup>\n\n` +
          `Contoh: *.delsewa SEWA-0001*`
        );
      }

      const ok = removeSewa(target);
      if (!ok) {
        return m.reply(`❌ Sewa *${target}* nggak ditemukan.`);
      }

      return m.reply(`✅ Sewa *${target}* berhasil dihapus.`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .listsewa
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "listsewa") {
      const data = listSewa();

      if (!data.length) {
        return m.reply(`📋 *Belum ada sewa terdaftar.*`);
      }

      let text = `🏠 *LIST SEWA*\n\n`;

      for (const s of data) {
        const statusEmoji = {
          active: "✅",
          expired: "⏰",
          suspended: "⏸️",
          banned: "🚫",
          blacklist: "⬛"
        }[s.status] || "❓";

        text +=
          `╭───〔 ${s.id} 〕\n` +
          `│ ⛬ Grup    : ${s.idGrup.split("@")[0]}\n` +
          `│ ⛬ Penyewa : @${String(s.nomor).split("@")[0]}\n` +
          `│ ⛬ Durasi  : ${s.durasi}\n` +
          `│ ⛬ Expired : ${formatDate(s.tanggalExpired)}\n` +
          `│ ⛬ Status  : ${statusEmoji} ${s.status}\n` +
          `╰────────────────\n\n`;
      }

      return m.reply(text);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .ceksewa <id / idGrup>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "ceksewa") {
      const target = args[0];
      if (!target) {
        return m.reply(
          `❌ *Format salah!*\n\n> .ceksewa <ID / idGrup>`
        );
      }

      let entry = getSewaById(target) || getSewa(target);
      if (!entry) {
        return m.reply(`❌ Sewa *${target}* nggak ditemukan.`);
      }

      let groupName = "-";
      try {
        const meta = await sock.groupMetadata(entry.idGrup);
        groupName = meta.subject || "-";
      } catch {}

      const statusEmoji = {
        active: "✅",
        expired: "⏰",
        suspended: "⏸️",
        banned: "🚫",
        blacklist: "⬛"
      }[entry.status] || "❓";

      return m.reply(
        `🏠 *DETAIL SEWA*\n\n` +
        `> ID       : *${entry.id}*\n` +
        `> Grup     : ${groupName}\n` +
        `> ID Grup  : ${entry.idGrup}\n` +
        `> Penyewa  : @${String(entry.nomor).split("@")[0]}\n` +
        `> Durasi   : ${entry.durasi}\n` +
        `> Mulai    : ${formatDate(entry.tanggalMulai)}\n` +
        `> Expired  : ${formatDate(entry.tanggalExpired)}\n` +
        `> Status   : ${statusEmoji} ${entry.status}\n` +
        `> Harga    : ${entry.harga || "-"}\n` +
        `> Added by : ${entry.addedBy ? "@" + entry.addedBy.split("@")[0] : "-"}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .extendsewa <id / idGrup> <durasi>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "extendsewa") {
      const target = args[0];
      const durasi = args[1];

      if (!target || !durasi) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `> .extendsewa <ID / idGrup> <durasi>\n\n` +
          `Contoh: *.extendsewa SEWA-0001 1m*`
        );
      }

      const result = extendSewa(target, durasi);
      if (result?.error) {
        const errMsg = {
          invalid_duration: "❌ Durasi nggak valid! Contoh: 1m, 3m, 6m, 1y",
          not_found: "❌ Sewa nggak ditemukan."
        };
        return m.reply(errMsg[result.error] || "❌ Gagal extend sewa.");
      }

      return m.reply(
        `✅ *Sewa diperpanjang!*\n\n` +
        `> ID         : *${result.id}*\n` +
        `> Grup       : ${result.idGrup}\n` +
        `> Durasi     : *${result.durasi}*\n` +
        `> Expired    : *${formatDate(result.tanggalExpired)}*\n` +
        `> Status     : ✅ active`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .setstatussewa <id> <status>
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "setstatussewa") {
      const target = args[0];
      const status = String(args[1] || "").toLowerCase();

      if (!target || !status) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `> .setstatussewa <ID> <status>\n\n` +
          `*Status:* active, expired, banned, suspend, blacklist\n\n` +
          `Contoh: *.setstatussewa SEWA-0001 banned*`
        );
      }

      const result = setSewaStatus(target, status);
      if (result?.error) {
        const errMsg = {
          invalid_status: "❌ Status nggak valid! Pilih: active, expired, banned, suspend, blacklist",
          not_found: "❌ Sewa nggak ditemukan."
        };
        return m.reply(errMsg[result.error] || "❌ Gagal ubah status.");
      }

      return m.reply(
        `✅ *Status sewa diubah!*\n\n` +
        `> ID     : *${result.id}*\n` +
        `> Grup   : ${result.idGrup}\n` +
        `> Status : *${result.status}*`
      );
    }
  }
};