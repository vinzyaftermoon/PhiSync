// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Owner: Bot Settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  getSewaSettings,
  setSewaSettings,
  getMaintenance,
  setMaintenance
} from "../../engine/lib/botSettings.js";

function parseOnOff(arg) {
  const s = String(arg || "").toLowerCase();
  if (s === "on" || s === "--on" || s === "true") return true;
  if (s === "off" || s === "--off" || s === "false") return false;
  return null;
}

function statusText(v) {
  return v ? "✅ ON" : "❌ OFF";
}

export default {
  meta: {
    name: "botSettings",
    command: ["sewa", "maintenance"],
    category: "owner",
    section: "⚙️ GLOBAL CONTROL",
    description: "Manage setting bot",
    owner: true,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m, { args, command }) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .sewa
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "sewa") {
      const sub = String(args[0] || "").toLowerCase();
      const current = getSewaSettings();

      // ── .sewa (tanpa arg) atau .sewa status ──
      if (!sub || sub === "status") {
        return m.reply(
          `⚙️ *SEWA SETTINGS*\n\n` +
          `> Sistem Sewa : ${statusText(current.enabled)}\n` +
          `> Auto Kick   : ${statusText(current.autoKick)}\n\n` +
          `*Cara pakai:*\n` +
          `> .sewa on        → aktifin sistem sewa\n` +
          `> .sewa off       → matiin sistem sewa\n` +
          `> .sewa kick on   → aktifin auto-kick\n` +
          `> .sewa kick off  → matiin auto-kick`
        );
      }

      // ── .sewa on/off ──
      if (sub === "on" || sub === "off") {
        const state = sub === "on";
        setSewaSettings({ enabled: state });
        return m.reply(
          `✅ *Sistem Sewa ${state ? "diaktifkan" : "dimatikan"}!*\n\n` +
          `> Status: ${statusText(state)}`
        );
      }

      // ── .sewa kick on/off ──
      if (sub === "kick") {
        const state = parseOnOff(args[1]);
        if (state === null) {
          return m.reply(
            `❌ Format salah!\n\n> .sewa kick on\n> .sewa kick off`
          );
        }
        setSewaSettings({ autoKick: state });
        return m.reply(
          `✅ *Auto-Kick ${state ? "diaktifkan" : "dimatikan"}!*\n\n` +
          `> Status: ${statusText(state)}` +
          (state ? `\n\n> ⚠️ Grup asing bakal di-kick 😠` : "")
        );
      }

      return m.reply(
        `❌ Subcommand *${sub}* nggak dikenal!\n\n` +
        `> .sewa status\n> .sewa on\n> .sewa off\n> .sewa kick on\n> .sewa kick off`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  .maintenance
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === "maintenance") {
      const sub = String(args[0] || "").toLowerCase();
      const current = getMaintenance();

      // ── .maintenance (tanpa arg) ──
      if (!sub) {
        return m.reply(
          `⚙️ *MAINTENANCE*\n\n` +
          `> Status : ${statusText(current.enabled)}\n\n` +
          `*Pesan:*\n${current.message}\n\n` +
          `*Cara pakai:*\n` +
          `> .maintenance on\n` +
          `> .maintenance off\n` +
          `> .maintenance set <pesan>`
        );
      }

      // ── .maintenance on/off ──
      if (sub === "on" || sub === "off") {
        const state = sub === "on";
        setMaintenance({ enabled: state });
        return m.reply(
          `✅ *Maintenance ${state ? "diaktifkan" : "dimatikan"}!*\n\n` +
          `> Status: ${statusText(state)}` +
          (state ? `\n\n> ⚠️ Semua command user bakal diblokir!` : "")
        );
      }

      // ── .maintenance set <pesan> ──
      if (sub === "set") {
        const pesan = args.slice(1).join(" ").trim();
        if (!pesan) {
          return m.reply(
            `❌ Format: *.maintenance set <pesan>*\n\n` +
            `Contoh:\n` +
            `> .maintenance set 🛠️ Bot lagi maintenance, sabar ya 😹`
          );
        }
        setMaintenance({ message: pesan });
        return m.reply(
          `✅ *Pesan maintenance diupdate!*\n\n` +
          `> ${pesan}`
        );
      }

      return m.reply(
        `❌ Subcommand *${sub}* nggak dikenal!\n\n` +
        `> .maintenance\n> .maintenance on\n> .maintenance off\n> .maintenance set <pesan>`
      );
    }
  }
};