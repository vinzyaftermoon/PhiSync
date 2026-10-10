// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Main: Donasi
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
  header: "💝 DONASI",
  greeting: "Support bot ini biar terus berkembang 🤍",
  footer: "Thanks for my teman-teman yang sudah support 🤍💐",
  thanks: "Setiap donasi sangat berarti buat owner 😭",
  qrisCaption: "📱 *Scan QRIS ini buat donasi* 🤍",
  buttons: {
    saweria: "💝 Saweria",
    qris: "📱 QRIS"
  }
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DATA DONASI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DATA = {
  saweria: "https://saweria.co/vinzyofficial",
  qrisImage: "https://i.ibb.co.com/JjzH3rFY/Proyek-Baru-884-FC1-C.png",
  wallets: {
    dana: "6282374633884",
    gopay: "6282374633884"
    // ovo: "-"  ← belum ada
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
//  FAKE QUOTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getDonasiQuoted(m) {
  const q = fakeQuoted(m?.text || "Donasi");
  q.key.participant = "0@s.whatsapp.net";
  return q;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BODY TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildBodyText() {
  const w = DATA.wallets || {};

  let walletText = "";
  if (w.dana) walletText += `│ ⛬ DANA  : ${w.dana}\n`;
  if (w.gopay) walletText += `│ ⛬ GoPay : ${w.gopay}\n`;
  if (w.ovo) walletText += `│ ⛬ OVO   : ${w.ovo}\n`;

  return [
    `╭───〔 ${TEXT.header} 〕`,
    `│`,
    `│ ${TEXT.greeting}`,
    `│`,
    `╰────────────────`,
    ``,
    `╭───〔 💰 E-WALLET 〕`,
    walletText.trimEnd(),
    `╰────────────────`,
    ``,
    `╭───〔 💳 SAWERIA 〕`,
    `│ ⛬ ${DATA.saweria}`,
    `╰────────────────`,
    ``,
    `> ${TEXT.thanks}`,
    ``,
    TEXT.footer
  ].join("\n");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BUILD INTERACTIVE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildInteractive(m) {
  const bodyText = buildBodyText();

  const buttons = [
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: TEXT.buttons.saweria,
        url: DATA.saweria,
        merchant_url: DATA.saweria
      })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: TEXT.buttons.qris,
        id: `${m.prefix || "."}qris`
      })
    }
  ];

  const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
    buttons,
    messageParamsJson: ""
  });

  const header = proto.Message.InteractiveMessage.Header.create({
    title: "",
    subtitle: "",
    hasMediaAttachment: false
  });

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
    name: "donasi",
    command: ["donasi", "qris"],
    category: "main",
    section: "💝 DONASI",
    description: "Info donasi & QRIS",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { command }) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .qris → kirim gambar QRIS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "qris") {
      try {
        await sock.sendMessage(
          m.chat,
          {
            image: { url: DATA.qrisImage },
            caption: TEXT.qrisCaption
          },
          { quoted: getDonasiQuoted(m) }
        );

        console.log("[DONASI] QRIS terkirim.");
      } catch (error) {
        console.error("[DONASI QRIS ERROR]", error?.stack || error);
        await m.reply("❌ Gagal kirim QRIS. Coba lagi nanti.");
      }
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .donasi → kirim interactive + tombol
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      const message = buildInteractive(m);

      const generated = generateWAMessageFromContent(
        m.chat,
        message,
        {
          quoted: getDonasiQuoted(m),
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

      console.log("[DONASI] Info donasi terkirim.");
    } catch (error) {
      console.error("[DONASI ERROR]", error?.stack || error);

      // Fallback → teks aja
      try {
        await m.reply(buildBodyText());
      } catch (_) {}
    }
  }
};