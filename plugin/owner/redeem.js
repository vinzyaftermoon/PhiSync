// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Redeem Manager
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  createCode,
  deleteCode,
  listCodes,
  parseDuration
} from "../../engine/lib/redeem.js";

export default {
  meta: {
    name: "redeemManager",
    command: ["credeem", "delredeem", "listredeem"],
    category: "owner",
    section: "🎁 REDEEM",
    description: "Manage kode redeem",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {

    // ━━━ .credeem ━━━
    if (command === "credeem") {
      const raw = args.join(" ");
      if (!raw) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `*Cara pakai:*\n` +
          `> .credeem CODE|REWARD|AMOUNT|TIME\n\n` +
          `*Reward:* limit, saldo\n` +
          `*Time:* 1h, 12h, 1d, 30d, atau - (permanent)\n\n` +
          `*Contoh:*\n` +
          `> .credeem PHISYNC10|limit|50|2d\n` +
          `> .credeem SALDO5K|saldo|5000|1d\n` +
          `> .credeem PERMANENT|limit|100|-`
        );
      }

      const parts = raw.split("|").map((s) => s.trim());

      if (parts.length !== 4) {
        return m.reply(
          `❌ Format salah! Harus 4 bagian dipisah *|*\n\n` +
          `> .credeem CODE|REWARD|AMOUNT|TIME`
        );
      }

      const [code, reward, amount, time] = parts;

      const result = createCode({
        code,
        reward,
        amount,
        time,
        createdBy: m.sender
      });

      if (result?.error) {
        const errMsg = {
          duplicate: `❌ Kode *${code}* udah ada!`,
          invalid_reward: `❌ Reward *${reward}* nggak valid! Pilih: limit / saldo`,
          invalid_amount: `❌ Amount *${amount}* nggak valid!`,
          invalid_time: `❌ Time *${time}* nggak valid! Contoh: 1h, 1d, 30d, atau -`
        };
        return m.reply(errMsg[result.error] || "❌ Gagal bikin kode.");
      }

      const expText = result.expired
        ? new Date(result.expired).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
        : "Permanent";

      return m.reply(
        `✅ *Kode redeem dibuat!*\n\n` +
        `> Code    : *${result.code}*\n` +
        `> Reward  : *${result.reward}*\n` +
        `> Amount  : *${result.amount}*\n` +
        `> Time    : *${result.time}*\n` +
        `> Expired : ${expText}`
      );
    }

    // ━━━ .delredeem ━━━
    if (command === "delredeem") {
      const code = String(args[0] || "").trim();

      if (!code) {
        return m.reply(
          `❌ Format salah!\n\n> .delredeem <CODE>\n\nContoh: .delredeem PHISYNC10`
        );
      }

      const ok = deleteCode(code);

      if (!ok) {
        return m.reply(`❌ Kode *${code}* nggak ditemukan.`);
      }

      return m.reply(`✅ Kode *${code.toUpperCase()}* berhasil dihapus.`);
    }

    // ━━━ .listredeem ━━━
    if (command === "listredeem") {
      const codes = listCodes();

      if (!codes.length) {
        return m.reply(`📋 *Belum ada kode redeem.*`);
      }

      let text = `🎁 *LIST REDEEM CODES*\n\n`;

      for (const c of codes) {
        const usedCount = (c.usedBy || []).length;
        const expText = c.expired
          ? new Date(c.expired).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
          : "Permanent";

        text +=
          `╭───〔 ${c.code} 〕\n` +
          `│ ⛬ Reward  : ${c.reward} (${c.amount})\n` +
          `│ ⛬ Time    : ${c.time}\n` +
          `│ ⛬ Expired : ${expText}\n` +
          `│ ⛬ Used    : ${usedCount}x\n` +
          `╰────────────────\n\n`;
      }

      return m.reply(text);
    }
  }
};