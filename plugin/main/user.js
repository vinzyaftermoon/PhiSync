// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Main: User
//  .info, .claim, .redeem
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import settings from "../../settings.js";

import {
  getLimit,
  getMaxLimit,
  addLimit
} from "../../engine/lib/limit.js";

import {
  getUserPlan,
  getPlanLevel,
  getPlanRemaining
} from "../../engine/lib/userPlan.js";

import {
  checkClaim,
  doClaim,
  CLAIM_AMOUNT
} from "../../engine/lib/claim.js";

import {
  checkRedeem,
  useRedeem
} from "../../engine/lib/redeem.js";

import {
  isBlacklisted
} from "../../engine/lib/blacklist.js";

import { generateWAMessageFromContent, proto } from "@whiskeysockets/baileys";
import { fakeQuoted } from "../../engine/lib/fake.js";


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

function normalizeJid(jid) {
  if (!jid) return "";
  const clean = String(jid).replace(/[^0-9]/g, "");
  return clean ? `${clean}@s.whatsapp.net` : "";
}

function parseTarget(m, raw) {
  // Reply
  const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) return quoted;

  // Mention
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];

  // Nomor
  if (!raw) return null;
  const clean = String(raw).replace(/[^0-9]/g, "");
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "-";
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const parts = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  return parts.join(" ") || "-";
}

function progressBar(used, max) {
  if (max <= 0) return "▱▱▱▱▱▱▱▱▱▱";
  const percent = Math.min(100, Math.floor((used / max) * 100));
  const full = Math.floor(percent / 10);
  return "▰".repeat(full) + "▱".repeat(10 - full);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BLACKLIST MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendBlacklistMessage(sock, m) {
  const text =
`🚫 *Kamu telah di-hitamkan oleh dev* ☝🏻😹💦

ngapain cill? sok asik lu femboy 😹
Otak dipake dikit kek, jangan cuma buat pajangan 🤡

Sok sibuk lu, padahal mah nggak ada yang cari 😹💦
Udah sono, minta maaf ke dev dulu baru bisa make bot 🤡`;

  const ownerNum = settings.owner?.[0] || "";
  const chatUrl = `https://wa.me/${ownerNum}?text=Minta%20maaf%20dev%2C%20aku%20janji%20nggak%20ngulang%20lagi%20%F0%9F%98%AD`;

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
      mentionedJid: [],
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
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CEK ROLE DI GRUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getRole(sock, m, targetJid) {
  // Owner bot
  const ownerList = (settings.owner || []).map((o) => String(o).replace(/[^0-9]/g, ""));
  const targetNum = String(targetJid).split("@")[0].replace(/[^0-9]/g, "");

  if (ownerList.includes(targetNum)) return "👑 Owner Bot";

  // Cek admin grup
  if (!m.isGroup) return "👤 Member";

  try {
    const meta = await sock.groupMetadata(m.chat);
    const participant = meta.participants.find(
      (p) => normalizeJid(p.id) === normalizeJid(targetJid)
    );

    if (participant?.admin === "superadmin") return "👑 Admin Grup";
    if (participant?.admin === "admin") return "🛡️ Admin Grup";
    return "👤 Member";
  } catch {
    return "👤 Member";
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .info
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleInfo(sock, m, args) {
  const targetRaw = parseTarget(m, args[0]);
  const target = targetRaw || m.sender;
  const targetNum = String(target).split("@")[0];

  // ── Cek kalau user mau cek info owner ──
  const ownerList = (settings.owner || []).map((o) => String(o).replace(/[^0-9]/g, ""));
  const targetClean = targetNum.replace(/[^0-9]/g, "");

  if (ownerList.includes(targetClean) && m.sender !== target) {
    // Pesan ngejek 😹
    const text =
`Apaan cek cek gw cung 😹 mau gw blacklist kah? 
Dasar femboy gatau diri ☝🏻🤓

_Owner mah bukan buat diintip-intip_
_Cari kerja sono, jangan nganggur_ 💦`;

    const ownerChat = `https://wa.me/${targetClean}`;
    const buttons = [
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "📢 Join Channel",
          url: settings.newsletter?.id
            ? `https://whatsapp.com/channel/${String(settings.newsletter.id).replace("@newsletter", "")}`
            : settings.website,
          merchant_url: settings.website
        })
      }
    ];

    const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons,
      messageParamsJson: ""
    });

    const header = proto.Message.InteractiveMessage.Header.create({
      title: settings.newsletter?.name || "Vinzy Nightly Official",
      subtitle: "",
      hasMediaAttachment: false
    });

    const interactive = proto.Message.InteractiveMessage.create({
      body: proto.Message.InteractiveMessage.Body.create({ text }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: `© ${settings.botName}`
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
      m.chat,
      message,
      { quoted: fakeQuoted(m.text), userJid: sock.user?.id || sock.user?.jid }
    );

    return sock.relayMessage(
      m.chat,
      generated.message,
      { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
    );
  }

  // ── Data user ──
  const limit = getLimit(target);
  const plan = getPlanLevel(target);
  const planData = getUserPlan(target);
  const maxPlan = getMaxLimit(plan);
  const role = await getRole(sock, m, target);

  // ── Plan info ──
  let planText = "FREE (default)";
  let statusText = "-";
  let expiredText = "-";

  if (planData) {
    planText = String(planData.plan).toUpperCase();
    statusText = planData.status;
    expiredText = planData.tanggalExpired
      ? new Date(planData.tanggalExpired).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
      : "Permanent";
  }

  // ── Hitung limit ──
  const used = limit.used || 0;
  const max = limit.max || 0;
  const sisa = limit.sisa || 0;
  const saldo = limit.customLimit !== undefined ? (limit.saldo || 0) : 0;

  const text =
`👤 *USER INFO*

╭───〔 📋 PROFILE 〕
│ ⛬ Nama    : ${target === m.sender ? (m.pushName || "Kak") : "-"}
│ ⛬ Nomor   : ${targetNum}
│ ⛬ Plan    : *${planText}*
│ ⛬ Status  : ${statusText}
│ ⛬ Expired : ${expiredText}
│ ⛬ Role    : ${role}
╰────────────────

╭───〔 💠 LIMIT 〕
│ ⛬ Terpakai : ${used}
│ ⛬ Sisa     : *${sisa}*
│ ⛬ Max      : ${max}
╰────────────────

  [ ${progressBar(used, max)} ] ${max > 0 ? Math.floor((used / max) * 100) : 0}%

> _Ketik .claim untuk klaim limit harian_`;

  return m.reply(text);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .claim
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleClaim(sock, m) {
  const claim = checkClaim(m.sender);

  // ── Kalau belum cooldown ──
  if (!claim.canClaim) {
    return m.reply(
      `⏰ *Sabar ya cung!*\n\n` +
      `> Claim terakhir: ${formatDuration(Date.now() - claim.lastClaim)} lalu\n` +
      `> Cooldown: *2 hari*\n` +
      `> Sisa: *${formatDuration(claim.remaining)}*\n\n` +
      `Hehehe 😹`
    );
  }

  // ── Cek limit user ──
  const limit = getLimit(m.sender);

  if ((limit.used || 0) <= 0) {
    return m.reply(
      `😭 *Limit kamu masih penuh!*\n\n` +
      `> Sisa limit: *${limit.sisa}/${limit.max}*\n\n` +
      `Pakai dulu limitnya, baru claim lagi 😹`
    );
  }

  // ── Kurangi used ──
  const amount = Math.min(CLAIM_AMOUNT, limit.used);

  // Update used via limit.js
  const { useLimit } = await import("../../engine/lib/limit.js");
  // useLimit nambah, jadi kita kurangi pakai addLimit
  const { addLimit } = await import("../../engine/lib/limit.js");
  addLimit(m.sender, amount);

  doClaim(m.sender);

  const newLimit = getLimit(m.sender);

  return m.reply(
    `✅ *Claim berhasil!*\n\n` +
    `> Reward : *+${amount} limit*\n` +
    `> Sisa   : *${newLimit.sisa}/${newLimit.max}*\n` +
    `> Next   : 2 hari lagi`
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  .redeem
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleRedeem(sock, m, args) {
  const code = String(args[0] || "").trim();

  if (!code) {
    return m.reply(
      `❌ Format salah!\n\n` +
      `> .redeem <CODE>\n\n` +
      `Contoh: *.redeem PHISYNC10*`
    );
  }

  const check = checkRedeem(code, m.sender);

  if (!check.ok) {
    // ── Pesan ngejek ──
    const reasons = {
      not_found: "Kode nggak ada di database 🤡",
      expired: "Kode udah expired 🤭",
      used: "Kamu udah pernah pakai kode ini 😹",
      invalid_user: "User nggak valid 🤡"
    };

    const reasonText = reasons[check.reason] || "Kode gagal dipakai 😹";

    const text =
`❌ *Kode redeem gagal!*

> ${reasonText}

Coba cek dulu info di channel ya ☝🏻🤓
Masa gitu aja nggak tau 😹💦`;

    const channelUrl = settings.newsletter?.id
      ? `https://whatsapp.com/channel/${String(settings.newsletter.id).replace("@newsletter", "")}`
      : settings.website;

    const buttons = [
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: "📢 Join Channel",
          url: channelUrl,
          merchant_url: channelUrl
        })
      }
    ];

    const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons,
      messageParamsJson: ""
    });

    const header = proto.Message.InteractiveMessage.Header.create({
      title: settings.newsletter?.name || "Vinzy Nightly Official",
      subtitle: "",
      hasMediaAttachment: false
    });

    const interactive = proto.Message.InteractiveMessage.create({
      body: proto.Message.InteractiveMessage.Body.create({ text }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: `© ${settings.botName}`
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
      m.chat,
      message,
      { quoted: fakeQuoted(m.text), userJid: sock.user?.id || sock.user?.jid }
    );

    return sock.relayMessage(
      m.chat,
      generated.message,
      { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
    );
  }

  // ── Kode valid ──
  const entry = check.entry;
  const { getLimit } = await import("../../engine/lib/limit.js");

  // ── Kasih reward ──
  if (entry.reward === "limit") {
    const limit = getLimit(m.sender);
    const currentCustom = limit.customLimit || 0;
    const { setUserLimit } = await import("../../engine/lib/limit.js");
    setUserLimit(m.sender, currentCustom + Number(entry.amount));
  } else if (entry.reward === "saldo") {
    // Update saldo di limitData.json
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dataPath = path.resolve("./database/global/limitData.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8") || "{}");
    if (!data[m.sender]) data[m.sender] = { used: 0, customLimit: null, saldo: 0, lastReset: 0 };
    data[m.sender].saldo = (data[m.sender].saldo || 0) + Number(entry.amount);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  }

  // ── Tandai kode udah dipakai ──
  useRedeem(code, m.sender);

  const usedCount = (entry.usedBy || []).length + 1;
  const sisa = Math.max(0, 10 - usedCount); // asumsi max 10 slot default

  let rewardText = "";
  if (entry.reward === "limit") {
    rewardText = `+${entry.amount} limit`;
  } else {
    rewardText = `+Rp ${Number(entry.amount).toLocaleString("id-ID")}`;
  }

  return m.reply(
    `🎁 *REDEEM BERHASIL!*\n\n` +
    `> Kode   : *${entry.code}*\n` +
    `> Reward : *${rewardText}*\n` +
    `> Sisa   : *${sisa} slot*`
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "user",
    command: ["info", "claim", "redeem"],
    category: "user",
    section: "👤 USER",
    description: "Info user, claim, redeem",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {
    // ── Cek blacklist (safety) ──
    if (isBlacklisted(m.sender) && !m.isOwner) {
      return sendBlacklistMessage(sock, m);
    }

    if (command === "info") {
      return handleInfo(sock, m, args);
    }
    if (command === "claim") {
      return handleClaim(sock, m);
    }
    if (command === "redeem") {
      return handleRedeem(sock, m, args);
    }
  }
};