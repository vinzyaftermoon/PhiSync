// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Channel: Cek ID Channel
//  .cekidch <link>
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "cekidch",
    command: ["cekidch"],
    category: "channel",
    section: "📢 CHANNEL TOOLS",
    description: "Cek ID channel dari link",
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
        `> .cekidch <link>\n` +
        `> .cekidch <jid>`
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
      const meta = await sock.newsletterMetadata("invite", id);

      // ── DEBUG ──
      console.log("[CEKIDCH DEBUG] Raw meta:", JSON.stringify(meta, null, 2));

      if (!meta) {
        return m.reply(
          `😅 *Channel-nya nggak ketemu cung*\n\n` +
          `_Coba cek lagi ya_ 🙏`
        );
      }

      // ── Handle 2 format response ──
      const thread = meta.thread_metadata || meta;
      const nama = thread.name?.text || thread.name || "-";
      const channelId = meta.id || id;

      const caption =
`📢 *CHANNEL ID*

╭───〔 📌 DETAIL 〕
│ ⛬ Nama : ${nama}
│ ⛬ ID   : ${channelId}
╰────────────────

_Klik tombol di bawah buat copy ID_ 📋`;

      // ── Button Salin ID ──
      const buttons = [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Salin ID Channel",
            copy_code: String(channelId)
          })
        }
      ];

      const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons,
        messageParamsJson: ""
      });

      const header = proto.Message.InteractiveMessage.Header.create({
        title: settings.botName || "Lolpop MD",
        subtitle: "Channel ID",
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
      console.error("[CEKIDCH] Error:", e.message);
      return m.reply(
        `😅 *Maaf cung, gagal ambil data*\n\n` +
        `> ${e.message}\n\n` +
        `_Coba lagi nanti ya_ 🙏`
      );
    }
  }
};