// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Entry Point
//  Author : Vinzy Nightly
//  Version: 1.0
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import readline from "readline";
import fs from "fs";
import chalk from "chalk";

import settings from "./settings.js";
import ui from "./visualUi.js";
import messageUpsert from "./engine/lib/message.upsert.js";
import pluginLoader, { loadPlugins } from "./engine/lib/pluginLoader.js";
import { handleGroup } from "./plugin/event/groupJoin.js";
import { checkSewaExpired } from "./engine/lib/sewa.js";
import { checkExpired } from "./engine/lib/userPlan.js";


// ── Prompt console ──
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise((res) => rl.question(q, res));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BOOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function start() {
  ui.banner();

  // Pastikan folder session ada
  if (!fs.existsSync(settings.sessionDir)) {
    fs.mkdirSync(settings.sessionDir, { recursive: true });
    ui.info("Folder session dibuat.");
  }

  // Auth state
  const { state, saveCreds } = await useMultiFileAuthState(settings.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  // Cek apakah sudah pernah login
  const isRegistered = fs.existsSync(`${settings.sessionDir}/creds.json`);

  // Kalau belum login → tanya nomor
  if (!isRegistered) {
    ui.info("Session belum ada. Masukkan nomor bot untuk pairing.");
    const nomor = await ask(chalk.cyan("  Masukkan nomor bot (628xxx): "));
    settings.pairingNumber = nomor.trim().replace(/[^0-9]/g, "");
    rl.close();
  }

  // Buat socket
  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PAIRING CODE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!isRegistered && settings.pairingNumber) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(settings.pairingNumber);
        const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
        ui.pairing(formatted);
        ui.info("Buka WhatsApp → Perangkat Tertaut → Tautkan dengan nomor.");
      } catch (e) {
        ui.error(`Gagal minta pairing code: ${e.message}`);
      }
    }, 3000);
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CONNECTION UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      ui.connecting();
    }

    if (connection === "open") {
      const botNumber = sock.user?.id?.split(":")[0] || "";
      ui.connected(botNumber);

      // ── Load plugin setelah connect ──
      try {
        await loadPlugins();
      } catch (e) {
        ui.error(`Gagal load plugin: ${e.message}`);
      }

      // ── Cek expired sewa & plan ──
      try {
        checkSewaExpired();
        checkExpired();
      } catch (e) {
        console.error("[BOOT] Cek expired error:", e.message);
      }

      // ── Cek semua grup yang bot ada di dalamnya ──
      setTimeout(async () => {
        try {
          const groups = await sock.groupFetchAllParticipating();
          for (const id of Object.keys(groups || {})) {
            await handleGroup(sock, id);
          }
        } catch (e) {
          console.error("[BOOT] Cek grup error:", e.message);
        }
      }, 5000);
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const reason = DisconnectReason[statusCode] || statusCode;

      ui.disconnected(reason);

      const shouldReconnect =
        settings.autoReconnect && statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        ui.reconnecting();
        setTimeout(() => start(), 3000);
      } else if (statusCode === DisconnectReason.loggedOut) {
        ui.error("Logged out. Hapus folder session dan pairing ulang.");
      }
    }
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SAVE CREDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("creds.update", saveCreds);


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  MESSAGES UPSERT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("messages.upsert", async (chatUpdate) => {
    await messageUpsert(sock, chatUpdate, null);
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENT: BOT MASUK GRUP BARU
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("group-participants.update", async (update) => {
    const { id: idGrup, participants, action } = update;

    if (action !== "add") return;
    if (!participants || !participants.length) return;

    const botNumber = sock.user?.id?.split(":")[0] || "";

    // Cek apakah bot yang di-add
    const botAdded = participants.some((p) => {
      const pClean = String(p).split("@")[0].split(":")[0];
      return pClean === botNumber;
    });

    if (!botAdded) return;

    console.log(`[SEWA] 🤖 Bot di-add ke grup: ${idGrup}`);
    await handleGroup(sock, idGrup);
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENT: GROUPS UPSERT (bot join grup)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("groups.upsert", async (groups) => {
    for (const g of groups) {
      if (!g.id) continue;
      console.log(`[SEWA] 📥 Grup baru terdeteksi: ${g.id}`);
      await handleGroup(sock, g.id);
    }
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENT: GROUPS UPDATE (nama grup berubah, dll)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("groups.update", async (updates) => {
    for (const u of updates) {
      if (u.id && u.subject) {
        console.log(`[SEWA] 📝 Grup ${u.id} update: ${u.subject}`);
      }
    }
  });


  return sock;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RUN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

start().catch((e) => {
  ui.error(`Fatal: ${e.message}`);
  process.exit(1);
});