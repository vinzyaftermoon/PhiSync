// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Event: Group Join
//  Cek grup asing saat bot masuk
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import settings from "../../settings.js";
import { checkSewa } from "../../engine/lib/sewa.js";
import { getSewaSettings } from "../../engine/lib/botSettings.js";
import {
  generateWAMessageFromContent,
  proto
} from "@whiskeysockets/baileys";


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
//  PESAN AUTO-KICK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendKickMessage(sock, idGrup, namaGrup) {
  const ownerNum = settings.owner?.[0] || "";
  const chatUrl = `https://wa.me/${ownerNum}?text=Halo%20owner%2C%20saya%20mau%20sewa%20bot%20untuk%20grup%20saya%20%F0%9F%98%8A`;

  const text =
`😠 *GRUP INI BELUM SEWA BOT!*

> Grup   : ${namaGrup}
> ID     : ${idGrup}
> Status : ❌ Tidak terdaftar

Bot ini cuma buat grup yang udah sewa!
Kalau mau sewa, chat owner:
📱 wa.me/${ownerNum}

Sekarang bot mau keluar dulu 👋
BYE BYE ALL 😹`;

  const buttons = [
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: "💬 Chat Owner",
        url: chatUrl,
        merchant_url: chatUrl
      })
    }
  ];

  const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
    buttons,
    messageParamsJson: ""
  });

  const header = proto.Message.InteractiveMessage.Header.create({
    title: settings.newsletter?.name || settings.botName || "Lolpop MD",
    subtitle: "",
    hasMediaAttachment: false
  });

  const interactive = proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({ text }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: `© ${settings.botName || "Lolpop MD"}`
    }),
    header,
    nativeFlowMessage: nativeFlow,
    contextInfo: {
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
    idGrup,
    message,
    { userJid: sock.user?.id || sock.user?.jid }
  );

  await sock.relayMessage(
    idGrup,
    generated.message,
    { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CEK GRUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleGroup(sock, idGrup) {
  if (!idGrup || !idGrup.endsWith("@g.us")) return;

  const sewaSet = getSewaSettings();

  // ── Cek toggle ──
  if (!sewaSet.enabled) {
    console.log(`[SEWA] ⏸️ Sistem sewa OFF — skip ${idGrup}`);
    return;
  }

  const result = checkSewa(idGrup);

  if (result.allowed) {
    console.log(`[SEWA] ✅ Grup ${idGrup} terdaftar (${result.status})`);
    return;
  }

  if (result.status !== "not_registered") {
    console.log(`[SEWA] ⚠️ Grup ${idGrup} status: ${result.status}`);
    return;
  }

  // ── Cek toggle auto-kick ──
  if (!sewaSet.autoKick) {
    console.log(`[SEWA] ⏸️ Auto-kick OFF — grup ${idGrup} dibiarkan`);
    return;
  }

  // Grup asing → kick
  let namaGrup = "Grup Tidak Dikenal";
  try {
    const meta = await sock.groupMetadata(idGrup);
    namaGrup = meta.subject || namaGrup;
  } catch {}

  console.log(`[SEWA] ❌ Grup asing: ${idGrup} (${namaGrup})`);

  try {
    await sendKickMessage(sock, idGrup, namaGrup);
    console.log(`[SEWA] 📤 Pesan kick terkirim`);
  } catch (e) {
    console.error(`[SEWA] Gagal kirim kick:`, e.message);
  }

  await new Promise((r) => setTimeout(r, 3000));

  try {
    await sock.groupLeave(idGrup);
    console.log(`[SEWA] 👋 Bot keluar dari ${idGrup}`);
  } catch (e) {
    console.error(`[SEWA] Gagal keluar:`, e.message);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "groupJoin",
    category: "server",
    section: "🌐 SERVER",
    description: "Cek grup asing saat bot masuk",
    event: true
  },
  async run() {}
};

export { handleGroup };