// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Owner Profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import settings from "../../settings.js";
import { fakeQuoted } from "../../engine/lib/fake.js";

import {
  generateWAMessageFromContent,
  proto
} from "@whiskeysockets/baileys";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TEXT (bisa diganti-ganti)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TEXT = {
  header: "👑 OWNER PROFILE",
  greeting: "Butuh bantuan? Klik tombol di bawah 👇",
  footer: "Thanks for my teman-teman yang sudah support 🤍💐",

  buttons: {
    chat: "💬 Chat Owner",
    channel: "📢 Channel",
    donasi: "💝 Donasi"
  }
};


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
//  FAKE QUOTED (participant 0@s.whatsapp.net)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getOwnerQuoted(m) {
  const q = fakeQuoted(m?.text || "Owner Profile");
  q.key.participant = "0@s.whatsapp.net";
  return q;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BUILD MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildMessage(m) {
  const profile = settings.ownerProfile || {};
  const ownerNum = settings.owner?.[0] || "-";
  const channel = profile.channel || {};
  const donasi = profile.donasi || {};

  // ── Body text ──
  const bodyText =
`╭───〔 ${TEXT.header} 〕
│ ⛬ Nama    : ${profile.name || "-"}
│ ⛬ Status  : ${profile.status || "-"}
│ ⛬ Channel : ${channel.name || "-"}
╰────────────────

> ${TEXT.greeting}

${TEXT.footer}`;

  // ── URL Tombol ──
  const chatUrl = `https://wa.me/${ownerNum}`;
  const channelUrl = channel.url || `https://wa.me/${ownerNum}`;
  const donasiUrl = donasi.url || `https://wa.me/${ownerNum}`;

  // ── Buttons ──
  const buttons = [
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: TEXT.buttons.chat,
        url: chatUrl,
        merchant_url: chatUrl
      })
    },
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: TEXT.buttons.channel,
        url: channelUrl,
        merchant_url: channelUrl
      })
    },
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: TEXT.buttons.donasi,
        url: donasiUrl,
        merchant_url: donasiUrl
      })
    }
  ];

  // ── Native Flow ──
  const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
    buttons,
    messageParamsJson: ""
  });

  // ── Header ──
  const header = proto.Message.InteractiveMessage.Header.create({
    title: "",
    subtitle: "",
    hasMediaAttachment: false
  });

  // ── Interactive Message ──
  const interactive = proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({ text: bodyText }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: `© ${settings.botName || "Lolpop MD"}`
    }),
    header,
    nativeFlowMessage: nativeFlow,
    contextInfo: {
      mentionedJid: m.sender ? [m.sender] : [],
      forwardingScore: 0,
      isForwarded: false
    }
  });

  return proto.Message.create({ interactiveMessage: interactive });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "owner",
    command: ["owner"],
    category: "owner",
    section: "👑 OWNER INFO",
    description: "Info kontak owner",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m) {
    try {
      const message = buildMessage(m);

      const generated = generateWAMessageFromContent(
        m.chat,
        message,
        {
          quoted: getOwnerQuoted(m),
          userJid: sock.user?.id || sock.user?.jid
        }
      );

      await sock.relayMessage(
        m.chat,
        generated.message,
        {
          messageId: generated.key.id,
          additionalNodes: [BIZ_NODE]
        }
      );

      console.log("[OWNER] Owner profile terkirim.");
    } catch (error) {
      console.error("[OWNER ERROR]", error?.stack || error);

      // Fallback → teks aja
      try {
        await m.reply(
          `👑 *Owner Profile*\n\n` +
          `> Nama   : ${settings.ownerProfile?.name || "-"}\n` +
          `> Status : ${settings.ownerProfile?.status || "-"}\n` +
          `> Nomor  : ${settings.owner?.[0] || "-"}\n\n` +
          `💝 Donasi: ${settings.ownerProfile?.donasi?.url || "-"}`
        );
      } catch (_) {}
    }
  }
};