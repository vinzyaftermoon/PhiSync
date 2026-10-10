// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Message Upsert
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  jidNormalizedUser,
  jidDecode,
  getContentType,
  generateWAMessageFromContent,
  proto
} from "@whiskeysockets/baileys";

import settings from "../../settings.js";
import ui from "../../visualUi.js";
import { fakeQuoted } from "./fake.js";
import pluginLoader from "./pluginLoader.js";
import { checkExpired, getPlanLevel, isPlanActive } from "./userPlan.js";
import { isBlacklisted, isGroupBlacklisted, getGroupBlacklist } from "./blacklist.js";
import { isMemberBlacklisted } from "./blacklistMember.js";
import { isMaintenance, getMaintenance } from "./botSettings.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LID → NUMBER MAP (manual)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LID_MAP = {
  "7040139301017": "6282374633884"
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
//  HELPER: Ambil nomor dari JID / LID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractNumber(jid) {
  if (!jid) return "";

  const str = String(jid);

  // Prioritas 1: nomor asli (bukan LID)
  if (str.includes("@s.whatsapp.net") && !str.includes("@lid")) {
    const num = str.split("@")[0].split(":")[0];
    const clean = num.replace(/[^0-9]/g, "");
    if (clean.length >= 10 && clean.length <= 15) return clean;
  }

  // Prioritas 2: jidDecode
  const decoded = jidDecode(jid);
  let num = decoded?.user || "";

  // Prioritas 3: dari string mentah
  if (!num || num.length > 15) {
    num = str.split("@")[0].split(":")[0];
  }

  const clean = num.replace(/[^0-9]/g, "");

  // Kalau LID (panjang > 15), return kosong
  if (clean.length > 15) return "";

  return clean;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LID → NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function lidToNumber(sock, lid) {
  if (!lid) return null;

  const lidNum = String(lid).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");

  // Cek map manual dulu
  if (LID_MAP[lidNum]) {
    return LID_MAP[lidNum];
  }

  // Coba lookup via onWhatsApp
  try {
    const result = await sock.onWhatsApp(lid);
    if (result?.[0]?.jid) {
      const num = result[0].jid.split("@")[0].split(":")[0];
      if (num && num.length <= 15) {
        console.log("[LID] Lookup berhasil:", lidNum, "→", num);
        return num;
      }
    }
  } catch (e) {
    console.log("[LID] Lookup gagal:", e.message);
  }

  return null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BLACKLIST USER MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendBlacklistUser(sock, chat, m) {
  const ownerNum = settings.owner?.[0] || "";
  const chatUrl = "https://wa.me/" + ownerNum + "?text=Minta%20maaf%20dev%2C%20aku%20janji%20nggak%20ngulang%20lagi%20%F0%9F%98%AD";

  const text =
"🚫 *Kamu telah di-hitamkan oleh dev* ☝🏻😹💦\n\n" +
"ngapain cill? sok asik lu femboy 😹\n" +
"Otak dipake dikit kek, jangan cuma buat pajangan 🤡\n\n" +
"Sok sibuk lu, padahal mah nggak ada yang cari 😹💦\n" +
"Udah sono, minta maaf ke dev dulu baru bisa make bot 🤡\n\n" +
"_Mau nangis? Sana nangis, bot mah nggak peduli_ 😹";

  const buttons = [
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: "🙏 Minta Maaf",
        url: chatUrl,
        merchant_url: chatUrl
      })
    }
  ];

  const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
    buttons: buttons,
    messageParamsJson: ""
  });

  const header = proto.Message.InteractiveMessage.Header.create({
    title: settings.newsletter?.name || settings.botName || "Lolpop MD",
    subtitle: "",
    hasMediaAttachment: false
  });

  const interactive = proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({ text: text }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: "© " + (settings.botName || "Lolpop MD")
    }),
    header: header,
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
    chat,
    message,
    { quoted: fakeQuoted(m?.text || ""), userJid: sock.user?.id || sock.user?.jid }
  );

  await sock.relayMessage(
    chat,
    generated.message,
    { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BLACKLIST GROUP MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendBlacklistGroup(sock, chat, m, groupMeta) {
  const info = getGroupBlacklist(chat) || {};
  const ownerNum = settings.owner?.[0] || "";
  const chatUrl = "https://wa.me/" + ownerNum + "?text=Minta%20maaf%20dev%2C%20grup%20kami%20janji%20nggak%20ngulang%20lagi%20%F0%9F%98%AD";
  const groupName = groupMeta?.subject || info.name || "Grup Tidak Dikenal";

  const text =
"🚫 ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ᴋᴇ ʙʟᴀᴄᴋʟɪsᴛ\n\n" +
"> 👤 ɴᴀᴍᴀ : " + groupName + "\n" +
"> 🤩 ᴛɪᴘᴇ : 👥 ɢʀᴜᴘ\n" +
"> 🆔 ɪᴅ   : " + chat + "\n\n" +
"Yaelah grup receh kek gini sok asik 😹\n" +
"Udah kayak grup sultan, padahal isinya bocil kicik 🤡\n\n" +
"Grup lu mah nggak ada yang cari, sono bubar aja 😹💦\n" +
"Kalau mau balik, minta maaf ke dev dulu 🤡☝🏻";

  const buttons = [
    {
      name: "cta_url",
      buttonParamsJson: JSON.stringify({
        display_text: "🙏 Minta Maaf",
        url: chatUrl,
        merchant_url: chatUrl
      })
    }
  ];

  const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
    buttons: buttons,
    messageParamsJson: ""
  });

  const header = proto.Message.InteractiveMessage.Header.create({
    title: settings.newsletter?.name || settings.botName || "Lolpop MD",
    subtitle: "",
    hasMediaAttachment: false
  });

  const interactive = proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({ text: text }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: "© " + (settings.botName || "Lolpop MD")
    }),
    header: header,
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
    chat,
    message,
    { quoted: fakeQuoted(m?.text || ""), userJid: sock.user?.id || sock.user?.jid }
  );

  await sock.relayMessage(
    chat,
    generated.message,
    { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default async function messageUpsert(sock, chatUpdate, store) {
  try {
    const msg = chatUpdate.messages?.[0];
    if (!msg || !msg.message) return;
    if (msg.key?.remoteJid === "status@broadcast") return;

    const type = getContentType(msg.message);

    const m = {
      key: msg.key,
      message: msg.message,
      type: type,
      msg: msg.message[type],
      pushName: msg.pushName || "",
      chat: msg.key.remoteJid,
      fromMe: msg.key.fromMe,
      isGroup: msg.key.remoteJid?.endsWith("@g.us"),
      isCh: msg.key.remoteJid?.endsWith("@newsletter")
    };

    // ── Bot number ──
    m.botNumber = extractNumber(sock.user?.id);

    // ── Sender JID ──
    if (m.fromMe) {
      m.sender = m.botNumber + "@s.whatsapp.net";
      m.senderNumber = m.botNumber;
    } else {
      // Ambil JID dari berbagai field
      const rawJid = msg.key.participantPn || msg.key.participant || msg.key.senderPn || m.chat;
      m.sender = jidNormalizedUser(rawJid);

      // ── Cek LID Map dulu ──
      const rawNum = String(m.sender).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
      if (LID_MAP[rawNum]) {
        m.senderNumber = LID_MAP[rawNum];
        m.sender = m.senderNumber + "@s.whatsapp.net";
      } else {
        m.senderNumber = extractNumber(m.sender);

        // Kalau LID, coba lookup
        if (!m.senderNumber || m.senderNumber.length > 15) {
          const num = await lidToNumber(sock, m.sender);
          if (num) {
            m.senderNumber = num;
            m.sender = num + "@s.whatsapp.net";
          }
        }
      }
    }

    // ── Fallback terakhir ──
    if (!m.senderNumber || m.senderNumber.length > 15) {
      m.senderNumber = m.botNumber;
      m.sender = m.botNumber + "@s.whatsapp.net";
    }

    // ── Cek owner ──
    const ownerList = (settings.owner || []).map((o) => String(o).replace(/[^0-9]/g, ""));
    const senderClean = String(m.senderNumber || "").replace(/[^0-9]/g, "");

    m.isOwner = ownerList.includes(senderClean);
    m.owner = settings.owner;

    // ── Auto cek expired plan ──
    checkExpired();

    // ── Plan & premium ──
    if (m.isOwner) {
      m.plan = "vip";
      m.isPremium = true;
    } else {
      m.plan = getPlanLevel(m.senderNumber);
      m.isPremium = ["premium", "vip"].includes(m.plan) && isPlanActive(m.senderNumber);
    }

    // ── DEBUG ──
    console.log("[DEBUG] sender       :", m.sender);
    console.log("[DEBUG] senderNumber :", JSON.stringify(m.senderNumber));
    console.log("[DEBUG] botNumber    :", m.botNumber);
    console.log("[DEBUG] isOwner      :", m.isOwner);

    // ━━━ BLACKLIST USER ━━━
    if (!m.isOwner && isBlacklisted(m.sender)) {
      await sendBlacklistUser(sock, m.chat, m);
      return;
    }

    // ━━━ BLACKLIST GROUP ━━━
    if (m.isGroup && !m.isOwner && isGroupBlacklisted(m.chat)) {
      let groupMeta = null;
      try { groupMeta = await sock.groupMetadata(m.chat); } catch (e) {}
      await sendBlacklistGroup(sock, m.chat, m, groupMeta);
      return;
    }

    // ── Serialize body ──
    let body = "";
    switch (type) {
      case "conversation": body = m.message.conversation || ""; break;
      case "imageMessage": body = m.message.imageMessage?.caption || ""; break;
      case "videoMessage": body = m.message.videoMessage?.caption || ""; break;
      case "extendedTextMessage": body = m.message.extendedTextMessage?.text || ""; break;
      case "buttonsResponseMessage": body = m.message.buttonsResponseMessage?.selectedButtonId || ""; break;
      case "listResponseMessage": body = m.message.listResponseMessage?.singleSelectReply?.selectedRowId || ""; break;
      case "templateButtonReplyMessage": body = m.message.templateButtonReplyMessage?.selectedId || ""; break;
      default: {
        const nf = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage;
        if (nf) {
          try {
            const json = JSON.parse(nf.paramsJson || "{}");
            body = json.id || json.rowId || json.selectedButtonId || "";
          } catch (e) {}
        }
      }
    }

    m.text = body;
    m.body = body;

    m.prefix = settings.prefix;
    m.isCmd = body.startsWith(m.prefix);
    m.command = m.isCmd ? body.slice(m.prefix.length).trim().split(/ +/)[0].toLowerCase() : "";
    m.args = body.trim().split(/ +/).slice(1);
    m.q = m.args.join(" ");

    m.reply = async (text) => sock.sendMessage(m.chat, { text: text }, { quoted: fakeQuoted(m.text) });

    if (settings.logMessage) ui.message(m.senderNumber, body, type);

    // ━━━ BLACKLIST MEMBER (per grup) ━━━
    if (m.isGroup && !m.isOwner && isMemberBlacklisted(m.chat, m.sender)) {
      if (m.isCmd) {
        try {
          await sock.sendMessage(m.chat, {
            text: "*lu di hitamin dongo makanya jangan sosik 😹💩*"
          }, { quoted: fakeQuoted(m.text) });
          try { await sock.sendMessage(m.chat, { delete: m.key }); } catch (e) {}
        } catch (e) {
          console.error("[BL-MEMBER]", e.message);
        }
      }
      return;
    }

    // ━━━ MAINTENANCE ━━━
    if (isMaintenance() && !m.isOwner && m.isCmd) {
      const mt = getMaintenance();
      await sock.sendMessage(m.chat, {
        text: mt.message
      }, { quoted: fakeQuoted(m.text) });
      return;
    }

    // ━━━ FORWARD KE PLUGIN LOADER ━━━
    await pluginLoader(sock, m, chatUpdate, store);

  } catch (e) {
    ui.error("message.upsert: " + e.message);
  }
}