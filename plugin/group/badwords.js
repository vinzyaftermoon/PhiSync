// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Group: Badwords
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import fs from "node:fs";
import path from "node:path";

const BADWORDS_PATH = path.resolve("./database/global/badwords.json");

function readBadwords() {
  try {
    if (!fs.existsSync(BADWORDS_PATH)) {
      fs.writeFileSync(BADWORDS_PATH, "[]", "utf8");
      return [];
    }
    return JSON.parse(fs.readFileSync(BADWORDS_PATH, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeBadwords(data) {
  fs.writeFileSync(BADWORDS_PATH, JSON.stringify(data, null, 2), "utf8");
}

export default {
  meta: {
    name: "badwords",
    command: ["addbadwords", "delbadwords", "listbadwords"],
    category: "group",
    section: "🛡️ KEAMANAN & SETTING",
    description: "Manage badwords grup",
    owner: false,
    premium: false,
    group: true,
    private: false,
    admin: true
  },

  async run(sock, m, { args, command }) {

    // ━━━ .addbadwords ━━━
    if (command === "addbadwords") {
      const words = args.map((w) => String(w).toLowerCase()).filter(Boolean);
      if (!words.length) {
        return m.reply(`❌ Format: *.addbadwords <kata1> <kata2> ...*`);
      }

      const data = readBadwords();
      let added = 0;
      for (const w of words) {
        if (!data.includes(w)) {
          data.push(w);
          added++;
        }
      }
      writeBadwords(data);

      return m.reply(
        `✅ *Badwords ditambahkan!*\n\n` +
        `> Total ditambah: *${added}*\n` +
        `> Total badwords: *${data.length}*`
      );
    }

    // ━━━ .delbadwords ━━━
    if (command === "delbadwords") {
      const words = args.map((w) => String(w).toLowerCase()).filter(Boolean);
      if (!words.length) {
        return m.reply(`❌ Format: *.delbadwords <kata1> <kata2> ...*`);
      }

      const data = readBadwords();
      const before = data.length;
      const filtered = data.filter((w) => !words.includes(w));
      writeBadwords(filtered);

      return m.reply(
        `✅ *Badwords dihapus!*\n\n` +
        `> Total dihapus: *${before - filtered.length}*\n` +
        `> Sisa badwords: *${filtered.length}*`
      );
    }

    // ━━━ .listbadwords ━━━
    if (command === "listbadwords") {
      const data = readBadwords();
      if (!data.length) return m.reply(`📋 *Belum ada badwords.*`);

      return m.reply(
        `📋 *LIST BADWORDS* (${data.length})\n\n` +
        data.map((w, i) => `> ${i + 1}. ${w}`).join("\n")
      );
    }
  }
};