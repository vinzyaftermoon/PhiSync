// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Loader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ui from "../../visualUi.js";
import settings from "../../settings.js";
import {
  readSettings,
  checkAutoReset,
  isLimitEnough,
  useLimit,
  getLimit
} from "./limit.js";


const plugins = new Map();
const eventPlugins = [];
let loaded = false;


function scanDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      files.push(...scanDir(full));
    } else if (item.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}


export async function loadPlugins(dir = "./plugin") {
  if (loaded) return;
  loaded = true;

  const files = scanDir(dir);
  let count = 0;

  for (const file of files) {
    try {
      const url = pathToFileURL(path.resolve(file)).href;
      const mod = await import(url);
      const plugin = mod.default;

      if (!plugin) continue;

      if (plugin.meta?.command?.length) {
        for (const cmd of plugin.meta.command) {
          plugins.set(cmd.toLowerCase(), plugin);
        }
        count++;
        console.log(`✅ Loaded: ${path.basename(file)} → [${plugin.meta.command.join(", ")}]`);
        continue;
      }

      if (typeof plugin.run === "function") {
        eventPlugins.push(plugin);
        count++;
        console.log(`✅ Loaded (event): ${path.basename(file)}`);
      }

    } catch (e) {
      console.log(`❌ Gagal load: ${path.basename(file)} — ${e.message}`);
    }
  }

  console.log(`\n📦 Total plugin: ${count} file | ${plugins.size} command | ${eventPlugins.length} event\n`);
}


function hasAccess(plugin, m) {
  const meta = plugin.meta || {};

  if (meta.owner && !m.isOwner) {
    m.reply(settings.messages?.ownerOnly || "❌ Fitur ini khusus owner.");
    return false;
  }
  if (meta.vip && !m.isOwner && !m.isVip) {
    // vip:true → VIP full access; Premium boleh kalau ada premiumLimit; selain itu ditolak
    const allowPremium = meta.premiumLimit && Number(meta.premiumLimit) > 0;
    if (!(allowPremium && m.isPremium)) {
      m.reply("❌ Fitur ini khusus *VIP*" + (allowPremium ? " / *Premium*" : "") + ".");
      return false;
    }
  }
  if (meta.premium && !m.isOwner && !m.isPremium) {
    m.reply(settings.messages?.premiumOnly || "❌ Fitur ini khusus premium.");
    return false;
  }
  if (meta.group && !m.isGroup) {
    m.reply(settings.messages?.groupOnly || "❌ Fitur ini hanya untuk grup.");
    return false;
  }
  if (meta.private && m.isGroup) {
    m.reply(settings.messages?.privateOnly || "❌ Fitur ini hanya untuk private chat.");
    return false;
  }
  if (meta.admin && m.isGroup && !m.isOwner && !m.isAdmin) {
    m.reply("❌ Fitur ini khusus *admin grup*.");
    return false;
  }
  if (meta.botAdmin && m.isGroup && !m.isBotAdmin) {
    m.reply("❌ Bot harus jadi *admin* di grup ini dulu.");
    return false;
  }

  return true;
}


async function checkLimit(plugin, m) {
  const meta = plugin.meta || {};
  if (m.isOwner) return true;

  // Tentukan amount:
  // - meta.limit biasa
  // - meta.premiumLimit: VIP gratis, Premium kena amount itu, free/basic diblok di hasAccess kalau vip:true
  let amount = 0;
  if (meta.premiumLimit && Number(meta.premiumLimit) > 0) {
    if (m.isVip) {
      amount = 0; // VIP gratis
    } else if (m.isPremium) {
      amount = Number(meta.premiumLimit);
    } else {
      // free/basic — hasAccess seharusnya sudah blok kalau vip:true
      amount = Number(meta.premiumLimit);
    }
  } else if (meta.limit && Number(meta.limit) > 0) {
    amount = Number(meta.limit);
  }

  if (!amount || amount <= 0) return true;

  const s = readSettings();
  if (!s.enabled) return true;

  checkAutoReset();

  const plan = m.plan || "free";

  if (!isLimitEnough(m.sender, amount, plan)) {
    const { sisa, max } = getLimit(m.sender, plan);
    m.reply(
      `❌ *Limit kamu habis!*\n\n` +
      `📊 Sisa limit: *${sisa}/${max}*\n` +
      `⏰ Reset: jam 00:00 WITA\n\n` +
      `Mau unlimited? Upgrade ke *VIP* 😉`
    );
    return false;
  }

  useLimit(m.sender, amount);
  return true;
}


async function runCommand(sock, m) {
  const plugin = plugins.get(m.command);
  if (!plugin) return;

  if (!hasAccess(plugin, m)) return;

  const limitOk = await checkLimit(plugin, m);
  if (!limitOk) return;

  try {
    await plugin.run(sock, m, {
      args: m.args,
      text: m.q,
      command: m.command,
      prefix: m.prefix,
      plugins
    });
    console.log(`✅ Plugin "${m.command}" selesai`);
  } catch (e) {
    console.log(`❌ Plugin "${m.command}" error: ${e.message}`);
    m.reply(`❌ Terjadi error: ${e.message}`);
  }
}


async function runEvents(sock, m, chatUpdate, store) {
  for (const plugin of eventPlugins) {
    try {
      await plugin.run(sock, m, { chatUpdate, store });
    } catch (e) {
      console.log(`❌ Event plugin error: ${e.message}`);
    }
  }
}


export default async function pluginLoader(sock, m, chatUpdate, store) {
  if (!loaded) await loadPlugins();

  await runEvents(sock, m, chatUpdate, store);

  if (m.isCmd && m.command) {
    await runCommand(sock, m);
  }
}

export { plugins, eventPlugins };