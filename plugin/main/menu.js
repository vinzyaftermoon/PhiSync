// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin: Menu
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";

import settings from "../../settings.js";
import { fakeQuoted } from "../../engine/lib/fake.js";

import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} from "@whiskeysockets/baileys";

import {
  getCategories,
  getCommandsByCategory
} from "../../engine/lib/plugins.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CATEGORY META
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORY_META = {
  main:   { label: "Main",   marker: "🏠" },
  user:   { label: "User",   marker: "👤" },
  group:  { label: "Group",  marker: "👥" },
  tools:  { label: "Tools",  marker: "⚔️" },
  channel: { label: "Channel", marker: "📢" },
  owner:  { label: "Owner",  marker: "👑" },
  server: { label: "Server", marker: "⚡" }
};

const CATEGORY_ORDER = ["main", "user", "group", "tools", "channrl", "owner", "server"];

const OWNER_ONLY_CATEGORIES = ["owner"];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NEWSLETTER / CHANNEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SALURAN = {
  name: settings.newsletter?.name || "ᯓ𝐕𝐞𝐱𝐚𝐎𝐧𝐞 ❯",
  id: settings.newsletter?.id || "0@newsletter"
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
//  HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getPrefix(m) {
  return m?.prefix || settings.prefix || ".";
}

function getFakeQuoted(m) {
  return fakeQuoted(m?.text || "Lolpop MD");
}

function getForwardContext(mentions = []) {
  return {
    mentionedJid: mentions,
    forwardedNewsletterMessageInfo: {
      newsletterJid: SALURAN.id,
      newsletterName: SALURAN.name,
      serverMessageId: 127
    }
  };
}

function readFileSafe(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) return fs.readFileSync(filePath);
  } catch {}
  return null;
}

function metaFor(category) {
  const cat = String(category || "other").toLowerCase();
  return CATEGORY_META[cat] || {
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    marker: "📂"
  };
}

function sortedCategories(isOwner = false) {
  const raw = getCategories() || [];
  const cats = [...new Set(raw.map((c) => String(c).toLowerCase()))];

  let filtered = cats.filter((c) => CATEGORY_META[c]);

  if (!isOwner) {
    filtered = filtered.filter((c) => !OWNER_ONLY_CATEGORIES.includes(c));
  }

  return filtered.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

function totalCommandCount(commandsByCategory) {
  return Object.values(commandsByCategory || {}).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );
}

function getUserStatus(m) {
  if (m.isOwner) return "👑 Owner";
  if (m.plan === "vip") return "⭐ VIP";
  if (m.isPremium) return "💎 Premium";
  return "🆓 Free";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BODY TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function bodyText({
  botName, developer, version, mode, prefix, pushName, sender, totalCommands, userStatus
}) {
  const number = String(sender || "").split("@")[0] || "-";
  const botMode = mode === "self" ? "Self 🔒" : "Public 🔓";

  return [
    `hello welcome to use our bot script please use it wisely and responsibly and don't misuse it thank you *${pushName || "Kak"}*`,

    "",

    `「 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐒𝐈 𝐁𝐎𝐓 」`,

    "",

    `> ⛬ *BotName*   : ${botName}`,
    `> ⛬ *Version*   : ${version}`,
    `> ⛬ *Developer* : ${developer}`,
    `> ⛬ *Owner*     : ${settings.owner[0]}`,
    `> ⛬ *Mode*      : ${botMode}`,
    `> ⛬ *Total*     : ${totalCommands} command`,

    "",

    `「 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐒𝐈 𝐔𝐒𝐄𝐑 」`,

    "",

    `> ⛬ *Nama*  : ${pushName || "Kak"}`,
    `> ⛬ *Nomor* : @${number}`,
    `> ⛬ *Status*: ${userStatus}`,

    "",

    `_Thanks for my teman-teman yang sudah support🤍💐_`
  ].join("\n");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BUILD ROWS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildRows(prefix, categories, commandsByCategory) {
  const rows = [];

  for (const cat of categories) {
    const meta = metaFor(cat);
    const list = Array.isArray(commandsByCategory?.[cat]) ? commandsByCategory[cat] : [];

    rows.push({
      header: "",
      title: `${meta.marker} ${meta.label}`,
      description: `${list.length} command`,
      id: `${prefix}menu ${cat}`
    });
  }

  rows.push({
    header: "",
    title: "📋 All Menu",
    description: "Semua command sekaligus",
    id: `${prefix}allmenu`
  });

  return rows;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SEND AUDIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMenuAudio(sock, m) {
  try {
    const configured = settings.media?.menu?.audio || "./assets/menu/menu.mp3";
    if (!configured || !fs.existsSync(configured)) return;

    const ext = String(configured).toLowerCase().split(".").pop();
    let mimetype = "audio/mpeg";
    if (ext === "ogg" || ext === "opus") mimetype = "audio/ogg; codecs=opus";
    if (ext === "m4a") mimetype = "audio/mp4";

    await sock.sendMessage(
      m.chat,
      { audio: { url: configured }, mimetype, ptt: false },
      { quoted: getFakeQuoted(m) }
    );
  } catch (error) {
    console.error("[MENU AUDIO ERROR]", error?.stack || error);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BUILD VIDEO HEADER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function buildVideoHeader(sock) {
  const videoPath = settings.media?.menu?.video || "./assets/menu/menu.mp4";
  const thumbPath = settings.media?.menu?.thumb || "./assets/menu/menu-thumb.jpg";

  const video = readFileSafe(videoPath);
  if (!video) return null;

  const jpegThumbnail = readFileSafe(thumbPath) || undefined;

  const media = await prepareWAMessageMedia(
    { video, jpegThumbnail, gifPlayback: true },
    { upload: sock.waUploadToServer }
  );

  if (media.videoMessage) media.videoMessage.gifPlayback = true;
  return media.videoMessage || null;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LIMITED TIME OFFER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildLimitedTimeOffer() {
  const expiresAt = Math.floor(new Date("2026-07-23").getTime() / 1000);
  return {
    limited_time_offer: {
      text: "Lolpo MD",
      url: "",
      copy_code: settings.author || "LolpopMD",
      expiration_time: expiresAt * 1000000
    }
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RELAY INTERACTIVE MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function relayInteractiveMenu(sock, m, { text, rows, prefix, videoMessage }) {
  const singleSelect = {
    name: "single_select",
    buttonParamsJson: JSON.stringify({
      title: "☰ Pilih Kategori",
      sections: [
        {
          title: settings.botName || "Lolpop MD",
          highlight_label: "MENU",
          rows
        }
      ]
    })
  };

  const ownerButton = {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "👨‍💻 Owner",
      id: `${prefix}owner`
    })
  };

  const messageParams = buildLimitedTimeOffer();

  const nativeFlow = proto.Message.InteractiveMessage.NativeFlowMessage.create({
    buttons: [singleSelect, ownerButton],
    messageParamsJson: JSON.stringify(messageParams)
  });

  const header = proto.Message.InteractiveMessage.Header.create({
    title: SALURAN.name,
    subtitle: "Menu Utama",
    hasMediaAttachment: !!videoMessage,
    ...(videoMessage ? { videoMessage } : {})
  });

  const interactive = proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({ text }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: `© ${settings.botName || "Lolpop MD"}`
    }),
    header,
    nativeFlowMessage: nativeFlow,
    contextInfo: getForwardContext(m.sender ? [m.sender] : [])
  });

  const message = proto.Message.create({ interactiveMessage: interactive });

  const generated = generateWAMessageFromContent(
    m.chat,
    message,
    { quoted: getFakeQuoted(m), userJid: sock.user?.id || sock.user?.jid }
  );

  await sock.relayMessage(
    m.chat,
    generated.message,
    { messageId: generated.key.id, additionalNodes: [BIZ_NODE] }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SEND NATIVE FLOW MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendTagCard(sock, m, { text, prefix, categories, commandsByCategory }) {
  const rows = buildRows(prefix, categories, commandsByCategory);

  let videoMessage = null;
  try {
    videoMessage = await buildVideoHeader(sock);
  } catch (error) {
    console.error("[MENU VIDEO ERROR]", error?.stack || error);
  }

  try {
    await relayInteractiveMenu(sock, m, { text, rows, prefix, videoMessage });
  } catch (error) {
    if (!videoMessage) throw error;
    console.error("[MENU] Gagal dengan video, coba tanpa video:", error?.stack || error);
    await relayInteractiveMenu(sock, m, { text, rows, prefix, videoMessage: null });
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CATEGORY MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendCategoryMenu(m, categoryInput) {
  const prefix = getPrefix(m);
  const requested = String(categoryInput || "").toLowerCase().trim();
  const commandsByCategory = getCommandsByCategory() || {};
  const available = sortedCategories(m.isOwner);

  if (!CATEGORY_META[requested]) {
    const list = available.map((c) => `${metaFor(c).marker} ${prefix}menu ${c}`).join("\n");
    return m.reply(`❌ Kategori *${categoryInput}* tidak ditemukan.\n\n${list}`);
  }

  if (OWNER_ONLY_CATEGORIES.includes(requested) && !m.isOwner) {
    return m.reply("❌ Kategori ini khusus owner.");
  }

  // ── Kategori TOOLS — cek akses ──
  if (requested === "tools") {
    const isVip = m.plan === "vip";
    const isPremium = ["premium", "vip"].includes(m.plan);

    if (!m.isOwner && !isPremium) {
      return m.reply(
        `⚔️ *TOOLS*\n\n` +
        `Kategori ini cuma buat *VIP* & *Premium*.\n\n` +
        `> Plan kamu: *${String(m.plan).toUpperCase()}*\n\n` +
        `Upgrade dulu sono 😹`
      );
    }

    if (!m.isOwner && !isVip) {
      m.reply(
        `⚔️ *TOOLS*\n\n` +
        `Kamu user *Premium*, jadi tiap command di sini kena *-10 limit*.\n\n` +
        `_VIP mah gratis, upgrade dulu sono_ 😹`
      );
    }
  }

  const meta = metaFor(requested);
  const commands = Array.isArray(commandsByCategory[requested]) ? commandsByCategory[requested] : [];

  const visibleCommands = commands.filter((c) => !(c.isOwner && !m.isOwner));

  const grouped = {};
  for (const cmd of visibleCommands) {
    const sec = cmd.section || "📂 LAINNYA";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(cmd);
  }

  let text = `「 ${meta.marker} MENU — ${meta.label.toUpperCase()} 」\n\n`;

  for (const [section, cmds] of Object.entries(grouped)) {
    text += `╭───〔 ${section} 〕\n`;
    for (const cmd of cmds) {
      text += `│ ⛬ ${prefix}${cmd.name}\n`;
    }
    text += `╰────────────────\n\n`;
  }

  if (!visibleCommands.length) {
    text += `> (belum ada command)\n\n`;
  }

  if (requested === "owner") {
    text += `> 👑 Owner Control Panel\n`;
    text += `> Owner only • Global management\n\n`;
  }

  text += `Thanks for my teman-teman yang sudah support 🤍💐`;

  return m.reply(text);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "menu",
    command: ["menu", "help"],
    category: "main",
    section: "🏠 MAIN",
    description: "Tampilkan daftar command",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args }) {
    const prefix = getPrefix(m);

    if (args && args.length) {
      return sendCategoryMenu(m, args.join(" "));
    }

    const botName = settings.botName || "Lolpop MD";
    const developer = settings.author || "-";
    const version = settings.version || "-";
    const mode = settings.selfMode ? "self" : "public";

    const categories = sortedCategories(m.isOwner);
    const commandsByCategory = getCommandsByCategory() || {};
    const totalCommands = totalCommandCount(commandsByCategory);

    const userStatus = getUserStatus(m);

    const text = bodyText({
      botName, developer, version, mode, prefix,
      pushName: m.pushName,
      sender: m.sender,
      totalCommands,
      userStatus
    });

    try {
      await sendTagCard(sock, m, { text, prefix, categories, commandsByCategory });
      console.log("[MENU] Interactive menu terkirim.");
    } catch (error) {
      console.error("[MENU ERROR]", error?.stack || error);
      try {
        await m.reply(text);
      } catch (replyError) {
        console.error("[MENU FALLBACK ERROR]", replyError?.stack || replyError);
      }
      return;
    }

    await sendMenuAudio(sock, m);
  }
};