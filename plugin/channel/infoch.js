// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Channel: Info Channel
//  .infoch <link>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  generateWAMessageFromContent,
  proto
} from "@whiskeysockets/baileys";
import { fakeQuoted } from "../../engine/lib/fake.js";
import settings from "../../settings.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BIZ NODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BIZ_NODE = {
  tag: "biz",
  attrs: {},
  content: [
    {
      tag: "interactive",
      attrs: { type: "native_flow", v: "1" },
      content: [
        { tag: "native_flow", attrs: { v: "9", name: "mixed" } }
      ]
    }
  ]
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractChannelId(input) {
  if (!input) return null;
  if (input.includes("@newsletter")) return input.trim();
  const match = input.match(/whatsapp\.com\/channel\/([A-Za-z0-9]+)/i);
  if (match) return match[1];
  if (/^[A-Za-z0-9]+$/.test(input)) return input;
  return null;
}

function formatNumber(num) {
  const n = Number(num) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

// ── Ambil field dari 2 format ──
function getField(meta, ...keys) {
  for (const key of keys) {
    const val =
      meta?.[key]?.text ||
      meta?.[key] ||
      meta?.thread_metadata?.[key]?.text ||
      meta?.thread_metadata?.[key];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "infoch",
    command: ["infoch"],
    category: "channel",
    section: "📢 CHANNEL TOOLS",
    description: "Info lengkap channel",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args }) {
    const input = args.join(" ").trim();

    if (!input) {
      return m.reply(
        `❌ *Format salah!*\n\n` +
        `> .infoch <link>\n` +
        `> .infoch <jid>\n\n` +
        `*Contoh:*\n` +
        `> .infoch https://whatsapp.com/channel/xxxxx`
      );
    }

    const id = extractChannelId(input);

    if (!id) {
      return m.reply(
        `😅 *Maaf cung, link-nya nggak valid*\n\n` +
        `_Pastikan format: https://whatsapp.com/channel/xxxxx_`
      );
    }

    try {
      // ── Ambil meta dari 2 sumber ──
      let meta = null;

      // 1. Coba "invite"
      try {
        meta = await sock.newsletterMetadata("invite", id);
      } catch (e) {
        console.log("[INFOCH] invite gagal:", e.message);
      }

      // 2. Coba "jid" (kadang lebih lengkap)
      try {
        const jid = id.includes("@newsletter") ? id : id + "@newsletter";
        const meta2 = await sock.newsletterMetadata("jid", jid);
        if (meta2) {
          meta = {
            ...(meta || {}),
            ...meta2,
            thread_metadata: {
              ...((meta && meta.thread_metadata) || {}),
              ...(meta2.thread_metadata || {})
            }
          };
        }
      } catch (e) {
        console.log("[INFOCH] jid gagal:", e.message);
      }

      // ── DEBUG ──
      console.log("[INFOCH DEBUG] Raw meta:", JSON.stringify(meta, null, 2));

      if (!meta) {
        return m.reply(
          `😅 *Channel-nya nggak ketemu cung*\n\n` +
          `_Coba cek lagi ya_ 🙏`
        );
      }

      // ── Ambil field ──
      const nama = getField(meta, "name") || "-";
      const deskripsi = getField(meta, "description") || "_(nggak ada deskripsi)_";
      const subscriber = getField(meta, "subscriber_count", "subscriberCount", "subscribers") || 0;
      const creationTime = getField(meta, "creation_time", "creationTime") || 0;
      const verifikasi = getField(meta, "verification") || "UNVERIFIED";
      const channelId = meta.id || id;

      // ── Format ──
      const subsNum = Number(subscriber) || 0;
      const subs = subsNum > 0 ? formatNumber(subsNum) : "-";

      const created = creationTime
        ? new Date(Number(creationTime) * 1000).toLocaleDateString("id-ID", {
            timeZone: "Asia/Makassar",
            day: "2-digit",
            month: "long",
            year: "numeric"
          })
        : "-";

      const verified = verifikasi === "VERIFIED" ? "✅ Terverifikasi" : "❌ Belum";
      const link = "https://whatsapp.com/channel/" + String(channelId).replace("@newsletter", "");

      const caption =
`📢 *CHANNEL INFO*

╭───〔 📌 DETAIL 〕
│ ⛬ Nama       : ${nama}
│ ⛬ ID         : ${channelId}
│ ⛬ Subscriber : ${subs}
│ ⛬ Dibuat     : ${created}
│ ⛬ Verifikasi : ${verified}
╰────────────────

╭───〔 📝 DESKRIPSI 〕
│ ${deskripsi}
╰────────────────

╭───〔 🔗 LINK 〕
│ ⛬ ${link}
╰────────────────

_Klik tombol di bawah buat copy ID_ 📋`;

      // ── Button ──
      const buttons = [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Salin ID Channel",
            copy_code: String(channelId)
          })
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "🔗 Buka Channel",
            url: link,
            merchant_url: link
          })
        }
      ];

      const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons,
        messageParamsJson: ""
      });

      const header = proto.Message.InteractiveMessage.Header.create({
        title: settings.botName || "Lolpop MD",
        subtitle: "Channel Info",
        hasMediaAttachment: false
      });

      const interactive = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({ text: caption }),
        footer: proto.Message.InteractiveMessage.Footer.create({
          text: "© " + (settings.botName || "Lolpop MD")
        }),
        header: header,
        nativeFlowMessage: nativeFlow,
        contextInfo: {
          mentionedJid: [m.sender],
          isForwarded: true,
          forwardingScore: 9999,
          forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletter?.id || "0@newsletter",
            newsletterName: settings.newsletter?.name || settings.botName,
            serverMessageId: 127
          }
        }
      });

      const message = proto.Message.create({ interactiveMessage: interactive });

      const generated = generateWAMessageFromContent(
        m.chat,
        message,
        {
          quoted: fakeQuoted(m.text),
          userJid: sock.user?.id || sock.user?.jid
        }
      );

      await sock.relayMessage(
        m.chat,
        generated.message,
        { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
      );

    } catch (e) {
      console.error("[INFOCH] Error:", e.message);
      return m.reply(
        `😅 *Maaf cung, gagal ambil data*\n\n` +
        `> ${e.message}\n\n` +
        `_Coba lagi nanti ya_ 🙏`
      );
    }
  }
};