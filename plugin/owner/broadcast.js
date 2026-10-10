// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Broadcast
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import settings from "../../settings.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  meta: {
    name: "broadcast",
    command: ["broadcast", "bc", "broadcastchannel", "bcch"],
    category: "owner",
    section: "📢 BROADCAST",
    description: "Broadcast pesan ke semua grup/channel",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command, text }) {

    const isChannel = command === "broadcastchannel" || command === "bcch";

    // ── Pesan ──
    const pesan = args.join(" ").trim() || m.quoted?.text || "";

    if (!pesan && !m.quoted) {
      return m.reply(
        `❌ Format salah!\n\n` +
        `*Cara pakai:*\n` +
        `> .${command} <pesan>\n` +
        `> .${command} (reply pesan)\n\n` +
        `Contoh:\n` +
        `> .${command} Halo semua, bot update nih 😹`
      );
    }

    // ── Bangun teks broadcast ──
    const header =
`📢 *BROADCAST*

${pesan}

━━━━━━━━━━━━━━━━━━━━
_Dikirim oleh: Owner_
_${settings.botName} v${settings.version}_`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  BROADCAST CHANNEL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isChannel) {
      try {
        await m.reply("⏳ Mengirim ke channel...");

        await sock.sendMessage(settings.newsletter.id, {
          text: header
        });

        return m.reply(`✅ *Broadcast ke channel berhasil!*\n\n> Channel: ${settings.newsletter.name}`);
      } catch (e) {
        return m.reply(`❌ Gagal broadcast ke channel: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  BROADCAST GRUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      await m.reply("⏳ Mengambil daftar grup...");

      const groups = await sock.groupFetchAllParticipating();
      const ids = Object.keys(groups || {});

      if (!ids.length) {
        return m.reply("❌ Bot nggak ada di grup manapun.");
      }

      await m.reply(
        `📢 *Broadcast dimulai!*\n\n` +
        `> Total grup: *${ids.length}*\n` +
        `> Estimasi: ${ids.length * 1.5}s\n\n` +
        `_Mohon tunggu..._`
      );

      let success = 0;
      let failed = 0;

      for (const id of ids) {
        try {
          await sock.sendMessage(id, { text: header });
          success++;
          console.log(`[BC] ✅ ${id}`);
          await sleep(1500);   // delay anti-spam
        } catch (e) {
          failed++;
          console.error(`[BC] ❌ ${id}: ${e.message}`);
        }
      }

      return m.reply(
        `✅ *Broadcast selesai!*\n\n` +
        `> Sukses : *${success}*\n` +
        `> Gagal  : *${failed}*\n` +
        `> Total  : ${ids.length}`
      );
    } catch (e) {
      return m.reply(`❌ Gagal broadcast: ${e.message}`);
    }
  }
};