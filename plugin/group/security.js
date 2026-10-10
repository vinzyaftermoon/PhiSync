// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Group: Security
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  getGroupSettings,
  updateGroupSettings
} from "../../engine/lib/groupSettings.js";

function parseOnOff(arg) {
  const s = String(arg || "").toLowerCase();
  if (s === "--on" || s === "on") return true;
  if (s === "--off" || s === "off") return false;
  return null;
}

function statusText(v) {
  return v ? "✅ ON" : "❌ OFF";
}

export default {
  meta: {
    name: "groupSecurity",
    command: ["welcome", "leave", "antilink", "antitoxic"],
    category: "group",
    section: "🛡️ KEAMANAN & SETTING",
    description: "Setting keamanan grup",
    owner: false,
    premium: false,
    group: true,
    private: false,
    admin: true
  },

  async run(sock, m, { args, command }) {
    const state = parseOnOff(args[0]);

    if (state === null) {
      // Tampil status
      const s = getGroupSettings(m.chat);
      const map = {
        welcome: s.welcome,
        leave: s.leave,
        antilink: s.antiLink,
        antitoxic: s.antiToxic
      };
      const current = map[command];

      return m.reply(
        `⚙️ *${command.toUpperCase()}*\n\n` +
        `> Status sekarang: ${statusText(current)}\n\n` +
        `*Cara pakai:*\n` +
        `> .${command} --on\n` +
        `> .${command} --off`
      );
    }

    const map = {
      welcome: "welcome",
      leave: "leave",
      antilink: "antiLink",
      antitoxic: "antiToxic"
    };
    const field = map[command];

    updateGroupSettings(m.chat, { [field]: state });

    return m.reply(
      `✅ *${command.toUpperCase()}* ${statusText(state)}\n\n` +
      `> ${command} berhasil di-${state ? "aktifkan" : "nonaktifkan"}`
    );
  }
};